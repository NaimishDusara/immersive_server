import {
    split,
    flow,
    last,
    mapKeys,
    merge,
    pick,
    replace,
    snakeCase,
    fromPairs,
  } from "lodash/fp";
  
  import { Request, Response } from "express";
  import { adminGetUser } from "../cognito"; // <-- Make sure this path is correct
  
  export default async function headers(
    request: Request,
    response: Response,
    next: Function
  ) {
    const toPick = [
      "context.authorizer.principalId",
      "immersive-interactive-account-id",
      "immersive-interactive-caller",
      "immersive-interactive-cognito-authentication-provider",
      "immersive-interactive-cognito-identity-id",
      "immersive-interactive-cognito_identity-pool-id",
      "immersive-interactive-company",
      "immersive-interactive-email",
      "immersive-interactive-groups",
      "immersive-interactive-principal-id",
      "immersive-interactive-source-ip",
      "immersive-interactive-sub",
      "immersive-interactive-user",
      "immersive-interactive-user-arn",
    ];
  
    // 1. Pick and rename headers
    const headers = flow(
      pick(toPick),
      mapKeys(
        flow(
          replace("immersive-interactive-", ""),
          snakeCase
        )
      )
    )(request.headers);
  
    // 2. Extract sub from Cognito string
    const sub = flow(split("CognitoSignIn:"), last)(
      headers.cognito_authentication_provider
    );
  
    // 3. Identify if this is an admin operation
    const adminFunctions = [
      { url: "/admin/immersive-interactive/experiences", method: "post" },
      { url: "/admin/immersive-interactive/collections", method: "put" },
    ];
  
    const isAdmin = adminFunctions.some(({ url, method }) => {
      return (
        request.originalUrl?.includes(url.replace(/:\w+/g, "")) &&
        request.method.toLowerCase() === method
      );
    });
  
    try {
      if (!isAdmin) {
        // Optional: Enrich user data using Cognito
        let userData = {};
        if (sub) {
          const response = await adminGetUser(sub);
          const userAttributes = response?.UserAttributes || [];
          userData = fromPairs(
            userAttributes.map((attr) => [snakeCase(attr.Name), attr.Value])
          );
        }
  
        request.body = merge(request.body, merge(headers, { sub }, userData));
      } else if (request.body?.sub) {
        request.body.sub = request.body.sub.sub;
      }
  
      next();
    } catch (error) {
      console.error("Failed to enrich headers from Cognito:", error);
      response.status(500).json({ error: "Internal server error" });
    }
  }
  