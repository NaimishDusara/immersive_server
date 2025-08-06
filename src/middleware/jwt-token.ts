import { Request, Response } from "express";
import * as jwt from "jsonwebtoken";

export default function jwtToken(
  request: Request,
  response: Response,
  next: Function
) {
  const token = request.body?.token || request.query?.token || request.headers?.authorization;

  console.log('JWT TOKEN CHECK:');
  console.log('request.body.token:', request.body?.token);
  console.log('request.query.token:', request.query?.token);
  console.log('request.headers.authorization:', request.headers?.authorization);

  const bearerToken = token && token.startsWith('Bearer ') ? token.slice(7) : token;

  const cognito = jwt.decode(bearerToken);
  (request.body ??= {}).cognito = cognito;
  if (cognito && cognito.sub) {
    request.body.sub = cognito.sub;
  }

  console.log('Decoded token (cognito):', cognito);

  next();
}