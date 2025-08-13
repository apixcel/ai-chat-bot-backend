import { Request, Response } from "express";

const subscriptionComplete = async (_req: Request, res: Response) => {
  // const sig = req.headers["stripe-signature"] as string;

  // let event;

  // try {
  //   event = stripe.webhooks.constructEvent(req.body, sig, config.STRIPE_WEBHOOK_SECRET!);
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // } catch (err: any) {
  //   console.error("❌ Webhook signature verification failed:", err.message);
  //   return res.status(400).send(`Webhook Error: ${err.message}`);
  // }

  // if (event.type === "checkout.session.completed") {
  //   const session = event.data.object;

  //   if (session.mode === "subscription" && typeof session.subscription === "string") {
  //     try {
  //       const internalSubId = session.metadata?.internalSubId;
  //       const userId = session.metadata?.userId;

  //       if (!internalSubId || !userId) {
  //         console.warn("⚠️ Metadata missing in subscription");
  //         return res.status(200).send("No metadata, skipping DB update");
  //       }

  //       await prisma.subscription.update({
  //         where: { id: internalSubId },
  //         data: {
  //           status: "active",
  //         },
  //       });

  //       await prisma.user.update({
  //         where: { id: userId },
  //         data: {
  //           currentSubscriptionId: internalSubId,
  //         },
  //       });

  //       console.log("✅ Subscription activated via webhook for user:", userId);
  //     } catch (error) {
  //       console.error("🔴 Failed to fetch subscription or update DB:", error);
  //       return res.status(500).send("Internal error");
  //     }
  //   }
  // }

  return res.status(200).send("Webhook received");
};

const subscriptionWebhook = {
  subscriptionComplete,
};

export default subscriptionWebhook;
