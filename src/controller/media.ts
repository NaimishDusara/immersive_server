import * as path from "path";
import { Request, Response } from "express";
import { Repository } from "typeorm";
import { strict as assert } from "assert";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import AppDataSource from "../ormconfig";

import Media from "../entity/media";
import Organisation from "../entity/organisation";

export async function get(request: Request, response: Response) {
  try {
    const repository = AppDataSource.getRepository(Media) as Repository<Media>;
    const item = await repository.find({
      relations: ["organisation"],
      where: { sub: request.body.sub },
    });

    response.status(200).send(item);
  } catch ({ message }) {
    response.status(400);
    response.send({ message });
  }
}

export async function createMedia(params) {
  const { name, organisation_id, subDir = "" } = params;

  const extension = path.extname(name);
  const repository = AppDataSource.getRepository(Media) as Repository<Media>;
  const item = await repository.create({
    ...params,
    original_filename: name,
    extension,
    organisation: organisation_id,
  });

  const saved = await repository.save(item);
  const id = saved["id"];
  const filename = `${subDir}${id}${extension}`;

  await AppDataSource.createQueryBuilder()
    .update(Media)
    .set({
      filename,
    })
    .where("id = :id", { id })
    .execute();

  const result = await AppDataSource.createQueryBuilder(Media, "media")
    .where("id = :id", { id })
    .getOne();

  return result;
}

export async function add(request: Request, response: Response) {
  try {
    assert(request.body.name !== undefined, "'name' required");
    request.body.original_filename = request.body.name;
    const fileName = request.body.name;

    const media = await createMedia(request.body);

    response.status(200).send(media);
  } catch ({ message }) {
    console.log(
      `unable to create media for organisation: ${request.body.organisation_id}`
    );
    response.status(400).json({ message });
  }
}

const deleteObjectFromS3 = (params) => {
  return new Promise((resolve, reject) => {
    const s3 = new S3Client({ apiVersion: "2006-03-01" });
    const command = new DeleteObjectCommand(params);
    s3.send(command, (error, data) => {
      if (error) return reject(error);
      resolve(data);
    });
  });
};

export async function del(request: Request, response: Response) {
  try {
    // delete reference in our library
    const repository = AppDataSource.getRepository(Media) as Repository<Media>;
    const item = await repository.findOne({
      where: { filename: request.params.id, sub: request.body.sub },
    });

    assert(item !== undefined, "object not found");
    await AppDataSource.manager.delete(Media, item.id);

    // delete from s3
    const params = {
      Bucket: process.env.IMMERSIVE_INTERACTIVE_ASSETS_BUCKET,
      Key: request.params.id,
    };
    const result = await deleteObjectFromS3(params);

    response.status(200).send(result);
  } catch ({ message }) {
    response.status(400);
    response.send({ message });
  }
}

export async function getOrganisation(request: Request, response: Response) {
  try {
    const result = await AppDataSource.createQueryBuilder(Organisation, "organisation")
      .innerJoinAndSelect("organisation.media", "media")
      .where("organisation.id = :id", { id: request.body.organisation_id })
      .getOne();

    assert(result !== undefined, "No media found");
    const { media } = result;
    response.send(media);
  } catch ({ message }) {
    response.status(400);
    response.send({ message });
  }
}