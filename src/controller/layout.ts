import { Request, Response } from "express";
import { DataSource } from "typeorm"; // ✅ New way to work with DB
import { pickBy, identity } from "lodash/fp";
import { strict as assert } from "assert";

import Layout from "../entity/layout";
import * as crud from "./crud";

// ✅ This function adds default values to surfaces if they're missing
export const transformLayout = (layout) => {
  return {
    ...layout,
    surfaces: layout.surfaces.map((surface) => {
      const ret = { ...surface };
      if (!ret.physicalAspectRatio) {
        ret.physicalAspectRatio = ret.wide ? 3.2 : 1.6;
      }

      if (!ret.surfaceDivisions) {
        ret.surfaceDivisions = 1;
      }

      return ret;
    })
  };
};

// ✅ These are the related fields we want to fetch with each Layout
const relations = ["surfaces", "media"];

// ✅ Get all layouts and apply transformLayout to each
export const all = crud.all(Layout, { relations }, (layouts) => {
  return layouts.map(transformLayout);
});

// ✅ Get a single layout and apply transform
export const get = crud.get(Layout, { relations }, transformLayout);

// ✅ Add a layout (requires a name)
export const add = crud.add(Layout, {
  relations,
  required: ["name"]
});

// ✅ Delete a layout
export const del = crud.del(Layout);

// ✅ Update a layout with allowed fields
export const update = crud.update(Layout, {
  relations,
  fields: ["media", "name"]
});
