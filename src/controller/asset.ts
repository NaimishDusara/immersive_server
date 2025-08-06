import { Request, Response } from "express";
import { flow } from "lodash/fp";
import { DataSource, Repository } from "typeorm";
import  AppDataSource  from "../ormconfig"; // You'll need to create this

import Asset from "../entity/asset";
import * as crud from "./crud";
import { andWhereMeta, addPagination, wherePrivacy } from "./utils";
import { strict as assert } from "assert";
import Media from "../entity/media";

const relations = ["media", "media_original", "organisation", "sub", "tags"];

// Admin methods
export const all = async (request: Request, response: Response) => {
  const [sortColumn, sortDir] = JSON.parse(
    request.query.sort || '["id","ASC"]'
  );
  const type = request.query.type;
  let query = AppDataSource.getRepository(Asset).createQueryBuilder("asset");

  // Having to user query builder here to filter on tag as M2M
  query = query.orderBy(`asset.${sortColumn}`, sortDir);
  const sort = JSON.parse(request.query.sort || '["id","ASC"]');

  let range, skip, take;
  if (request.query.range) {
    // If range (admin ui)
    range = JSON.parse(request.query.range || "[0,9]");
    (skip = range[0]), (take = range[1] - range[0] + 1);
  } else if (request.query.limit || request.query.offset) {
    // Else if limit/offset (app)
    let { limit, offset } = request.query;
    skip = offset;
    take = limit;
  }

  query = joinAssetDetails(query);
  query = query.orderBy(`asset.${sortColumn}`, sortDir);
  query = query.skip(skip);
  query = query.take(take);

  let total = await query.getCount();
  let result = await query.getMany();

  if (range) {
    response.header("Access-Control-Expose-Headers", "Content-Range");
    response.header("Content-Range", `posts ${range[0]}-${range[1]}/${total}`);
  }

  return response.send(result);
};

const allByType = (type) =>
  crud.all(Asset, {
    relations,
    where: {
      type: type,
    },
  });

export const get = async (request: Request, response: Response) => {
  const { id } = request.params;
  let query = AppDataSource.getRepository(Asset).createQueryBuilder("asset");
  const newObj = await flow(
    (q) => q.where("asset.id = :id", { id }),
    joinAssetDetails,
    (q) => q.getOne()
  )(query);

  response.send(newObj);
};

export const add = async (request: Request, response: Response) => {
  try {
    let required = ["media", "privacy"];
    required.forEach((field) => {
      assert(request.body[field] !== undefined, `${field} required`);
    });

    let values = request.body || {};

    values = {
      ...values,
      organisation: request.body.organisation_id,
    };

    const repository = AppDataSource.getRepository(Asset);
    const obj = repository.create(values);
    const result = await repository.save(obj);

    // Use querybuilder as findOne with `relations` messed up original_filename
    // field when joining on media and original_media
    let query = AppDataSource.getRepository(Asset).createQueryBuilder("asset");
    const newObj = await flow(
      (q) => q.where("asset.id = :id", { id: result["id"] }),
      joinAssetDetails,
      (q) => q.getOne()
    )(query);

    return response.send(newObj);
  } catch ({ message }) {
    response.status(500);
    response.send({ message });
  }
};

export const del = async (request: Request) => {
  let { id } = request.params;
  return crud.del(Asset);
};

export async function reindex(request: Request, response: Response) {
  try {
    const ids = request.body.ids;
    const userId = request.body.sub.sub;

    for (let id of ids) {
      const repository = AppDataSource.getRepository(Asset);
      const asset = await repository.findOne({
        where: { id },
        relations,
      });
    }

    response.status(200).send();
  } catch ({ message }) {
    response.status(400);
    response.send({ message });
  }
}

export const update = async (request: Request, response: Response) => {
  const ret = await crud.update(Asset, {
    relations,
    manyToMany: ["tags"],
    fields: ["media"],
  })(request, response);

  // Use querybuilder as findOne with `relations` messed up original_filename
  // field when joining on media and original_media
  let query = AppDataSource.getRepository(Asset).createQueryBuilder("asset");
  const newObj = await flow(
    (q) =>
      q.where("asset.id = :id", {
        id: request.params.id,
      }),
    joinAssetDetails,
    (q) => q.getOne()
  )(query);

  // update the media.original_filename manually
  newObj.media.original_filename = request.body.media.original_filename;
  // save
  const repository = AppDataSource.getRepository(Media);
  const result = await repository.save(newObj.media);

  return newObj;
};

const joinAssetDetails = (query) =>
  query
    .innerJoinAndSelect("asset.media", "media")
    .innerJoinAndSelect("asset.organisation", "organisation")
    .innerJoinAndSelect("asset.sub", "sub")
    // Have to use alias with diff name otherwise returns `media.original_filename`
    // with incorrect value
    .leftJoinAndSelect("asset.media_original", "media_original_")
    .leftJoinAndSelect("asset.tags", "tags");

// User methods
export const allUser = async (request: Request, response: Response) => {
  const orgId = request.body.organisation_id;
  const userId = request.body.sub.sub;

  const [sortColumn, sortDir] = JSON.parse(
    request.query.sort || '["id","ASC"]'
  );
  const type = request.query.type;
  let query = AppDataSource.getRepository(Asset).createQueryBuilder("asset");
  let result;

  if (request.query.query) {
    // Simple text search implementation without Elasticsearch
    const searchTerm = request.query.query;
    result = await flow(
      joinAssetDetails,
      (q) =>
        q.where(
          "(media.original_filename LIKE :searchTerm OR asset.description LIKE :searchTerm OR asset.title LIKE :searchTerm)",
          { searchTerm: `%${searchTerm}%` }
        ),
      andWhereMeta(
        "asset",
        {
          orgId,
          userId,
        },
        request.query
      ),
      () => {
        if (type) {
          query.andWhere("asset.type = :type", {
            type,
          });
        }
        return query;
      },
      (q) => q.orderBy(`asset.${sortColumn}`, sortDir),
      addPagination(request.query),
      (q) => q.getMany()
    )(query);
  } else {
    // Having to user query builder here to filter on tag as M2M
    joinAssetDetails(query);
    query = query.orderBy(`asset.${sortColumn}`, sortDir);

    result = await flow(
      wherePrivacy("asset", {
        orgId,
        userId,
      }),
      andWhereMeta(
        "asset",
        {
          orgId,
          userId,
        },
        request.query
      ),
      () => {
        if (type) {
          query.andWhere("asset.type = :type", {
            type,
          });
        }
        return query;
      },
      addPagination(request.query),
      (q) => q.getMany()
    )(query);
  }

  response.send(result);
};

const addToWhere = (where, toAdd) => {
  return where.map((clause) => ({
    ...clause,
    ...toAdd,
  }));
};

export const updateUser = async (request: Request, response: Response) => {
  let {
    sub: { sub },
  } = request.body;

  const ret = await crud.update(Asset, {
    where: {
      sub,
    },
    relations,
    manyToMany: ["tags"],
  })(request, null);

  let query = AppDataSource.getRepository(Asset).createQueryBuilder("asset");
  const newObj = await flow(
    (q) =>
      q.where("asset.id = :id", {
        id: request.params.id,
      }),
    joinAssetDetails,
    (q) => q.getOne()
  )(query);

  // update the media.original_filename manually
  newObj.media.original_filename = request.body.media.original_filename;
  // save
  const repository = AppDataSource.getRepository(Media);
  const result = await repository.save(newObj.media);

  response.send(newObj);
};

export const delUser = async (request: Request, response: Response) => {
  let { id } = request.params;
  let {
    sub: { sub },
  } = request.body;
  return crud.del(Asset, { where: { sub } })(request, response);
};
