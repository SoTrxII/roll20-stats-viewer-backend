import { env } from "process";
import { Container } from "inversify";
import { IScrapper } from "./@types/scrapper";
import { Scrapper } from "./services/scrapper";
import { TYPES } from "./types";
import { IDataProcessor } from "./@types/data-processor";
import { DataExtrapolationProcessor } from "./services/data-processor";
import { CredentialsMiddleware } from "./middlewares/credentials-middleware";

export const cont = new Container();

cont.bind(TYPES.CredentialsMiddleware).to(CredentialsMiddleware);
if (env.AUTH_MODE != "DYNAMIC") {
  cont.bind<IScrapper>(TYPES.Scrapper).toConstantValue(
    new Scrapper({
      login: env.ROLL20_LOGIN,
      password: env.ROLL20_PASSWORD,
    })
  );
} else {
  cont.bind<IScrapper>(TYPES.Scrapper).toConstantValue(undefined);
}

cont.bind<IDataProcessor>(TYPES.DataProcessor).to(DataExtrapolationProcessor);
