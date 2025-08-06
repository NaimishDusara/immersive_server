import "reflect-metadata";
import { DataSource } from "typeorm";
import AppDataSource from "./ormconfig";
import express, { Request, Response } from "express";
import dotenv from 'dotenv';
dotenv.config();
// import bodyParser from "body-parser";
// import cors from "cors";
// import compression from "compression";

console.log("starting project");
console.log("creating application");

const app = express();

import jwtToken from "./middleware/jwt-token";
import userMiddleware from "./middleware/user";

app.use(jwtToken);
app.use(userMiddleware);
app.use(express.json()); // Add this line
app.use(express.urlencoded({ extended: true }));

import Routes from "./routes";

// Register all routes dynamically
Routes.forEach((route) => {
  (app as any)[route.method](
    route.path,
    (request: Request, response: Response, next: Function) => {
      Promise.resolve(route.action(request, response))
        .then(() => next())
        .catch((err) => {
          console.log("error", err);
          next(err);
        });
    }
  );
});

// Health check route
app.get("/", (req, res) => res.status(200).send());

AppDataSource.initialize()
  .then(async () => {
    console.log("connected to database..");
    app.listen(8080, "0.0.0.0");
    console.log("server running on port 8080");

    // await logOrganisation(); // uncomment if you implement this
  })
  .catch((error) => console.log("TypeORM connection error: ", error));