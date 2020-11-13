import { ChatMessage, RollChatMessage } from "./chat-message";
import { Player } from "./player";
import { CampaignBasicInfo } from "./campaigns";

export interface IScrapper {
  getMessages(campaignId: string): Promise<ChatMessage[]>;
  getPlayers(campaignId: string): Promise<Player[]>;
  getCampaignsList(): Promise<CampaignBasicInfo[]>;
}

export interface IScrapperOptions {
  login: string;
  password: string;
}
