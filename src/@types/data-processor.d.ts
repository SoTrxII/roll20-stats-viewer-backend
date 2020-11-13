import { CampaignBasicInfo, CampaignGeneralInfo } from "./campaigns";

export interface IDataProcessor {
  getSessions(campaignId: string, options?: { sessionGap: number });
  getAllCampaignsBasicInfos(): Promise<CampaignBasicInfo[]>;
  getCampaignsGeneralInfos(campaignId: string): Promise<CampaignGeneralInfo>;
}
