import { v4 } from "uuid";
import AppError from "../../errors/AppError";
import prisma from "../../lib/prisma";
import planSeed, { freePlanId } from "../../utils/plan.utils";

interface IProps {
  durationInMonths: number;
  createdAt: string | Date;
}

const isDurationOver = (payload: IProps): boolean => {
  const { createdAt, durationInMonths } = payload;
  const createdDate = new Date(createdAt);

  // Add the duration in months
  const expirationDate = new Date(createdDate);
  expirationDate.setUTCMonth(expirationDate.getUTCMonth() + durationInMonths);

  // Ensure both dates are in UTC and reset time to 00:00:00
  const resetUTCTime = (date: Date) =>
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

  const currentDate = resetUTCTime(new Date()); // Get today's UTC date
  const adjustedExpirationDate = resetUTCTime(expirationDate); // Expiry date in UTC

  return currentDate > adjustedExpirationDate;
};

const getUserCurrentSubscriptionId = async (userId: string) => {
  const userInfo = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      currentSubscriptionId: true,
    },
  });

  if (!userInfo) {
    throw new AppError(400, "User not found");
  }

  if (userInfo.currentSubscriptionId) {
    return userInfo.currentSubscriptionId;
  }

  const plan = await prisma.plan.findUnique({
    where: {
      id: freePlanId,
    },
  });

  if (!plan) {
    await planSeed();
  }

  const subscriptionId = v4();
  await prisma.subscription.create({
    data: {
      id: subscriptionId,
      status: "active",
      userId: userId,
      planId: freePlanId,
      price: 0,
      startDate: new Date(),
    },
  });

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      currentSubscriptionId: subscriptionId,
    },
  });
  if (userInfo?.currentSubscriptionId) {
    await prisma.subscription.delete({
      where: {
        id: userInfo?.currentSubscriptionId,
      },
    });
  }

  return subscriptionId;
};

const subscriptionUtils = {
  getUserCurrentSubscriptionId,
  isDurationOver,
};
export default subscriptionUtils;
