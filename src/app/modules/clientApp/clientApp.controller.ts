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
const UpdateAppByAppId = catchAsyncError(async (req, res) => {
  const user = req.user!;
  const payload = req.body;
  const appId = req.params.appId;
  const result = await clientAppService.UpdateAppByAppId(appId, user.id, payload);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: result,
    message: "App updated successfully",
  });
});
const deleteAppByAppId = catchAsyncError(async (req, res) => {
  const user = req.user!;
  const appId = req.params.appId;

  const result = await clientAppService.deleteAppByAppId(appId, user.id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: result,
    message: "App deleted successfully",
  });
});
const myAppCount = catchAsyncError(async (req, res) => {
  const user = req.user!;
  const count = await clientAppService.myAppCount(user.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    data: { count },
    message: "Apps fetched successfully",
  });
});
const clientAppController = {
  creatApp,
  getUsersAllApps,
  getAppById,
  getAppApiKeyByAppId,
  UpdateAppByAppId,
  deleteAppByAppId,
  myAppCount,
};

export default clientAppController;
