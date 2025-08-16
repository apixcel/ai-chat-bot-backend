import { Router } from "express";
import authMiddleware from "../../middlewares/authMiddleware";
import { validSchema } from "../../middlewares/validator";
import clientAppController from "./clientApp.controller";
import clientAppValidation from "./clientApp.validation";

const router = Router();

router.use(authMiddleware.isAuthenticateUser());

router.post("/create", validSchema(clientAppValidation.create), clientAppController.creatApp);
router.get("/get", clientAppController.getUsersAllApps);
router.get("/get/:appId", clientAppController.getAppById);
router.get("/get/a/count", clientAppController.myAppCount);
router.get("/get/key/:appId", clientAppController.getAppApiKeyByAppId);
router.patch(
  "/update/:appId",
  validSchema(clientAppValidation.update),
  clientAppController.UpdateAppByAppId
);

router.delete("/delete/:appId", clientAppController.deleteAppByAppId);

const clientAppRoute = router;
export default clientAppRoute;
