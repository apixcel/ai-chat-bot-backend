import config from "../../config";
import AppError from "../../errors/AppError";
import prisma from "../../lib/prisma";
import catchAsyncError from "../../utils/catchAsync";
import sendResponse from "../../utils/send.response";
import chatBotUtils, { getBotAccessToken, setBotAccessToken } from "./chatBot.utils";

const getChatBotAccessToken = catchAsyncError(async (req, res) => {
  const appSecret = req.body.appSecret;
  const origin = `${req.protocol}://${req.get("host")}`;

  if (!appSecret) {
    throw new AppError(400, "appId is required");
  }

  // Check cached token and validate origin & app existence
  const cachedToken = getBotAccessToken();
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

  setBotAccessToken(newTokenPayload);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: newTokenPayload,
    message: "Token fetched successfully",
  });
});

const getQueryResponseByAccessToken = catchAsyncError(async (_req, res) => {
  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: null,
    message: "Query response fetched successfully",
  });
});

const chatBotController = {
  getChatBotAccessToken,
  getQueryResponseByAccessToken,
};

export default chatBotController;
