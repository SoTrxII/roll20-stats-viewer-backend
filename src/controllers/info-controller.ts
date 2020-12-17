import {
  controller,
  httpGet,
  queryParam,
  requestParam,
  response,
} from "inversify-express-utils";
import { inject } from "inversify";
import { TYPES } from "../types";
import * as express from "express";
import { IDataProcessor } from "../@types/data-processor";
import { ScrapperError } from "../services/scrapper";

@controller("/campaign/")
export class InfoController {
  constructor(@inject(TYPES.DataProcessor) private processor: IDataProcessor) {}

  @httpGet("list", TYPES.CredentialsMiddleware)
  public async getCampaignsList(@response() res: express.Response) {
    try {
      const campaigns = await this.processor.getAllCampaignsBasicInfos();
      res.header("Content-type", "application/json");
      res.statusCode = 200;
      res.end(JSON.stringify(campaigns));
    } catch (e) {
      console.error(e);
      if (e instanceof ScrapperError) {
        res.statusCode = 401;
      } else {
        res.statusCode = 500;
      }
      res.end(e.message);
    }
  }
  @httpGet(":id", TYPES.CredentialsMiddleware)
  public async getCampaignGeneralInfo(
    @response() res: express.Response,
    @requestParam("id") id: string
  ) {
    try {
      const campaignInfo = await this.processor.getCampaignsGeneralInfos(id);
      res.header("Content-type", "application/json");
      res.statusCode = 200;
      res.end(JSON.stringify(campaignInfo));
    } catch (e) {
      if (e instanceof ScrapperError) {
        res.statusCode = 401;
      } else {
        res.statusCode = 500;
      }
      console.error(e);
      res.end(e.message);
    }
  }
  @httpGet(":id/session/:sid", TYPES.CredentialsMiddleware)
  public async getSessionDetails(
    @response() res: express.Response,
    @requestParam("id") id: string,
    @requestParam("sid") sid: number
  ) {
    if (sid < 0) {
      res.statusCode = 422;
      res.end("Session id cannot be negative");
      return;
    }
    try {
      const sessions = await this.processor.getSessions(id);
      if (sid >= sessions.length) {
        res.statusCode = 422;
        res.end("Invalid session id");
        return;
      }
      res.header("Content-type", "application/json");
      res.statusCode = 200;
      res.end(JSON.stringify(sessions[sid]));
    } catch (e) {
      if (e instanceof ScrapperError) {
        res.statusCode = 401;
      } else {
        res.statusCode = 500;
      }
      console.error(e);
      res.end(e.message);
    }
  }

  @httpGet(":id/players", TYPES.CredentialsMiddleware)
  public async getPlayersOfCampaign(
    @response() res: express.Response,
    @requestParam("id") id: string
  ) {
    try {
      const players = await this.processor.getPlayers(id);
      res.header("Content-type", "application/json");
      res.statusCode = 200;
      res.end(JSON.stringify(players));
    } catch (e) {
      if (e instanceof ScrapperError) {
        res.statusCode = 401;
      } else {
        res.statusCode = 500;
      }
      console.error(e);
      res.end(e.message);
    }
  }
}
