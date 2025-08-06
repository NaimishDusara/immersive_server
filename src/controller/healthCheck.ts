import { Request, Response } from "express";

export async function get(request: Request, response: Response) {
  response.status(200).send(request.headers);
}
