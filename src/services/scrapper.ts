import { default as nodeFetch, Response } from "node-fetch";
import fetchCookie from "fetch-cookie/node-fetch";
import { IScrapper, IScrapperOptions } from "../@types/scrapper";
import { ChatMessage, RollChatMessage } from "../@types/chat-message";

import { load } from "cheerio";
import { Player } from "../@types/player";
import { createWriteStream } from "fs";
import { injectable } from "inversify";
import { memoize } from "../decorators/memoize";
import Root = cheerio.Root;
import { CampaignBasicInfo } from "../@types/campaigns";
const fetch = fetchCookie(nodeFetch);
export class ScrapperError extends Error {}

@injectable()
export class Scrapper implements IScrapper {
  private static readonly BASE_URL = `https://app.roll20.net`;
  private isLoggedIn = false;
  private static readonly ENDPOINTS = {
    login: `${Scrapper.BASE_URL}/sessions/create`,
    logout: `${Scrapper.BASE_URL}/sessions/destroy`,
    loginRedirect: `${Scrapper.BASE_URL}/sessions/new`,
    allCampaigns: (page: number) =>
      `${Scrapper.BASE_URL}/campaigns/search?p=${page}`,
    details: (campaignId: string) =>
      `${Scrapper.BASE_URL}/campaigns/details/${campaignId}`,
    archives: (campaignId: string) =>
      `${Scrapper.BASE_URL}/campaigns/chatarchive/${campaignId}?p=1&onePage=true&hidewhispers=&hiderollresults=true`,
  };

  constructor(private options: IScrapperOptions) {
    this.login();
  }

  async login(): Promise<void> {
    const infos = {
      email: this.options.login,
      password: this.options.password,
    };
    const searchParams = Object.keys(infos)
      .map((key) => {
        return encodeURIComponent(key) + "=" + encodeURIComponent(infos[key]);
      })
      .join("&");
    await fetch(Scrapper.ENDPOINTS.logout);
    const res = await fetch(Scrapper.ENDPOINTS.login, {
      method: "POST",
      body: searchParams,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://app.roll20.net",
      },
    });
    const t = await res.text();
    if (t?.includes("The email or password you entered is incorrect")) {
      throw new ScrapperError(
        `Invalid credentials provided, could not login to R20`
      );
    }
    this.isLoggedIn = true;
  }

  /**
   * Make a request that requires to be authenticated to R220
   * @param endpoint
   * @param params
   */
  private async makeAuthedRequest(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<Response> {
    if (!this.isLoggedIn) await this.login();
    let res = await fetch(endpoint, params);

    //Cookies expired
    if (res.redirected && res.url.contains(Scrapper.ENDPOINTS.loginRedirect)) {
      this.isLoggedIn = false;
      await this.login();
      res = await fetch(endpoint, params);
    }
    return res;
  }

  async dumpEditor(campaignId: string) {
    const res = await this.makeAuthedRequest(
      `https://app.roll20.net/editor/setcampaign/4485864`
    );
    const rawText: string = await res.text();
    const f = createWriteStream("/tmp/editor");
    f.write(rawText);
  }

  async getMessages(campaignId: string): Promise<ChatMessage[]> {
    //Calling the proxy method to ensure the cache takes into account multi-users
    return this.getMessagesMemo(
      campaignId,
      this.options.login,
      this.options.password
    );
  }

  @memoize({
    promise: true,
    // 1h
    maxAge: 1 * 3600,
    preFetch: true,
  })
  private async getMessagesMemo(
    campaignId: string,
    login: string,
    password: string
  ): Promise<ChatMessage[]> {
    const res = await this.makeAuthedRequest(
      Scrapper.ENDPOINTS.archives(campaignId)
    );
    // R20 chat archives are actually a gigantic B64-encoded string.
    // Just... why ?
    const rawText: string = await res.text();
    const matched = rawText.match(/var msgdata\s*=\s*"(.*)"/);

    //If this thing gets too large, main memory will burst
    const rawMessages = JSON.parse(
      Buffer.from(matched[1], "base64").toString("utf8")
    )
      // Remove any undefined messages
      .filter((m) => m);

    const messages = rawMessages.flatMap((m) => Object.values(m));

    // For some reasons, the content of roll messages was stringified
    // one more time ?
    messages
      .filter((m) => m.type === "rollresult" || m.type === "gmrollresult")
      .forEach((m) => (m.content = JSON.parse(m?.content)));

    return messages;
  }

  private async getDetailsPageDomRoot(campaignId: string): Promise<Root> {
    const res = await this.makeAuthedRequest(
      Scrapper.ENDPOINTS.details(campaignId)
    );
    return load(await res.text());
  }

  async getPlayers(campaignId: string): Promise<Player[]> {
    return this.getPlayersMemo(
      campaignId,
      this.options.login,
      this.options.password
    );
  }
  @memoize({
    promise: true,
    // 1h
    maxAge: 1 * 3600,
    preFetch: true,
  })
  private async getPlayersMemo(
    campaignId: string,
    login: string,
    password: string
  ): Promise<Player[]> {
    const $ = await this.getDetailsPageDomRoot(campaignId);
    const players = [];

    // Retrieves "normal" players
    $(".playerlisting .pclisting").each((index, el) => {
      const avatar = $(".circleavatar", el).attr("src");
      players.push({
        // Add roll20 prefix if it's an internal url
        avatarUrl: avatar.startsWith("/")
          ? "https://app.roll.net" + avatar
          : avatar,
        isGm: Boolean($(".gmbadge", el).length),
        roll20Id: $("a", el).attr("href").split("/").pop(),
        // Sometimes "(GM)" is added after the name, get rid of it
        username: $(el).text().trim().split("\n").shift(),
      });
    });

    // Retrieves game's creator (and "main" GM)
    const GM = {};
    $(".playerlisting .profilemeta > .userprofile").each((index, up) => {
      Object.assign(GM, {
        avatarUrl: "N/A",
        isGm: true,
        roll20Id: $(up).attr("href").split("/").pop(),
        username: $(".name", up).text().trim(),
      });
    });

    //GM's avatar has to be retrieved in another div
    $(".playerlisting .userprofile .avatar img").each((index, up) => {
      const avatar = $(up).attr("src");
      Object.assign(GM, {
        avatarUrl: avatar.startsWith("/")
          ? "https://app.roll.net" + avatar
          : avatar,
      });
    });
    players.push(GM);
    return players;
  }

  async getCampaignsList(): Promise<CampaignBasicInfo[]> {
    return this.getCampaignsListMemo(this.options.login, this.options.password);
  }
  @memoize({
    promise: true,
    // 1h
    maxAge: 1 * 3600,
    preFetch: true,
  })
  async getCampaignsListMemo(
    login: string,
    password: string
  ): Promise<CampaignBasicInfo[]> {
    const campaigns = [];
    let hasResults = true;
    let i = 1;
    do {
      const res = await this.makeAuthedRequest(
        Scrapper.ENDPOINTS.allCampaigns(i)
      );
      const $ = await load(await res.text());
      const campaignsDiv = $(".campaignlisting .campaign");
      if (campaignsDiv.length === 0) hasResults = false;

      campaignsDiv.each((i, el) => {
        let img = $(".campaignthumb img", el).attr("src");
        // If the image link is relative, it's the placeholder R20 image
        // We won't need to bother resolving it
        if (img.startsWith("/"))
          img = "https://app.roll20.net/images/cplaceholder.png?v=2";

        campaigns.push({
          id: Number($(el).attr("data-campaignid")),
          name: $(".campaigninfo .campaignname a", el).contents().text().trim(),
          imageUrl: img,
        });
      });
      i++;
    } while (hasResults);
    return campaigns;
  }
}
