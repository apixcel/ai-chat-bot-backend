import { Router } from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import clientAppController from "./clientApp.controller";

const router = Router();

router.use(authMiddleware.isAuthenticateUser);

router.post("/create", clientAppController.creatApp);
router.get("/get", clientAppController.getUsersAllApps);
router.get("/get/:appId", clientAppController.getAppById);
router.get("/get/key/:appId", clientAppController.getAppApiKeyByAppId);

const clientAppRoute = router;
export default clientAppRoute;
