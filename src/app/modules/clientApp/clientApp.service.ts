import { App } from "@prisma/client";
import AppError from "../../errors/AppError";
import prisma from "../../lib/prisma";
import subscriptionUtils from "../subscription/subscription.utils";
import { TClientAppCreatePayload } from "./clientApp.interface";
import clientAppUtils from "./clientApp.utils";

const createApp = async (payload: TClientAppCreatePayload, userId: string) => {
  const subscriptionId = await subscriptionUtils.getUserCurrentSubscriptionId(userId);

  const subscription = await prisma.subscription.findUniqueOrThrow({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new AppError(404, "Subscription not found");
  }

  const plan = await prisma.plan.findUnique({
    where: { id: subscription.planId },
    select: { appLimit: true },
  });

  if (!plan) {
    throw new AppError(404, "Wrong plan. Please contact support.");
  }

  const totalApps = await prisma.app.count({
    where: { userId: userId },
  });

  if (totalApps >= plan.appLimit) {
    throw new AppError(400, "You have reached the maximum number of apps");
  }

  const apiKey = clientAppUtils.generateAppApiKey();

  const app = await prisma.app.create({
    data: {
      ...payload,
      apiKeyHash: apiKey,
      userId,
    },
  });

  return { ...app, apiKey: undefined };
};

const getUsersAllApps = async (userId: string) => {
  const apps = await prisma.app.findMany({
    where: { userId },
    select: {
      apiKeyHash: false,
      createdAt: true,
      updatedAt: true,
      userId: true,
      appName: true,
      authorizedOrigin: true,
      id: true,
    },
  });

  return apps;
};

const getAppById = async (appId: string, userId: string) => {
  const app = await prisma.app.findUnique({
    where: { id: appId },
  });

  if (!app) {
    throw new AppError(404, "App not found");
  }

  if (app.userId !== userId) {
    throw new AppError(404, "App not found");
  }

  return { ...app, apiKeyHash: undefined };
};

const getAppApiKeyByAppId = async (appId: string, userId: string) => {
  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: {
      apiKeyHash: true,
      userId: true,
    },
  });

  if (!app) {
    throw new AppError(404, "App not found");
  }

  if (app.userId !== userId) {
    throw new AppError(404, "App not found");
  }

  return app;
};

const UpdateAppByAppId = async (appId: string, userId: string, payload: Partial<App>) => {
  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: {
      userId: true,
    },
  });

  if (!app) {
    throw new AppError(404, "App not found");
  }

  if (app.userId !== userId) {
    throw new AppError(403, "Forbidden");
  }

  ["apiKeyHash", "userId"].forEach((key) => delete payload[key as keyof App]);

  const result = await prisma.app.update({ where: { id: appId }, data: payload });
  return { ...result, apiKeyHash: undefined };
};

const deleteAppByAppId = async (appId: string, userId: string) => {
  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: {
      userId: true,
    },
  });

  if (!app) {
    throw new AppError(404, "App not found");
  }

  if (app.userId !== userId) {
    throw new AppError(403, "Forbidden");
  }

  await prisma.app.delete({ where: { id: appId } });

  return null;
};

const myAppCount = async (userId: string) => {
  const count = await prisma.app.count({ where: { userId } });
  return count;
};

const clientAppService = {
  createApp,
  getUsersAllApps,
  getAppById,
  getAppApiKeyByAppId,
  UpdateAppByAppId,
  deleteAppByAppId,
  myAppCount,
};

export default clientAppService;
