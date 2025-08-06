// Utility to convert Cognito UserAttributes array to User entity fields
// Example UserAttributes: [{ Name: 'sub', Value: 'uuid' }, ...]

import User from "../entity/user";

interface CognitoAttribute {
  Name: string;
  Value: string;
}

export default function convertUserAttributes(attributes: CognitoAttribute[]): Partial<User> {
  const user: Partial<User> = {};
  for (const attr of attributes) {
    switch (attr.Name) {
      case "sub":
        user.sub = attr.Value;
        break;
      case "name":
        user.name = attr.Value;
        break;
      case "given_name":
        user.given_name = attr.Value;
        break;
      case "family_name":
        user.family_name = attr.Value;
        break;
      // Add more mappings as needed
      default:
        break;
    }
  }
  return user;
}
