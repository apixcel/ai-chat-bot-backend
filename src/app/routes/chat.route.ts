import { Router } from "express";
import chatController from "../controller/chat.controller";

const router = Router();
router.post("/query", chatController.sendMessageReply);

const chatRoute = router;
export default chatRoute;
