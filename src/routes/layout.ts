import { add, all, del, get, update } from "../controller/layout";

const Layout = [
  {
    path: "/admin/immersive-interactive/layouts",
    method: "get",
    action: all,
  },
  {
    path: "/admin/immersive-interactive/layouts",
    method: "post",
    action: add,
  },
  {
    path: "/admin/immersive-interactive/layouts/:id",
    method: "get",
    action: get,
  },
  {
    path: "/admin/immersive-interactive/layouts/:id",
    method: "put",
    action: update,
  },
  {
    path: "/admin/immersive-interactive/layouts/:id",
    method: "delete",
    action: del,
  },
  {
    path: "/layouts",
    method: "get",
    action: all,
  },
  {
    path: "/layouts/:id",
    method: "get",
    action: get,
  },
];

export default Layout;
