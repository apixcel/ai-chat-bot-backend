import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import path from "path";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import subscriptionWebhook from "./app/modules/subscription/subscription.webhook";
import router from "./app/routes";
import sendResponse from "./app/utils/send.response";

const app: Application = express();

app.post(
  "/api/v1/subscription/stripe/webhook",
  express.raw({ type: "application/json" }),
  subscriptionWebhook.subscriptionComplete
);

app.use("/assets", express.static(path.join(process.cwd(), "public")));
// parsers
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: (origin, cb) => cb(null, origin || true),
    credentials: true,
  })
);

// application routes
app.use("/api/v1", router);

// test route
app.get("/", (_req: Request, res: Response) => {
  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: null,
    message: "App is running",
  });
});

app.use(notFound);
// global error handler
app.use(globalErrorHandler);

// not found route

export default app;
