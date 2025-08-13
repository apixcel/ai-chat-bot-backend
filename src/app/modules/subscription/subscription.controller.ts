import catchAsyncError from "../../utils/catchAsync";
import sendResponse from "../../utils/send.response";
import subscriptionService from "./subscription.service";

const createSubscription = catchAsyncError(async (req, res) => {
  const userId = req.user!.id;
  const planId = req.body.planId;
  const session = await subscriptionService.createSubscription(userId, planId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: session.url,
    message: "Checkout session link",
  });
});

const subscriptionPaymentConfirm = catchAsyncError(async (req, res) => {
  const token = req.query.sub_token as string;
  const file = await subscriptionService.subscriptionPaymentConfirm(token);
  res.send(file);
});

const subscriptionPaymentCancel = catchAsyncError(async (req, res) => {
  const token = req.query.sub_token as string;
  const file = await subscriptionService.subscriptionPaymentCancel(token);
  res.send(file);
});

const subscriptionController = {
  createSubscription,
  subscriptionPaymentConfirm,
  subscriptionPaymentCancel,
};

export default subscriptionController;
