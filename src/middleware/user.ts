import { Request, Response } from "express";
import { strict as assert } from "assert";
import AppDataSource  from "../ormconfig";
import { adminGetUser } from "../cognito";
import User from "../entity/user";
import { convertUserAttributes } from "../user-attributes";

export default async function (
  request: Request,
  response: Response,
  next: Function
) {
  const { sub } = request.body;

  if (!sub) {
    return next(); // No Cognito sub, continue without user check
  }

  const repository = AppDataSource.getRepository(User);

  try {
    let item = await repository.findOne({ where: { sub } });

    if (!item) {
      const result = await adminGetUser(sub);
      const converted = convertUserAttributes(result.UserAttributes);
      const newItem = repository.create(converted);
      await repository.save(newItem);

      request.body.organisation_id = converted.name;
      request.body.sub = newItem;
      return next();
    }

    assert(item !== undefined, "User not found");
    request.body.organisation_id = item.name;
    return next();
  } catch (error: any) {
    console.error("error", error);
    return response.status(400).send({ message: error.message });
  }
}
