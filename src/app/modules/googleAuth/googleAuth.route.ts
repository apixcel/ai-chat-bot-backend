import { Router } from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import googleAuthController from "./googleAuth.controller";

const router = Router();

router.get("/connectGoogle", authMiddleware.isAuthenticateUser, googleAuthController.connectGoogle);
router.get("/callback", googleAuthController.googelAuthCallBack);
router.get("/myConnection", authMiddleware.isAuthenticateUser, googleAuthController.myGoogleConnection);

const googleAuthRoute = router;
export default googleAuthRoute;
