import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { IScrapper } from "../@types/scrapper";
import { IDataProcessor } from "../@types/data-processor";
import { ChatMessage, RollChatMessage } from "../@types/chat-message";
import { Session } from "../@types/session";
import { CampaignBasicInfo, CampaignGeneralInfo } from "../@types/campaigns";
import { Player } from "../@types/player";

@injectable()
export class DataExtrapolationProcessor implements IDataProcessor {
  //The default gap between two session is a least 20h
  private static readonly DEFAULT_SESSION_GAP_MS = 20 * 3600 * 1000;
  constructor(@inject(TYPES.Scrapper) private scrapper: IScrapper) {}

  async getSessions(
    campaignId: string,
    options?: { sessionGap: number }
  ): Promise<Session[]> {
    const rolls = await this.scrapper.getMessages(campaignId);
    let sessions = [];

    const gap =
      options?.sessionGap || DataExtrapolationProcessor.DEFAULT_SESSION_GAP_MS;
    let lastKnownDate = undefined;
    let rollsInCurrentSession = [];

    /**
     * Assume two game sessions can't be less than DEFAULT_SESSION_GAP_MS apart.
     * It's current value is 20h. Even if you played everyday, 20h should be ok.
     */
    for (const r of rolls) {
      const date = r[".priority"];
      if (lastKnownDate !== undefined && date - lastKnownDate > gap) {
        sessions.push(rollsInCurrentSession);
        rollsInCurrentSession = [];
      }
      lastKnownDate = date;
      rollsInCurrentSession.push(r);
    }
    // Don't forget the last session
    if (rollsInCurrentSession.length !== 0) {
      sessions.push(rollsInCurrentSession);
    }
    console.log("Before filtering");
    console.log(sessions.length);

    /**
     * Second assumption. If only the GM has rolled/send messages in a session,
     * it's probably a system test session, not an actual game session.
     */
    sessions = sessions.filter(
      (s) =>
        // If the first to roll is the GM, and every playerId in the session
        // is equal to the GM's playerId, only the GM has ever rolled in the session.
        !(
          /.*\s\(GM\)$/.test(s[0].who.trim()) &&
          s.every((sr) => sr.playerid === s[0].playerid)
        )
    );

    sessions = sessions.map((s) => {
      return {
        start: s[0][".priority"],
        end: s[s.length - 1][".priority"],
        messages: s,
      };
    });
    console.log("After filtering");
    console.log(sessions.length);
    console.log(sessions);

    return sessions;
  }

  async getPlayers(campaignId: string): Promise<Player[]> {
    return this.scrapper.getPlayers(campaignId);
  }
  async getCampaignsGeneralInfos(
    campaignId: string
  ): Promise<CampaignGeneralInfo> {
    // Thanks to the memoization process, we can get away with this sort of double computation
    const [rolls, players, list] = await Promise.all([
      this.getRolls(campaignId),
      this.scrapper.getPlayers(campaignId),
      this.scrapper.getCampaignsList(),
    ]);
    const sessions = await this.getSessions(campaignId);
    const basicInfo = list.find((c) => c.id == campaignId);

    const sessionsDates = sessions.map((s) => {
      return {
        start: s.start,
        end: s.end,
      };
    });
    // Compute thumbnail using R20 s3
    let fullImage = basicInfo.imageUrl;
    const image = basicInfo.imageUrl.split("/");
    image.pop();
    image.push("max.jpg");
    if (image.includes("s3.amazonaws.com")) {
      fullImage = image.join("/");
    }
    // Approximate the total play time by adding all the sessions duration
    const playTime = sessions.reduce((acc, s) => (acc += s.end - s.start), 0);

    return {
      id: campaignId,
      name: basicInfo.name,
      imageUrl: fullImage,
      thumbnailUrl: basicInfo.imageUrl,
      sessions: sessionsDates,
      playTimeMs: playTime,
      players: players,
      dicesRolledCount: rolls.length,
    };
  }

  async getAllCampaignsBasicInfos(): Promise<CampaignBasicInfo[]> {
    return this.scrapper.getCampaignsList();
  }

  async getRolls(campaignId: string): Promise<RollChatMessage[]> {
    const messages = await this.scrapper.getMessages(campaignId);
    return (messages.filter(
      (m: ChatMessage) => m.type === "rollresult"
    ) as unknown) as RollChatMessage[];
  }
}
