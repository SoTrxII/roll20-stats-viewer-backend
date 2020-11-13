import { Player } from "./player";
import { Session } from "./session";
import { ChatMessage } from "./chat-message";

export interface CampaignBasicInfo {
  imageUrl: string;
  name: string;
  id: string;
}

export interface CampaignGeneralInfo {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl: string;
  sessions: Partial<Session>[];
  playTimeMs: number;
  players: Player[];
  dicesRolledCount: number;
}
