import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminListGroupsForUserCommand, ListUsersCommand, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand, AdminGetUserCommand, AdminDisableUserCommand } from "@aws-sdk/client-cognito-identity-provider";

import { Request, Response } from "express";
import { defaultTo, find, flow, map, get as _get } from "lodash/fp";
import { strict as assert } from "assert";
import { adminGetUser, adminResetUsersPassword, userSignOut } from "../cognito";
import AppDataSource from "../ormconfig";

import User from "../entity/user";
import Organisation from "../entity/organisation";

// AWS Cognito v3 setup
const cognitoidentityserviceprovider = new CognitoIdentityProviderClient({
  region: "ap-south-1",
});

export async function add(request: Request, response: Response) {
  try {
    // Validate input
    assert(request.body.email !== undefined, "`email` required");
    assert(request.body.first_name !== undefined, "`first_name` required");
    assert(request.body.last_name !== undefined, "`last_name` required");

    if (!process.env.USER_POOL_ID) {
      return response.status(500).send({ message: "USER_POOL_ID not set" });
    }

    // Find current user's org
    const currentUser = await adminGetUser(request.body.sub.sub);
    const organisation = flow(
      find({ Name: "name" }),
      _get("Value")
    )(currentUser["UserAttributes"]);

    const userRepo = AppDataSource.getRepository(User);
    const orgRepo = AppDataSource.getRepository(Organisation);

    let userCount = await userRepo.count({ where: { name: organisation, disabled: false } });

    const orgEntity = await orgRepo.findOne({ where: { id: organisation } });
    if (!orgEntity)
      return response.status(404).send({ message: "Organisation not found" });

    const maxUsers = orgEntity.max_users;

    if (++userCount > maxUsers) {
      return response.status(400).send({
        message: "You already have the maximum number of users allowed on your account",
      });
    }

    const params = {
  UserPoolId: process.env.USER_POOL_ID,
  Username: request.body.email,
  UserAttributes: [
    { Name: "given_name", Value: `${request.body.first_name}` },
    { Name: "family_name", Value: `${request.body.last_name}` },
    { Name: "name", Value: organisation },
  ],
};
const command = new AdminCreateUserCommand(params);
const data = await cognitoidentityserviceprovider.send(command);
response.status(200).send(data);
  } catch (error: any) {
    response.status(400).send({ message: error.message });
  }
}

export const listGroupsForUser = async (username: string) => {
  if (!process.env.USER_POOL_ID) {
    throw new Error("USER_POOL_ID not set");
  }

  const params = {
  UserPoolId: process.env.USER_POOL_ID,
  Username: username,
};
const command = new AdminListGroupsForUserCommand(params);
const data = await cognitoidentityserviceprovider.send(command);
return {
  Groups: map(_get("GroupName"))(data.Groups || [])
};
};

// List users
export async function all(request: Request, response: Response) {
  try {
    const currentUser = await adminGetUser(request.body.sub.sub);
    const organisation = flow(
      find({ Name: "name" }),
      _get("Value")
    )(currentUser["UserAttributes"]);

    const params = {
  UserPoolId: process.env.USER_POOL_ID!,
  Filter: `name = "${organisation}"`,
  Limit: defaultTo(20, Math.min(20, Number(request.query.amount))),
  PaginationToken: request.query.PaginationToken as string | undefined,
};
const command = new ListUsersCommand(params);
const data = await cognitoidentityserviceprovider.send(command);
const users = await Promise.all(
  (data.Users || []).filter((x: any) => x.Enabled).map(async (user: any) => {
    const groups = await listGroupsForUser(user.Username!);
    return { ...user, ...(groups as object) };
  })
);

    response.status(200).send({
      Users: users,
      PaginationToken: data.PaginationToken,
    });
  } catch (error: any) {
    console.log(error?.message);
    response.status(400).send({ message: error?.message });
  }
}

// Add group to user
export async function addGroup(request: Request, response: Response) {
  try {
    const groupName = request.body.group;
    const params = {
  UserPoolId: process.env.USER_POOL_ID!,
  GroupName: groupName,
  Username: request.params.Username,
};
const command = new AdminAddUserToGroupCommand(params);
await cognitoidentityserviceprovider.send(command);
await userSignOut(request.params.Username);
response.status(200).send({ message: "Group added and user signed out" });
  } catch (error: any) {
    response.status(400).send(error);
  }
}

// Remove group from user
export async function removeGroup(request: Request, response: Response) {
  try {
    const groupName = request.body.group;
    const params = {
  UserPoolId: process.env.USER_POOL_ID!,
  GroupName: groupName,
  Username: request.params.Username,
};
const command = new AdminRemoveUserFromGroupCommand(params);
await cognitoidentityserviceprovider.send(command);
await userSignOut(request.params.Username);
response.status(200).send({ message: "Group removed and user signed out" });
  } catch (error: any) {
    response.status(400).send(error);
  }
}

// Get user
export async function get(request: Request, response: Response) {
  try {
    const params = {
  UserPoolId: process.env.USER_POOL_ID!,
  Username: request.params.Username,
};
const command = new AdminGetUserCommand(params);
const data = await cognitoidentityserviceprovider.send(command);
const groups = await listGroupsForUser(data.Username!);
response.status(200).send({ ...data, ...(groups as object) });
  } catch (error: any) {
    response.status(400).send(error);
  }
}

// Delete (disable) user
export async function del(request: Request, response: Response) {
  try {
    const params = {
  UserPoolId: process.env.USER_POOL_ID!,
  Username: request.params.Username,
};
const command = new AdminDisableUserCommand(params);
await cognitoidentityserviceprovider.send(command);
const repository = AppDataSource.getRepository(User);
await repository.update(
  { sub: request.params.Username },
  { disabled: true }
);
response.status(200).send({ message: "User disabled" });
  } catch (error: any) {
    response.status(400).send(error);
  }
}

export const resetPassword = async (request: Request, response: Response) => {
  try {
    // check current user can reset password
    let userId = request.body.sub.sub;
    const id = request.params.Username;
    const password = request.body.TemporaryPassword;

    const currentUser = await adminGetUser(userId);
    // get the organisation of the user
    const organisation = flow(
      find({ Name: "name" }),
      _get("Value")
    )(currentUser["UserAttributes"]);

    const changingUser = await adminGetUser(id);
    const changingUserOrganisation = flow(
      find({ Name: "name" }),
      _get("Value")
    )(changingUser["UserAttributes"]);

    // check if the user is in the same organisation
    if (organisation !== changingUserOrganisation) {
      response.status(403).send({ message: "Not allowed to edit this user" });
      return;
    }

    await adminResetUsersPassword(id, password);
    response.status(200).send();
  } catch (error: any) {
    response.status(400).send({ message: error?.message });
  }
};