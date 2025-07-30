import "reflect-metadata";
import { DataSource } from "typeorm";
import AppDataSource from "./ormconfig";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import compression from "compression";

console.log("starting project");
console.log("creating application");

const app = express();

AppDataSource.initialize()
  .then(async () => {
    console.log("connected to database..");
    app.listen(8080, "0.0.0.0");
    console.log("server running on port 8080");

    // await logOrganisation(); // uncomment if you implement this
  })
  .catch((error) => console.log("TypeORM connection error: ", error));