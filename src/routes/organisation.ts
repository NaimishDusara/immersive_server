import {
    add,
    del,
    all,
    get,
    getUser,
    update,
    updateUser,
  } from "../controller/organisation";
  
  const Organisations = [
    {
      path: "/admin/immersive-interactive/organisations",
      method: "get",
      action: all,
    },
    {
      path: "/admin/immersive-interactive/organisations",
      method: "post",
      action: add,
    },
    {
      path: "/admin/immersive-interactive/organisations/:id",
      method: "get",
      action: get,
    },
    {
      path: "/admin/immersive-interactive/organisations/:id",
      method: "put",
      action: update,
    },
    {
      path: "/admin/immersive-interactive/organisations/:id",
      method: "delete",
      action: del,
    },
    {
      path: "/organisation",
      method: "get",
      action: getUser,
    },
    {
      path: "/admin/organisation",
      method: "put",
      action: updateUser,
    },
  ];
  
  export default Organisations;
  