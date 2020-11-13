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

@controller("/campaign/")
export class InfoController {
  constructor(@inject(TYPES.DataProcessor) private processor: IDataProcessor) {}

  @httpGet("list")
  public async getCampaignsList(@response() res: express.Response) {
    try {
      const campaigns = await this.processor.getAllCampaignsBasicInfos();
      res.header("Content-type", "application/json");
      res.statusCode = 200;
      res.end(JSON.stringify(campaigns));
    } catch (e) {
      res.statusCode = 500;
      res.end(e.message);
    }
  }
  @httpGet(":id")
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
      res.statusCode = 500;
      console.error(e);
      res.end(e.message);
    }
  }
  @httpGet(":id/session/:sid")
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
      res.statusCode = 500;
      console.error(e);
      res.end(e.message);
    }
  }
}
