import {
    add,
    all,
    allOwnOrg,
    del,
    deviceAdd,
    deviceDel,
    get,
    update,
  } from "../controller/space";
  
  const Space = [
    {
      path: "/admin/immersive-interactive/spaces",
      method: "get",
      action: all,
    },
    {
      path: "/admin/immersive-interactive/spaces",
      method: "post",
      action: add,
    },
    {
      path: "/admin/immersive-interactive/spaces/:id",
      method: "get",
      action: get,
    },
    {
      path: "/admin/immersive-interactive/spaces/:id",
      method: "put",
      action: update,
    },
    {
      path: "/admin/immersive-interactive/spaces/:id",
      method: "delete",
      action: del,
    },
    {
      path: "/admin/immersive-interactive/space-devices",
      method: "post",
      action: deviceAdd,
    },
    {
      path: "/admin/immersive-interactive/space-devices/:space/:device",
      method: "delete",
      action: deviceDel,
    },
    {
      path: "/spaces",
      method: "get",
      action: allOwnOrg,
    },
    {
      path: "/spaces/:id",
      method: "get",
      action: get,
    },
  ];
  
  export default Space;
  