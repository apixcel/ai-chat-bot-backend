import { Router } from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import subscriptionController from "./subscription.controller";
const router = Router();

router.post(
  "/create",
  authMiddleware.isAuthenticateUser(),
  subscriptionController.createSubscription
);

// hit by stripe checkout session redirect
// @on payment success
router.get("/confirm", subscriptionController.subscriptionPaymentConfirm);
router.post("/confirm", subscriptionController.subscriptionPaymentConfirm);

// @on payment cancel
router.get("/cancel", subscriptionController.subscriptionPaymentCancel);
router.post("/cancel", subscriptionController.subscriptionPaymentCancel);

const subscriptionRoute = router;
export default subscriptionRoute;
