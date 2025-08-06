import { flow, keyBy, mapValues, get } from "lodash/fp";

export const convertUserAttributes = (attributes) =>
  flow(keyBy(get("Name")), mapValues(get("Value")))(attributes);
