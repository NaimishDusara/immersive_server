import { Request, Response } from "express";
import  AppDataSource  from "../ormconfig"; // assumes you have a data-source.ts exporting DataSource instance

import Space from "../entity/space";
import * as crud from "./crud";
import { transformLayout } from "./layout";

// Relations to load with Space entity
const relations = [
  "devices",
  "layout",
  "layout.surfaces",
  "layout.media",
  "organisation",
];

// Get all spaces, optionally filtered by organisationId
export const all = (request: Request, response: Response) => {
  const filter = JSON.parse(request.query.filter as string);

  let method;
  if (filter.organisationId) {
    method = allFromOrg(filter.organisationId);
  } else {
    method = crud.all(Space, { relations });
  }
  return method(request, response);
};

// Get spaces for the org ID in request body
export const allOwnOrg = (request: Request, response: Response) => {
  let { organisation_id } = request.body;
  return allFromOrg(organisation_id)(request, response);
};

// Generic org-filtered loader
const allFromOrg = (organisationId: string) =>
  crud.all(Space, {
    relations,
    where: {
      organisation: {
        id: organisationId,
      },
    },
  });

// Get a specific space with deep relations
export const get = crud.get(
  Space,
  {
    relations: [
      "devices",
      "devices.thumbnail",
      "layout",
      "layout.surfaces",
      "media",
      "organisation",
    ],
  },
  (result) => ({
    ...result,
    layoutId: result.layout.id,
    layout: transformLayout(result.layout),
  })
);

// Add a new space
export const add = crud.add(Space, {
  required: ["name", "layout", "organisation"],
  relations: ["organisation"],
});

// Delete a space
export const del = crud.del(Space);

// Update a space
export const update = crud.update(Space, {
  required: ["name", "layout", "organisation"],
  relations: ["organisation"],
});

// Add a device to a space
export const deviceAdd = crud.addToRelation(Space, {
  idField: "space",
  relation: "devices",
  relationIdField: "device",
});

// Remove a device from a space
export const deviceDel = crud.deleteFromRelation(Space, {
  idField: "space",
  relation: "devices",
  relationIdField: "device",
});
