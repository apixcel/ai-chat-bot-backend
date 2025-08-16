import { User } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../../config";
import AppError from "../../errors/AppError";
import prisma from "../../lib/prisma";
import catchAsyncError from "../../utils/catchAsync";
import sendResponse from "../../utils/send.response";
import authUtils from "./auth.utils";
const register = catchAsyncError(async (req, res) => {
  const body = req.body as Omit<User, "id" | "stripeCustomerId" | "isVerified" | "role">;
  const { last_name, first_name, email, password } = body;

  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  if (user) {
    throw new AppError(400, "User already exist");
  }

  const hashedPassword = await authUtils.hashPassword(password);

  const result = await prisma.user.create({
    data: {
      first_name,
      last_name,
      email,
      password: hashedPassword,
      role: "user",
      isVerified: false,
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      role: true,
      currentSubscriptionId: true,
      isVerified: false,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await authUtils.sendVerificationEmail(email);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: { email: result.email },
    message: "User created successfully",
  });
});
const login = catchAsyncError(async (req, res) => {
  const body = req.body as Pick<User, "email" | "password">;

  const user = await prisma.user.findFirst({
    where: { email: body.email },
  });

  if (!user) {
    throw new AppError(403, "Invalid credentials");
  }

  const isPasswordMatch = await authUtils.verifyPassword(body.password, user.password);

  if (!isPasswordMatch) {
    throw new AppError(403, "Invalid credentials");
  }
  if (!user.isVerified) {
    sendResponse(res, {
      success: false,
      statusCode: 403,
      message: "Account not verified",
      data: { isVerified: false, email: user.email },
    });
    return;
  }

  const accessToken = authUtils.generateAccessToken({
    email: user.email,
    id: user.id,
    role: user.role,
  });

  const refreshToken = authUtils.generateRefreshToken(user.id);
  res
    .cookie("accessToken", accessToken, {
      sameSite: config.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 1000 * 60 * 60, // 1 hour
      httpOnly: true,
      secure: config.NODE_ENV === "production",
    })
    .cookie("refreshToken", refreshToken, {
      sameSite: config.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 1000 * 24 * 60 * 60 * 30, // 30 days
      httpOnly: true,
      secure: config.NODE_ENV === "production",
    });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Login successful",
    data: {
      result: {
        ...user,
        password: undefined,
      },
      accessToken,
    },
  });
});

const logout = catchAsyncError(async (_req, res) => {
  res.clearCookie("accessToken", {
    path: "/",
    sameSite: config.NODE_ENV === "production" ? "none" : "strict",
    secure: config.NODE_ENV === "production" ? true : false,
  });
  res.clearCookie("refreshToken", {
    path: "/",
    sameSite: config.NODE_ENV === "production" ? "none" : "strict",
    secure: config.NODE_ENV === "production" ? true : false,
  });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: null,
    message: "User logged out successfully",
  });
});

const author = catchAsyncError(async (req, res) => {
  const user = req.user!;

  const result = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
  });

  sendResponse(res, {
    data: {
      ...result,
      password: undefined,
    },
    success: true,
    statusCode: 200,
    message: "Author infor retrieved successfully",
  });
});

const sendVerificationEmail = catchAsyncError(async (req, res) => {
  const { email } = req.body;
  const result = await authUtils.sendVerificationEmail(email);
  sendResponse(res, {
    data: result,
    success: true,
    statusCode: 200,
    message: result.sent ? "Email sent successfully" : "Please wait until the time ends",
  });
});

const verifyEmail = catchAsyncError(async (req, res) => {
  const { email, otp } = req.body;
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const optModel = await prisma.otp.findFirst({
    where: {
      userId: user.id,
    },
  });

  if (!optModel) {
    throw new AppError(400, "Invalid otp");
  }

  const now = new Date();

  if (optModel.code !== otp) {
    throw new AppError(400, "Invalid otp");
  }

  if (now > optModel.coolDown) {
    throw new AppError(400, "Otp expired. Try again");
  }

  const result = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      isVerified: true,
    },
  });

  await prisma.otp.deleteMany({
    where: {
      userId: user.id,
    },
  });

  const accessToken = authUtils.generateAccessToken({
    email: user.email,
    id: user.id,
    role: user.role,
  });

  const refreshToken = authUtils.generateRefreshToken(user.id);
  res
    .cookie("accessToken", accessToken, {
      sameSite: config.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 1000 * 60 * 60, // 1 hour
      httpOnly: true,
      secure: config.NODE_ENV === "production",
    })
    .cookie("refreshToken", refreshToken, {
      sameSite: config.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 1000 * 24 * 60 * 60 * 30, // 30 days
      httpOnly: true,
      secure: config.NODE_ENV === "production",
    });

  sendResponse(res, {
    data: {
      result: {
        ...result,
        password: undefined,
      },
      accessToken,
    },
    success: true,
    statusCode: 200,
    message: "Email verified successfully",
  });
});

const refreshToken = catchAsyncError(async (req, res) => {
  const { cookies } = req;
  // const user = req.user

  const { refreshToken } = cookies as {
    refreshToken: string | undefined;
    accessToken: string | undefined;
  };

  if (!refreshToken) {
    throw new AppError(40, "No refresh token provided");
  }

  let userId: null | string = null;

  try {
    const decryptedJwt = jwt.verify(refreshToken, config.REFRESH_TOKEN.SECRET as string) as {
      id: string;
    };
    userId = decryptedJwt.id;
  } catch {
    userId = null;
  }

  if (!userId) {
    throw new AppError(401, "Invalid refresh token");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(401, "User not found");
  }

  const accessToken = authUtils.generateAccessToken({
    id: user.id.toString(),
    email: user.email,
    role: user.role || "",
  });

  // Generate new Access Token
  res.cookie("accessToken", accessToken, {
    sameSite: config.NODE_ENV === "production" ? "none" : "strict",
    maxAge: 1000 * 60 * 60, // 1 hour
    httpOnly: true,
    secure: config.NODE_ENV === "production",
  });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Token refreshed",
    data: { accessToken },
  });
});

const forgotPassword = catchAsyncError(async (req, res) => {
  const { body } = req;
  const email = body.email;

  if (!email) {
    throw new AppError(400, "Email is required");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const token = authUtils.generateForgotPasswordToken(user.id.toString());

  const url = `${config.frontend_base_url}/reset-password/${token}`;

  const subject = "Account Password Reset Requested";
  const emailContent = `
      <p style="text-align: center;">
          Hey ${user.first_name} , please reset your account password by clicking on the link below.<br>
          This link will expire within 5 minutes.
      </p>
      <a href="${url}" style="text-align: center; display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
  `;

  try {
    await authUtils.sendMessage({
      html: emailContent,
      receiverMail: user.email,
      subject,
    });

    sendResponse(res, {
      success: true,
      statusCode: 200,
      data: null,
      message: "Password reset email sent successfully",
    });
  } catch {
    throw new AppError(500, "Error sending password reset email");
  }
});
const resetPassword = catchAsyncError(async (req, res) => {
  const { password: newPassword, token } = req.body;
  let decoded: { userId: string } | undefined = undefined;
  try {
    decoded = jwt.verify(token, config.RECOVERY_TOKEN.SECRET!) as { userId: string };
  } catch {
    throw new AppError(400, "Session expired");
  }
  const user = await prisma.user.findUnique({
    where: {
      id: decoded.userId,
    },
  });

  if (!user) {
    throw new AppError(404, "Account not found or invalid reset token");
  }

  const hashedPassword = await authUtils.hashPassword(newPassword);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  const to = user.email;
  const subject = "Account Password Reset";

  await authUtils.sendEmail({
    html: `
          <p style="text-align: center;">Hey ${user.first_name} , your account password has been reset successfully.</p>`,
    receiverMail: to,
    subject,
  });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Password reset successfully",
    data: null,
  });
});
const changePassword = catchAsyncError(async (req, res) => {
  const body = req.body;
  const userAuth = req.user;
  if (!userAuth) {
    throw new AppError(404, "User not found");
  }
  const { password: newPassword, oldPassword } = body;

  const user = await prisma.user.findUnique({
    where: {
      id: userAuth.id,
    },
    select: {
      id: true,
      password: true,
      first_name: true,
      last_name: true,
      email: true,
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const isPasswordMatching = bcrypt.compareSync(oldPassword, user.password);
  if (!isPasswordMatching) {
    throw new AppError(403, "Unauthorized. Password is incorrect");
  }

  if (newPassword === oldPassword) {
    throw new AppError(400, "New password cannot be the same as the old password");
  }

  const hashedPassword = await authUtils.hashPassword(newPassword);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  const to = user.email;
  const subject = "Password Changed";
  const emailContent = `
      <p style="text-align: center;">Hey ${user.first_name} , your account password has been changed successfully.</p>`;

  await authUtils.sendEmail({
    html: emailContent,
    receiverMail: to,
    subject,
  });

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Password changed successfully",
    data: null,
  });
});

const authController = {
  login,
  register,
  sendVerificationEmail,
  verifyEmail,
  resetPassword,
  changePassword,
  forgotPassword,
  refreshToken,
  logout,
  author,
};

export default authController;
