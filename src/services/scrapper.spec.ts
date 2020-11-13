import "reflect-metadata";
import { Scrapper } from "./scrapper";
import { env } from "process";
import { createWriteStream } from "fs";
require("dotenv-safe").config();

describe("Scrapper", () => {
  const scrapper = new Scrapper({
    login: env.ROLL20_LOGIN,
    password: env.ROLL20_PASSWORD,
  });
  it("Should login to Roll20", async () => {
    await scrapper.login();
  });

  it("Should retrieve the players of a game", async () => {
    const res = await scrapper.getPlayers("4485864");
    console.log(res);
  }, 7000);

  it("Should get a game's chat archives", async () => {
    const res = await scrapper.getMessages("2988505");
    const f = createWriteStream("/tmp/meh");
    //console.log(res);
    f.write(JSON.stringify(res));
    console.log(res.length);
  }, 8000);
  it("Should dump ediot", async () => {
    const res = await scrapper.dumpEditor("dumpEditor");
  }, 8000);
  it("Should retrieve campaign list", async () => {
    const res = await scrapper.getCampaignsList();
    console.log(res.length);
  }, 30000);
});
