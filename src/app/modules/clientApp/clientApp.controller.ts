import catchAsyncError from "../../utils/catchAsync";
import sendResponse from "../../utils/send.response";
import { TClientAppCreatePayload } from "./clientApp.interface";
import clientAppService from "./clientApp.service";

const creatApp = catchAsyncError(async (req, res) => {
  const payload = req.body as TClientAppCreatePayload;
  const user = req.user!;
  const result = await clientAppService.createApp(payload, user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: result,
    message: "App created successfully",
  });
});

const getUsersAllApps = catchAsyncError(async (req, res) => {
  const user = req.user!;
  const result = await clientAppService.getUsersAllApps(user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: result,
    message: "Apps fetched successfully",
  });
});
const getAppById = catchAsyncError(async (req, res) => {
  const user = req.user!;
  const appId = req.params.appId;
  const result = await clientAppService.getAppById(appId, user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: result,
    message: "App fetched successfully",
  });
});

const getAppApiKeyByAppId = catchAsyncError(async (req, res) => {
  const user = req.user!;
  const appId = req.params.appId;
  const result = await clientAppService.getAppApiKeyByAppId(appId, user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: result,
    message: "App Api Key fetched successfully",
  });
});

const clientAppController = { creatApp, getUsersAllApps, getAppById, getAppApiKeyByAppId };

export default clientAppController;
