import jwt from "jsonwebtoken";
import config from "../config";
import AppError from "../errors/AppError";
import prisma from "../lib/prisma";
import { IUserJWTPayload } from "../modules/auth/auth.interface";
import authUtils from "../modules/auth/auth.utils";
import catchAsyncError from "../utils/catchAsync";

const isAuthenticateUser = catchAsyncError(async (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken || authUtils.isTokenExpired(accessToken)) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new AppError(403, "Unauthorized");
    }

    const decryptedJwt = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as IUserJWTPayload;

    const result = await prisma.user.findUnique({
      where: {
        id: decryptedJwt.id,
      },
    });

    if (!result) {
      throw new AppError(403, "Unauthorized");
    }

    const newAccessToken = authUtils.generateAccessToken({
      id: result?.id,
      email: result?.email,
      role: result?.role,
    });

    const newRefreshToken = authUtils.generateRefreshToken(decryptedJwt.id.toString());

    res
      .cookie("accessToken", newAccessToken, {
        sameSite: config.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 1000 * 60 * 60, // 1 hour
        httpOnly: true,
        secure: config.NODE_ENV === "production",
      })
      .cookie("refreshToken", newRefreshToken, {
        sameSite: config.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 1000 * 24 * 60 * 60 * 30, // 30 days
        httpOnly: true,
        secure: config.NODE_ENV === "production",
      });

    const isExistUsr = await prisma.user.findUnique({
      where: {
        id: decryptedJwt.id,
      },
    });
    if (!isExistUsr) {
      throw new AppError(403, "Unauthorized");
    }

    const auth = {
      id: isExistUsr.id,
      email: isExistUsr.email,
      role: isExistUsr.role,
    };

    req.user = auth;
  }

  if (accessToken && !authUtils.isTokenExpired(accessToken)) {
    const payload = authUtils.verifyAccessToken(accessToken);
    if (!payload) {
      throw new AppError(403, "Unauthorized");
    }
    const { id } = payload as { id: string; email: string; role: string };
    const isExistUsr = await prisma.user.findUnique({
      where: {
        id,
      },
    });
    if (!isExistUsr) {
      throw new AppError(403, "Unauthorized");
    }

    const auth = {
      id: isExistUsr.id,
      email: isExistUsr.email,
      role: isExistUsr.role,
    };

    req.user = auth;
  }

  next();
});

export default {
  isAuthenticateUser,
};
