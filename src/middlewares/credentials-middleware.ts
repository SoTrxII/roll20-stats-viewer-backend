import { injectable } from "inversify";
import { BaseMiddleware } from "inversify-express-utils";
import * as express from "express";
import { TYPES } from "../types";
import { IScrapper } from "../@types/scrapper";
import { Scrapper, ScrapperError } from "../services/scrapper";

@injectable()
export class CredentialsMiddleware extends BaseMiddleware {
  public handler(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (process.env.AUTH_MODE === "DYNAMIC") {
      this.bind<IScrapper>(TYPES.Scrapper).toConstantValue(
        new Scrapper({
          login: req.header("email"),
          password: req.header("password"),
        })
      );
    }

    next();
  }
}
