import prisma from "../../lib/prisma";
import { getPassThroughRedirectUrl } from "../../utils";
import catchAsyncError from "../../utils/catchAsync";
import sendResponse from "../../utils/send.response";
import googleAuthService from "./googleAuth.service";
import googleAuthUtils from "./googleAuth.utils";

const connectGoogle = catchAsyncError(async (req, res) => {
  const url = await googleAuthService.connectGoogle(req.user!.id);

  res.redirect(url);
});

const googelAuthCallBack = catchAsyncError(async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    res.redirect(
      getPassThroughRedirectUrl({
        error: 1,
        message: "An unexpected error occurred while connecting your google account",
      })
    );
  }

  const authToken = await prisma.googleAuthToken.findUnique({
    where: {
      userId: state as string,
    },
  });

  if (!authToken) {
    res.redirect(
      getPassThroughRedirectUrl({ error: 1, message: "Something went wrong, please try again" })
    );
    return;
  }

  if (authToken?.expiry_date < new Date()) {
    await prisma.googleAuthToken.delete({
      where: {
        userId: state as string,
      },
    });
    res.redirect(
      getPassThroughRedirectUrl({ error: 1, message: "Session expired, please to connect again" })
    );
    return;
  }

  const oauth2 = googleAuthUtils.makeOAuthClient();
  const { tokens } = await oauth2.getToken(String(code));

  const tokenPayload = {
    accessToken: tokens.access_token || null,
    refreshToken: tokens.refresh_token || null,
    scope: tokens.scope || null,
    tokenType: tokens.token_type || null,
    expiry_date: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(),
  };

  await googleAuthUtils.saveToken(state as string, tokenPayload);

  res.redirect(getPassThroughRedirectUrl({}));
});

const myGoogleConnection = catchAsyncError(async (req, res) => {
  const user = req.user!;

  const result = await googleAuthService.myGoogleConnection(user.id);

  sendResponse(res, {
    data: result,
    message: "Google connection status retrieved successfully",
    statusCode: 200,
    success: true,
  });
});

const myGoogleDocList = catchAsyncError(async (req, res) => {
  const query = req.query as Record<string, string | number | undefined>;
  const result = await googleAuthService.myGoogleDocList(req.user!.id, query);

  sendResponse(res, {
    data: result,
    message: "Google doc list retrieved successfully",
    statusCode: 200,
    success: true,
  });
});

const googleAuthController = {
  connectGoogle,
  googelAuthCallBack,
  myGoogleConnection,
  myGoogleDocList,
};

export default googleAuthController;
