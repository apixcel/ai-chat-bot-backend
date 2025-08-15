import { Router } from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import { validSchema } from "../../middlewares/validator";
import authController from "./auth.controller";
import { authValidation } from "./auth.validation";

const router = Router();

router.post("/login", validSchema(authValidation.login), authController.login);
router.post("/register", validSchema(authValidation.register), authController.register);

router.post("/logout", authMiddleware.isAuthenticateUser(), authController.logout);
router.get("/author", authMiddleware.isAuthenticateUser(), authController.author);
router.post("/refresh-token", authController.refreshToken);
router.post("/forgot-password", authController.forgotPassword);
router.post(
  "/send-verification-email",
  validSchema(authValidation.sendVerificationEmail),
  authController.sendVerificationEmail
);
router.post("/verify-otp", authController.verifyEmail);
router.post(
  "/reset-password",
  validSchema(authValidation.resetPassword),
  authController.resetPassword
);
router.put("/change-password", authMiddleware.isAuthenticateUser(), authController.changePassword);

const authRoute = router;
export default authRoute;
