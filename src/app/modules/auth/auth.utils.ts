import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../../config";
import AppError from "../../errors/AppError";
import prisma from "../../lib/prisma";
import { IUserJWTPayload } from "./auth.interface";

const generateAccessToken = (payload: IUserJWTPayload) => {
  const { EXPIRY, SECRET = "" } = config.ACCESS_TOKEN;

  const token = jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
  return token;
};

const generateRefreshToken = (id: string) => {
  const { EXPIRY, SECRET = "" } = config.REFRESH_TOKEN;
  const token = jwt.sign({ id: id }, SECRET, { expiresIn: EXPIRY });
  return token;
};
const generateForgotPasswordToken = (id: string) => {
  const { EXPIRY, SECRET = "" } = config.RECOVERY_TOKEN;
  const token = jwt.sign({ userId: id }, SECRET, { expiresIn: EXPIRY });
  return token;
};

const generateOTP = (length = 6) => {
  const otp = crypto.randomInt(0, Math.pow(10, length)).toString().padStart(length, "0");
  return otp;
};

const verifyAccessToken = (token: string) => {
  const { SECRET = "" } = config.ACCESS_TOKEN;
  const payload = jwt.verify(token, SECRET);
  return payload;
};
const hashPassword = (password: string) => {
  const hash = bcrypt.hash(password, 10);
  return hash;
};

const verifyPassword = async (password: string, hash: string) => {
  const isMatch = await bcrypt.compare(password, hash);
  return isMatch;
};

const sendMessage = async (data: { html: string; receiverMail: string; subject: string }) => {
  // under construction
  return data;
};
const sendEmail = async (data: { html: string; receiverMail: string; subject: string }) => {
  // under construction
  return data;
};

const isTokenExpired = (token: string) => {
  if (!token) {
    return true;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const decodedToken: any = jwt.decode(token);
  const currentTime = Date.now() / 1000;
  return decodedToken.exp < currentTime;
};

const sendVerificationEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      isVerified: true,
      Otp: {
        select: { coolDown: true, code: true }, // only need cooldown here
      },
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }
  if (user.isVerified) {
    throw new AppError(400, "User already verified");
  }
  console.log(user.Otp);

  const now = new Date();
  const cooldownEnd = new Date(now.getTime() + 5 * 60 * 1000); // +5 minutes
  const waitTime = Math.ceil((cooldownEnd.getTime() - now.getTime()) / 1000);

  // If there is an existing OTP and cooldown still active, short-circuit
  if (user.Otp?.coolDown && user.Otp.coolDown > now) {
    const remaining = Math.ceil((user.Otp.coolDown.getTime() - now.getTime()) / 1000);
    return {
      cooldownEnd: user.Otp.coolDown,
      remainingSecond: remaining,
      sent: false,
    };
  }

  // Generate a new OTP code
  const otp = String(generateOTP(6));

  // Upsert to ensure exactly one row per userId in the one-to-one Otp table
  await prisma.otp.upsert({
    where: { userId: user.id },
    update: {
      code: otp,
      coolDown: cooldownEnd,
    },
    create: {
      userId: user.id,
      code: otp,
      coolDown: cooldownEnd,
    },
  });

  await sendEmail({
    html: `<p style="text-align: center;">Hey ${user.first_name} ${user.last_name}, your verification code is <strong>${otp}</strong></p>`,
    receiverMail: email,
    subject: "Account Verification",
  });

  return {
    cooldownEnd,
    remainingSecond: waitTime,
    sent: true,
  };
};

const authUtils = {
  generateAccessToken,
  generateRefreshToken,
  generateOTP,
  verifyAccessToken,
  generateForgotPasswordToken,
  hashPassword,
  sendMessage,
  sendEmail,
  verifyPassword,
  isTokenExpired,
  sendVerificationEmail,
};

export default authUtils;
