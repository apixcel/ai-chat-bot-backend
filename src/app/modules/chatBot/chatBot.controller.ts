import { google } from "googleapis";
import config from "../../config";
import AppError from "../../errors/AppError";
import prisma from "../../lib/prisma";
import catchAsyncError from "../../utils/catchAsync";
import sendResponse from "../../utils/send.response";
import googleAuthUtils from "../googleAuth/googleAuth.utils";
import chatBotUtils, { getBotAccessToken, setBotAccessToken } from "./chatBot.utils";

import fs from "fs";
import path from "path";

const getChatBotAccessToken = catchAsyncError(async (req, res) => {
  const appSecret = req.body.appSecret;
  const origin = req.get("origin") || new URL(req.get("referer") || "").origin;

  if (!appSecret) {
    throw new AppError(400, "appId is required");
  }

  // Check cached token and validate origin & app existence
  const cachedToken = getBotAccessToken(appSecret);
  if (cachedToken) {
    const token = chatBotUtils.decodeChatBotAccessToken(cachedToken.token);
    if (token) {
      if (token.authorizedOrigin !== origin) {
        throw new AppError(403, "Unauthorized");
      }

      const app = await prisma.app.findUnique({
        where: { apiKeyHash: appSecret },
        select: { id: true },
      });

      if (!app) {
        throw new AppError(403, "Unauthorized");
      }
    }
  }

  const app = await prisma.app.findUnique({
    where: { apiKeyHash: appSecret },
  });

  if (!app) {
    throw new AppError(403, "Unauthorized");
  }

  if (app.authorizedOrigin !== origin) {
    throw new AppError(403, "Unauthorized");
  }

  // Reuse cached token if valid
  if (cachedToken) {
    const isValid = new Date(cachedToken.expireAt) > new Date();
    if (isValid) {
      return sendResponse(res, {
        success: true,
        statusCode: 200,
        data: cachedToken,
        message: "Token fetched successfully",
      });
    }
  }

  // Create a new token
  const newToken = chatBotUtils.createChatBotAccessToken({
    appId: app.id,
    docId: app.googleDocId,
    ownerId: app.userId,
    authorizedOrigin: app.authorizedOrigin,
  });

  const { EXPIRY: expirySeconds } = config.CHAT_BOT_ACCESS_TOKEN;
  const newTokenPayload = {
    token: newToken,
    expireAt: new Date(Date.now() + expirySeconds * 1000).toISOString(),
  };

  setBotAccessToken(newTokenPayload, appSecret);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: newTokenPayload,
    message: "Token fetched successfully",
  });
});

const getQueryResponseByAccessToken = catchAsyncError(async (req, res) => {
  const bot = req.bot!;
  const query = req.body?.query;

  if (!query) {
    throw new AppError(400, "query is required");
  }

  const auth = await googleAuthUtils.getAuthForUser(bot.ownerId);
  if (!auth) {
    throw new AppError(404, "SOMETHING WENT WRONG");
  }

  const docs = google.docs({ version: "v1", auth: auth });
  const { data } = await docs.documents.get({ documentId: bot.docId });

  // Flatten paragraphs -> plain text (basic)
  const text = (data.body?.content || [])
    .map((el) => {
      if (!el.paragraph) {
        return "";
      }
      return (el.paragraph.elements || [])
        .map((r) => (r.textRun ? r.textRun.content : ""))
        .join("");
    })
    .join("\n");

  const prompt = `
    You are a helpful assistant specialized in providing detailed information based *only* on the provided business document.
    If the answer is not directly available in the document, state that clearly and do not make up information.
    Always strive to give a comprehensive and descriptive answer using the content of the document - and also give human-like(customer suport agent) responses forr hi/hello etc. if you can't find the answer in the document, respond with "I'm sorry, I can't help you at this moment out agent will get back to you."
    
    Business Document:
    """
    ${text}
    """
    
    User Question: ${query}
    
    Helpful Assistant's Answer:
    `;

  let geminiResponseText = "Could not generate a response.";
  const model = chatBotUtils.getGemini();
  try {
    const geminiResult = await model.generateContent(prompt); // Await the result
    const response = await geminiResult.response;
    geminiResponseText = response.text(); // Extract the text from Gemini's response
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    // You might want to send a more specific error message to the client here
    geminiResponseText = "Error processing your request with the AI model.";
  }

  sendResponse(res, {
    message: "Message processed successfully.",
    statusCode: 200,
    success: true,
    data: geminiResponseText, // Send Gemini's response
  });
});

const chatBotSdk = catchAsyncError(async (req, res) => {
  const appSecret = req.params.appSecret;
  const sdkPath = path.join(process.cwd(), "src/app/sdk/chatbot/script.js");
  let code = fs.readFileSync(sdkPath, "utf-8");

  const base = `http://localhost:5000`;
  const cssURL = `${base}/assets/chatbot.css`;

  code = code.replace(/__APP_SECRET__/g, appSecret).replace(/__CSS_URL__/g, cssURL);
  res.setHeader("Content-Type", "application/javascript");
  res.send(code);
});

const chatBotController = {
  getChatBotAccessToken,
  getQueryResponseByAccessToken,
  chatBotSdk,
};

export default chatBotController;
