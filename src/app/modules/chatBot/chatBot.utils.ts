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
let botAccessToken: { token: string; expireAt: string } | null = null;

export const getBotAccessToken = () => botAccessToken;

export const setBotAccessToken = ({ token, expireAt }: { token: string; expireAt: string }) => {
  botAccessToken = { token, expireAt };
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
