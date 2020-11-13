export interface Player {
  /**
   * Roll20 avatar
   */
  avatarUrl: string;
  /**
   * Is GM of a specific game
   */
  isGm: boolean;
  /**
   * Roll20 Global ID
   */
  roll20Id: string;
  /**
   * Roll20 Username (not character name)
   */
  username: string;
}
