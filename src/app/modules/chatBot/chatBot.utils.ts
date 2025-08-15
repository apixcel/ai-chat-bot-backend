import jwt from "jsonwebtoken";
import config from "../../config";
import { IChatBotJWTPayload } from "./chatBot.interface";

const createChatBotAccessToken = ({ appId, docId, ownerId }: IChatBotJWTPayload) => {
  const { EXPIRY, SECRET = "" } = config.CHAT_BOT_ACCESS_TOKEN;
  const token = jwt.sign({ appId, docId, ownerId }, SECRET, { expiresIn: EXPIRY });
  return token;
};

const decodeChatBotAccessToken = (token: string) => {
  const { SECRET } = config.CHAT_BOT_ACCESS_TOKEN;
  try {
    const payload = jwt.verify(token, SECRET!) as IChatBotJWTPayload;
    return payload;
  } catch {
    return null;
  }
};

// for caching use redis in future
let botAccessToken: { token: string; expireAt: string } | null = null;

export const getBotAccessToken = () => botAccessToken;

export const setBotAccessToken = ({ token, expireAt }: { token: string; expireAt: string }) => {
  botAccessToken = { token, expireAt };
};

const chatBotUtils = {
  createChatBotAccessToken,
  decodeChatBotAccessToken,
};

export default chatBotUtils;
