/* eslint-disable @typescript-eslint/no-unused-vars */

import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import AppError from "../errors/AppError";
import handleDuplicateError from "../errors/handleDuplicateError";
import handleZodError from "../errors/zodError";
import { IErrorSources } from "../interface/error.interface";

// eslint-disable-next-line no-unused-vars
const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  const isDev = process.env.NODE_ENV === "development";

  let message = "Something went wrong!";
  let statusCode = 500;
  let errorMessages: IErrorSources = [
    {
      path: "",
      message: "Something went wrong",
    },
  ];

  if (isDev) {
    console.dir(error, { depth: null, colors: true, maxArrayLength: null });
  }

  if (error instanceof ZodError && isDev) {
    const simpleErr = handleZodError(error);
    statusCode = simpleErr?.statusCode;
    message = simpleErr?.message;
    errorMessages = simpleErr?.errorSources;
  } else if (error.code === 11000) {
    const simpleErr = handleDuplicateError(error);
    statusCode = simpleErr?.statusCode;
    message = isDev ? "Duplicate Entry" : simpleErr?.message;
    errorMessages = simpleErr?.errorSources;
  } else if (error instanceof AppError) {
    statusCode = error?.statusCode;
    message = error.message;
    errorMessages = [
      {
        path: "",
        message: error?.message,
      },
    ];
  } else if (error instanceof Error && isDev) {
    message = error.message;
    errorMessages = [
      {
        path: "",
        message: error?.message,
      },
    ];
  }

  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    errorMessages: errorMessages,
    stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
  });
};

export default globalErrorHandler;
