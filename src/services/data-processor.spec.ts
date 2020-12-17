import "reflect-metadata";
require("dotenv-safe").config();
import { Scrapper } from "./scrapper";
import { env } from "process";
import { createWriteStream } from "fs";
import { DataExtrapolationProcessor } from "./data-processor";
import { cont } from "../inversify.config";
import { IDataProcessor } from "../@types/data-processor";
import { TYPES } from "../types";


describe("Scrapper", () => {
  const processor = cont.get<IDataProcessor>(TYPES.DataProcessor);
  it("Should detect sessions", async () => {
    const sessions  = await processor.getSessions("2988505")
    const mapped = sessions[45].messages;
  }, 20000);

});
