import { strict as assert } from "assert";
import { Request, Response } from "express";
import { isArray } from "lodash";
import { In, Repository } from "typeorm";
import AppDataSource from "../ormconfig";

// import * as search from "../search";
import { addToMany, removeFromMany } from "./utils";

const defaultIndexByFn = (obj) => {
  return {
    id: obj.id,
    name: obj.name,
    type: obj.type,
  };
};

export const all = (Entity, options = {}, transform = (t) => t) => async (
  request: Request,
  response: Response
) => {
  try {
    // React admin list query components
    const sort = JSON.parse(typeof request.query.sort === 'string' ? request.query.sort : '"id","ASC"');
    const filter = JSON.parse(typeof request.query.filter === 'string' ? request.query.filter : '{}');

    // If where options passed through the combine with existing
    let where = {};
    if (options["where"] && isArray(options["where"])) {
      // If array then we need to merge in default where in each OR clause
      where = options["where"].map((clause) => ({
        ...clause,
      }));
    } else if (options["where"]) {
      // Else assume  object then merge in to the single where clause
      where = {
        ...options["where"],
      };
    }

    if (filter.id) {
      where = {
        ...where,
        id: In(filter.id.map((val) => val?.id || val)),
      };
    }

    let range, skip, take;
    if (request.query.range) {
      // If range (admin ui)
      range = JSON.parse(typeof request.query.range === 'string' ? request.query.range : '[0,9]');
      (skip = range[0]), (take = range[1] - range[0] + 1);
    } else if (request.query.limit || request.query.offset) {
      // Else if limit/offset (app)
      let { limit, offset } = request.query;
      skip = offset;
      take = limit;
    }

    const repository = AppDataSource.getRepository(Entity);
    const [result, total] = await repository.findAndCount({
      ...options,
      order: {
        [sort[0]]: sort[1],
      },
      skip,
      take,
      where,
    });
    response.header("Access-Control-Expose-Headers", "Content-Range");
    if (range) {
      response.header(
        "Content-Range",
        `posts ${range[0]}-${range[1]}/${total}`
      );
    }
    return response.send(transform(result));
  } catch ({ message }) {
    response.status(500);
    response.send({ message });
  }
};

const _get = async (Entity, id, options = {}, transform = (t) => t) => {
  const repository = AppDataSource.getRepository(Entity);
  const result = await repository.findOneBy({ id });
  return transform(result);
};

export const get = (Entity, options = {}, transform = (t) => t) => async (
  request: Request,
  response: Response
) => {
  try {
    const { id } = request.params;
    const result = await _get(Entity, id, options, transform);
    return response.send(result);
  } catch ({ message }) {
    response.status(500);
    response.send({ message });
  }
};

export const add = (Entity, options = {}) => async (
  request: Request,
  response: Response
) => {
  try {
    let required = options["required"] || [];
    const manyToMany = options["manyToMany"];
    required.forEach((field) => {
      assert(request.body[field] !== undefined, `${field} required`);
    });

    let values = request.body || {};
    if (options["values"]) {
      values = {
        ...values,
        ...options["values"],
      };
    }

    const repository = AppDataSource.getRepository(Entity);
    const obj = await repository.create(values);
    const result = await repository.save(obj);

    if (manyToMany) {
      await Promise.all(
        manyToMany.map(async (field) => {
          const toAdd = request.body[field];
          await addToMany(Entity, field, result["id"], toAdd);
        })
      );
    }

    const newObj = await _get(Entity, result["id"], options);

    return response.send(newObj);
  } catch ({ message }) {
    response.status(500);
    response.send({ message });
  }
};

export const del = (Entity, options = {}) => async (
  request: Request,
  response: Response
) => {
  try {
    const { id } = request.params;
    const repository = AppDataSource.getRepository(Entity);
    const obj = await repository.findOneBy({ id });
    assert(obj !== undefined, "Entity not found");

    const result = await repository.remove(obj);

    return response.send({
      ...(result as object),
      id,
    });
  } catch ({ message }) {
    response.status(500);
    response.send({ message });
  }
};

export const update = (Entity, options = {}) => async (
  request: Request,
  response: Response
) => {
  try {
    const { id } = request.params;
    const fields = options["fields"];
    const manyToMany = options["manyToMany"];
    const repository = AppDataSource.getRepository(Entity);
    const obj = await repository.findOneBy({ id });
    assert(obj !== undefined, "Entity not found");

    let result;
    if (fields) {
      // Only update specific fields
      const params = Object.keys(request.body)
        .filter((f) => fields.includes(f))
        .reduce((acc, f) => {
          acc[f] = request.body[f];
          return acc;
        }, {});

      result = await repository.update({ id }, params);
    } else {
      // Try to update all in request.body
      // Remove org/sub from update statemet so admin editing doesnt change
      // org/sub
      const { sub, organisation, newUser, newOrg, ...args } = request.body;
      if (newUser) {
        // const user = await adminGetUser(newUser);
        args.sub = {
          sub: newUser,
        };
      }

      if (newOrg) {
        args.organisation = {
          id: newOrg,
        };
      }

      await repository.merge(obj, args);
      result = await repository.save(obj);
    }

    if (manyToMany) {
      await Promise.all(
        manyToMany.map(async (field) => {
          const existing = obj[field].map((o) => o.id);
          const newValues = request.body[field];
          const toRemove = existing.filter((eo) => !newValues.includes(eo));
          const toAdd = newValues.filter((o) => !existing.includes(o));
          await addToMany(Entity, field, id, toAdd);
          await removeFromMany(Entity, field, id, toRemove);
        })
      );
    }

    const newObj = await _get(Entity, id, options);

    if (response) {
      return response.send(newObj);
    } else {
      return newObj;
    }
  } catch ({ message }) {
    response.status(500);
    response.send({ message });
  }
};

export const addToRelation = (
  Entity,
  { idField, relation, relationIdField }
) => async (request: Request, response: Response) => {
  try {
    let id = request.body[idField];
    let relationId = request.body[relationIdField];
    let result = await AppDataSource.getRepository(Entity)
      .createQueryBuilder()
      .relation(relation)
      .of(id)
      .add(relationId);
    return response.send({ id });
  } catch ({ message }) {
    response.status(500);
    response.send({ message });
  }
};

export const deleteFromRelation = (
  Entity,
  { idField, relation, relationIdField }
) => async (request: Request, response: Response) => {
  try {
    let id = request.params[idField];
    let relationId = request.params[relationIdField];
    let result = await AppDataSource.getRepository(Entity)
      .createQueryBuilder()
      .relation(relation)
      .of(id)
      .remove(relationId);
    return response.send({ id });
  } catch ({ message }) {
    response.status(500);
    response.send({ message });
  }
};