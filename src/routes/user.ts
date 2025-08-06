import {
    get,
    // savedCollections,
    savedExperiences,
    update,
    // removeMfa,
    enableUser,
    disableUser,
    resetUsersPassword,
  } from "../controller/user";
  
  const User = [
    {
      path: "/me",
      method: "get",
      action: get,
    },
    {
      path: "/me",
      method: "post",
      action: update,
    },
    // {
    //   path: "/admin/immersive-interactive/users/:id/remove-mfa",
    //   method: "post",
    //   action: removeMfa,
    // },
    {
      path: "/admin/immersive-interactive/users/:id/enableUser",
      method: "post",
      action: enableUser,
    },
    {
      path: "/admin/immersive-interactive/users/:id/disableUser",
      method: "post",
      action: disableUser,
    },
    {
      path: "/admin/immersive-interactive/users/:id/resetUsersPassword",
      method: "post",
      action: resetUsersPassword,
    },
  ];
  
  export default User;
  