import { GoogleGenerativeAI } from "@google/generative-ai";
import jwt from "jsonwebtoken";
import config from "../../config";
import { IChatBotJWTPayload } from "./chatBot.interface";
const createChatBotAccessToken = (payload: IChatBotJWTPayload) => {
  const { EXPIRY, SECRET = "" } = config.CHAT_BOT_ACCESS_TOKEN;
  const token = jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
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
const botAccessToken: Record<string, { token: string; expireAt: string }> = {};

export const getBotAccessToken = (appSecret: string) => botAccessToken[appSecret];

export const setBotAccessToken = (
  tokenPayload: {
    token: string;
    expireAt: string;
  },
  appSecret: string
) => {
  botAccessToken[appSecret] = tokenPayload;
};

const getGemini = (model?: string) => {
  const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY!);

  // For text-only input, use the gemini-pro model
  const genModel = genAI.getGenerativeModel({ model: model || "gemini-1.5-flash" });

  return genModel;
};
const chatBotUtils = {
  createChatBotAccessToken,
  decodeChatBotAccessToken,
  getGemini,
};

export default chatBotUtils;
