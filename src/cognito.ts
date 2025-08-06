import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminSetUserMFAPreferenceCommand,
  AdminEnableUserCommand,
  AdminDisableUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminSetUserPasswordCommand,
  AdminUserGlobalSignOutCommand,
} from "@aws-sdk/client-cognito-identity-provider";

// **All AWS Functions used as Promises**
// TODO move all cognito calls here and turn them into promises

const cognitoidentityserviceprovider = new CognitoIdentityProviderClient({
  region: "ap-south-1",
});

export async function adminGetUser(Username: string) {
  const params = {
    UserPoolId: process.env.USER_POOL_ID!,
    Username,
  };

  const command = new AdminGetUserCommand(params);
  return await cognitoidentityserviceprovider.send(command);
}

export async function adminRemoveMfa(Username: string) {
  const params = {
    UserPoolId: process.env.USER_POOL_ID!,
    Username,
    SoftwareTokenMfaSettings: {
      Enabled: false,
    },
  };

  const command = new AdminSetUserMFAPreferenceCommand(params);
  return await cognitoidentityserviceprovider.send(command);
}

export async function adminEnableUser(id: string, enabled: boolean = true) {
  const params = {
    UserPoolId: process.env.USER_POOL_ID!,
    Username: id,
  };

  const command = enabled
    ? new AdminEnableUserCommand(params)
    : new AdminDisableUserCommand(params);

  return await cognitoidentityserviceprovider.send(command);
}

export async function adminUpdateUser(
  sub: string,
  given_name: string,
  family_name: string
) {
  const params = {
    UserPoolId: process.env.USER_POOL_ID!,
    Username: sub,
    UserAttributes: [
      {
        Name: "given_name",
        Value: given_name,
      },
      {
        Name: "family_name",
        Value: family_name,
      },
    ],
  };

  const command = new AdminUpdateUserAttributesCommand(params);
  return await cognitoidentityserviceprovider.send(command);
}

export const adminResetUsersPassword = async (
  Username: string,
  Password: string = "ABCdef321"
) => {
  const params = {
    UserPoolId: process.env.USER_POOL_ID!,
    Username,
    Permanent: false,
    Password,
  };

  const passwordCommand = new AdminSetUserPasswordCommand(params);
  const passwordResponse = await cognitoidentityserviceprovider.send(passwordCommand);

  const params2 = {
    UserPoolId: process.env.USER_POOL_ID!,
    Username,
    UserAttributes: [
      {
        Name: "email_verified",
        Value: "true",
      },
    ],
  };

  const emailVerifiedCommand = new AdminUpdateUserAttributesCommand(params2);
  const attributeResponse = await cognitoidentityserviceprovider.send(emailVerifiedCommand);

  return { passwordResponse, attributeResponse };
};

export async function userSignOut(username: string) {
  const params = {
    UserPoolId: process.env.USER_POOL_ID!,
    Username: username,
  };

  const command = new AdminUserGlobalSignOutCommand(params);
  return await cognitoidentityserviceprovider.send(command);
}
