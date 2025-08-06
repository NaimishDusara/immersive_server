import { DataSource } from "typeorm";

const AppDataSource = new DataSource  ({
  type: "postgres",
  host: "localhost",           // or your server host
  port: 5432,                  // default PostgreSQL port
  username: "postgres",   // your DB username (often 'postgres')
  password: "Acusion1234", // your DB password
  database: "Local Postgres",    // the DB you just created!
  entities: [__dirname + "/entity/**/*.{js,ts}"],
  migrations: [__dirname + "/migration/**/*.{js,ts}"],
  synchronize: false,           // set to false in production!
});

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });

export default AppDataSource;

