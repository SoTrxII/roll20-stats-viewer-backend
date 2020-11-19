import { CampaignBasicInfo, CampaignGeneralInfo } from "./campaigns";
import { Player } from "./player";

export interface IDataProcessor {
  getSessions(campaignId: string, options?: { sessionGap: number });
  getPlayers(campaignId: string): Promise<Player[]>;
  getAllCampaignsBasicInfos(): Promise<CampaignBasicInfo[]>;
  getCampaignsGeneralInfos(campaignId: string): Promise<CampaignGeneralInfo>;
}
