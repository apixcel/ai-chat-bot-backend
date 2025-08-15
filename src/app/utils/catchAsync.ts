import { NextFunction, Request, Response } from "express";
import { IUserJWTPayload } from "../modules/auth/auth.interface";
import { IChatBotJWTPayload } from "../modules/chatBot/chatBot.interface";

export interface IUserInfoRequest extends Request {
  user?: IUserJWTPayload;
  bot?: IChatBotJWTPayload;
}

// eslint-disable-next-line no-unused-vars
type THandelerFunc = (req: IUserInfoRequest, res: Response, next: NextFunction) => void;

const catchAsyncError = (fn: THandelerFunc) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as IUserInfoRequest, res, next)).catch((err) => next(err));
  };
};

export default catchAsyncError;
