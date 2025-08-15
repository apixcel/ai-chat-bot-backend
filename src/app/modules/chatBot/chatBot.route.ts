import { Router } from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import chatBotController from "./chatBot.controller";

const router = Router();

router.post("/access-token", chatBotController.getChatBotAccessToken);
router.post(
  "/query",
  authMiddleware.validateBotAccessToken,
  chatBotController.getQueryResponseByAccessToken
);

router.get("/sdk/:appSecret", chatBotController.chatBotSdk);

const chatBotRoute = router;
export default chatBotRoute;
