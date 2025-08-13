import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config";

const getGemini = (model?: string) => {
  const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY!);

  // For text-only input, use the gemini-pro model
  const genModel = genAI.getGenerativeModel({ model: model || "gemini-1.5-flash" });

  return genModel;
};

export default getGemini;
