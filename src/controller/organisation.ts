import { Request, Response } from "express";
import  AppDataSource  from "../ormconfig";
import { strict as assert } from "assert";

import Organisation from "../entity/organisation";
import * as crud from "./crud";

let options = { where: { can_delete: true } };
export const all = crud.all(Organisation);
export const get = crud.get(Organisation, {
  relations: ["spaces"],
});
export const add = crud.add(Organisation, { required: ["name"] });
export const del = crud.del(Organisation);
export const update = crud.update(Organisation);

export async function getUser(request: Request, response: Response) {
  try {
    const repository = AppDataSource.getRepository(Organisation);
    const item = await repository.findOne({
      where: { id: request.body.organisation_id },
    });

    response.status(200).send(item);
  } catch ({ message }) {
    response.status(400);
    response.send({ message });
  }
}

export async function updateUser(request: Request, response: Response) {
  try {
    const repository = AppDataSource.getRepository(Organisation);
    let item = await repository.findOne({
      where: { id: request.body.organisation_id },
    });
    const { sub, organisation, ...args } = request.body;
    await repository.merge(item, args);
    const result = await repository.save(item);
    item = await repository.findOne({
      where: { id: request.body.organisation_id },
    });
    return response.send(item);

    response.status(200).send(item);
  } catch ({ message }) {
    response.status(400);
    response.send({ message });
  }
}
