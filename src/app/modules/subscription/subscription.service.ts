import jwt from "jsonwebtoken";
import { join } from "path";
import config from "../../config";
import prisma from "../../lib/prisma";
import { getFileContent } from "../../utils";
import { ISubscriptionCheckoutSessionPayload } from "./subscription.interface";
const successFilePath = join(__dirname, "../../templates/success.html");
const failedFilePath = join(__dirname, "../../templates/error.html");
const createSubscription = async (userId: string, planId: string) => {
  // const plan = await prisma.plan.findUnique({
  //   where: { id: planId },
  // });

  // if (!plan) {
  //   throw new AppError(404, "Plan not found");
  // }
  // const productsList = await stripe.products.list({
  //   limit: 100,
  // });

  // const priceId = productsList.data.find((product) => product.id === plan.stripeProdId);

  // if (!priceId || !priceId?.default_price) {
  //   throw new AppError(404, "Plan not found");
  // }

  // const customerId = await userUtils.getUserCustomeridByUserId(userId);

  // const ulrs = {
  //   success: config.SERVER_URL + "/api/v1/subscription/confirm",
  //   cancel: config.SERVER_URL + "/api/v1/subscription/cancel",
  // };

  // const subscriptionModelId = v4();

  // const payloadData: ISubscriptionCheckoutSessionPayload = {
  //   id: subscriptionModelId,
  //   userId,
  // };

  // const token = jwt.sign(payloadData, config.ACCESS_TOKEN.SECRET as string, { expiresIn: "5m" });

  // const session = await stripe.checkout.sessions.create({
  //   mode: "subscription",
  //   payment_method_types: ["card"],
  //   line_items: [
  //     {
  //       price: priceId.default_price as string,
  //       quantity: 1,
  //     },
  //   ],
  //   metadata: {
  //     internalSubId: subscriptionModelId,
  //     userId,
  //   },
  //   allow_promotion_codes: true,
  //   customer: customerId,
  //   success_url: ulrs.success + `?sub_token=${token}`,
  //   cancel_url: ulrs.cancel + `?sub_token=${token}`,
  // });

  // await prisma.subscription.create({
  //   data: {
  //     id: subscriptionModelId,
  //     status: "incomplete",
  //     userId: userId,
  //     trialPeriodDays: plan.trialPeriodDays,
  //     stripeSubscriptionId: "",
  //     stripeCustomerId: customerId,
  //     planId: plan.id,
  //     startDate: new Date(),
  //     price: plan.price,
  //   },
  // });

  // return session
  return { userId, planId, url: "https://stupid.com" };
};

const subscriptionPaymentConfirm = async (token?: string) => {
  if (!token) {
    return getFileContent(failedFilePath);
  }

  let decoded: undefined | ISubscriptionCheckoutSessionPayload = undefined;

  try {
    decoded = jwt.verify(token, config.ACCESS_TOKEN.SECRET as string) as {
      id: string;
      userId: string;
    };
  } catch {
    return getFileContent(failedFilePath);
  }

  if (!decoded) {
    return getFileContent(failedFilePath);
  }

  await prisma.user.update({
    where: { id: decoded.userId },
    data: {
      currentSubscriptionId: decoded.id,
    },
  });

  return getFileContent(successFilePath);
};

const subscriptionPaymentCancel = async (token: string) => {
  if (!token) {
    return getFileContent(failedFilePath);
  }

  let decoded: undefined | ISubscriptionCheckoutSessionPayload = undefined;

  try {
    decoded = jwt.verify(token, config.ACCESS_TOKEN.SECRET as string) as {
      id: string;
      userId: string;
    };
  } catch {
    return getFileContent(failedFilePath);
  }

  if (!decoded) {
    return getFileContent(failedFilePath);
  }

  await prisma.subscription.update({
    where: { id: decoded.id },
    data: {
      status: "canceled",
    },
  });

  return getFileContent(failedFilePath);
};

const subscriptionService = {
  createSubscription,
  subscriptionPaymentConfirm,
  subscriptionPaymentCancel,
};
export default subscriptionService;
