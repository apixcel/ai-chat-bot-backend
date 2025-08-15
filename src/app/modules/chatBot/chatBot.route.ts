import { Router } from "express";
import chatBotController from "./chatBot.controller";

const router = Router();

router.post("/getChatBotAccessToken", chatBotController.getChatBotAccessToken);

const chatBotRoute = router;
export default chatBotRoute;
