import { add, del, get, getOrganisation } from "../controller/media";

const Media = [
  {
    path: "/organisation/media",
    method: "get",
    action: getOrganisation,
  },
  {
    path: "/me/media",
    method: "get",
    action: get,
  },
  {
    path: "/me/media",
    method: "get",
    action: get,
  },
  {
    path: "/media/:id",
    method: "delete",
    action: del,
  },
  {
    path: "/media",
    method: "post",
    action: add,
  },
  
];

export default Media;
