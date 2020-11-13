import { ChatMessage } from "./chat-message";

export interface Session {
  /**
   * Session approximate start date,
   * based on the first message sent.
   */
  start: number;
  /**
   * Session approximate start date,
   * based on the last message sent.
   */
  end: number;
  /**
   * All the messages sent during this session
   */
  messages: ChatMessage[];
}
