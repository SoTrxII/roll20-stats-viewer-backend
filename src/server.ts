import "reflect-metadata";
import { cont } from "./inversify.config";
import { InversifyExpressServer } from "inversify-express-utils";
import "./controllers/info-controller";
import { json } from "body-parser";
import cors from "cors";
export const PORT = 8089;
// start the server
const server = new InversifyExpressServer(cont);
server.setConfig((app) => {
  app.use(json());
  if (process.env.NODE_ENV === "dev") {
    app.use(cors());
  }
});

export const app = server.build();
app.listen(PORT);
console.log(`Server started on port ${PORT} :) `);
