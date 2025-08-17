import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import config from "../config";
import AppError from "../errors/AppError";
import prisma from "../lib/prisma";
import { IUserJWTPayload } from "../modules/auth/auth.interface";
import chatBotUtils from "../modules/chatBot/chatBot.utils";
import { IUserInfoRequest } from "../utils/catchAsync";

const isAuthenticateUser = (isOptional?: boolean) => {
  return async (req: IUserInfoRequest, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies.accessToken;
      if (!token && isOptional === true) {
        return next();
      }

      if (!token) {
        throw new AppError(401, "Unauthorized");
      }

      let decoded: IUserJWTPayload | undefined = undefined;

      try {
        decoded = jwt.verify(token, config.ACCESS_TOKEN.SECRET as string) as IUserJWTPayload;
      } catch {
        return res.status(401).json({ success: false, message: "AUTH_SESSION_EXPIRED" });
      }

      if (!decoded && isOptional === false) {
        throw new AppError(401, "Invalid Authentications.");
      }

      const user = await prisma.user.findUnique({
        where: {
          id: decoded?.id,
        },
      });
      if (!user) {
        if (isOptional === true) {
          return next();
        }
        throw new AppError(404, "User does not exist.");
      }
      const payload = user;
      req.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
      };

      next();
    } catch (err) {
      next(err);
    }
  };
};

const validateBotAccessToken = async (req: IUserInfoRequest, res: Response, next: NextFunction) => {
  try {
    const getToken = req.header("Authorization");

    if (!getToken) {
      throw new AppError(401, "Unauthorized");
    }
    const token = getToken.split("Bearer ")[1];
    if (!token) {
      throw new AppError(401, "Unauthorized");
    }
    const decoded = chatBotUtils.decodeChatBotAccessToken(token);
    if (!decoded) {
      throw new AppError(401, "Unauthorized");
    }
    const origin = req.get("origin") || new URL(req.get("referer") || "").origin;

    if (decoded.authorizedOrigin !== origin) {
      throw new AppError(403, "Forbidden");
    }
    req.bot = {
      appId: decoded.appId,
      authorizedOrigin: decoded.authorizedOrigin,
      docId: decoded.docId,
      ownerId: decoded.ownerId,
    };

    next();
  } catch (err) {
    next(err);
  }
};

export default {
  isAuthenticateUser,
  validateBotAccessToken,
};
