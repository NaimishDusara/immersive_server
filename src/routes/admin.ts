import {
    add,
    all,
    del,
    get,
    addGroup,
    removeGroup,
    resetPassword,
  } from "../controller/admin";
  
  const Admin = [
    {
      path: "/admin/users/:Username",
      method: "get",
      action: get,
    },
    {
      path: "/admin/users",
      method: "get",
      action: all,
    },
    {
      path: "/admin/users",
      method: "post",
      action: add,
    },
    {
      path: "/admin/users/:Username",
      method: "delete",
      action: del,
    },
    {
      path: "/admin/users/:Username/add-group",
      method: "post",
      action: addGroup,
    },
    {
      path: "/admin/users/:Username/remove-group",
      method: "post",
      action: removeGroup,
    },
    {
      path: "/admin/users/:Username/reset-password",
      method: "post",
      action: resetPassword,
    },
  ];
  
  export default Admin;
      