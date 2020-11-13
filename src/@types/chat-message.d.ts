export interface ChatMessage {
  /**
   * This is a timestamp weirdly named
   */
  ".priority": number;
  /**
   * Avatar url
   */
  avatar: string;
  /**
   * Either text for a plain message, or rolls details
   */
  content: any;
  /**
   * This is the player's IN GAME id, not its actual R20 ID
   */
  playerid: string;
  /**
   * No idea, 'R' or 'V' ?
   */
  type: string;
  /**
   * Player in game name when the dies where rolled.
   */
  who: string;
}

export interface GeneralChatMessage extends ChatMessage {
  type: "general";
  content: string;
}

export interface RollChatMessage extends ChatMessage {
  type: "rollresult";
  /**
   * Some kind of hash to check the roll authenticity ?
   */
  signature: string;
  content: {
    type: "V";
    rolls: [DiceResult];
    /**
     * Most likely 'sum'. When 2d100 are rolled together,
     * this field seem to indicate that the global result is
     * the sum of both dies.
     */
    resultType: string;
    /**
     * If multiple dies are rolled, total of the results of all the dies.
     */
    total: string;
  };
  /**
   * Text after /r
   */
  origRoll: string;
}

export interface DiceResult {
  type: string;
  /**
   * Number of dices.
   */
  dice: number;
  /**
   * Dice number of sides. Eg: 1d100 -> 100
   */
  sides: number;
  /**
   * Behaviour modificators for dices
   */
  mods: DiceMods;

  results: Record<string, number>[];
}

export interface DiceMods {
  /**
   * Critical success threshold
   */
  customCrit?: [
    {
      comp: "<=" | "<" | ">" | ">=";
      point: number;
    }
  ];
  /**
   * Critical failure threshold
   */
  customFumble?: [
    {
      comp: "<=" | "<" | ">" | ">=";
      point: number;
    }
  ];

  /**
   * This isn't an exhaustive mods listing.
   * So allow for custom attributes
   */
  [x: string]: any;
}
