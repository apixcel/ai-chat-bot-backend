import { google } from "googleapis";
import AppError from "../../errors/AppError";
import prisma from "../../lib/prisma";
import googleAuthUtils from "./googleAuth.utils";

const connectGoogle = async (userId: string) => {
  await prisma.googleAuthToken.deleteMany({
    where: {
      userId,
    },
  });
  const expires_at = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.googleAuthToken.create({
    data: {
      userId,
      expiry_date: expires_at,
    },
  });

  const oauth2 = googleAuthUtils.makeOAuthClient();
  const url = oauth2.generateAuthUrl({
    access_type: "offline", // --- to get refresh_token
    prompt: "consent", // to get refresh_token on first connect
    scope: googleAuthUtils.GOOGLE_AUTH_SCOPES,
    state: userId, // this value will be available on the callback---
  });

  return url;
};

const myGoogleConnection = async (userId: string) => {
  const row = await prisma.googleAuthToken.findUnique({
    where: { userId: userId },
  });

  if (!row) {
    return { connected: false, hasRequiredScopes: false };
  }

  const now = new Date();
  const isExpired = row.expiry_date ? new Date(row.expiry_date) < now : true;

  if (isExpired && row.refreshToken) {
    try {
      const oauth2 = googleAuthUtils.makeOAuthClient();
      oauth2.setCredentials({
        access_token: row.accessToken || undefined,
        refresh_token: row.refreshToken || undefined,
        scope: row.scope || undefined,
        token_type: row.tokenType || undefined,
        expiry_date: row.expiry_date ? new Date(row.expiry_date).getTime() : undefined,
      });
      await oauth2.getAccessToken();
      const refreshed = await prisma.googleAuthToken.findUnique({
        where: { userId: userId },
      });
      if (refreshed) {
        Object.assign(row, refreshed);
      }
    } catch {
      // ignore refresh errors
    }
  }

  const grantedScopes = row.scope || "";
  const hasRequiredScopes = googleAuthUtils.areScopesSatisfied(grantedScopes);

  return { connected: true, hasRequiredScopes, createdAt: row.createdAt };
};

const myGoogleDocList = async (
  userId: string,
  query: Record<string, string | number | undefined>
) => {
  const auth = await googleAuthUtils.getAuthForUser(userId);
  if (!auth) {
    throw new AppError(404, "Failed to load Google Docs, please again connect your google account");
  }
  const drive = google.drive({ version: "v3", auth });

  const { searchTerm, nextPageToken } = query;

  let q = "mimeType='application/vnd.google-apps.document' and trashed=false and 'me' in owners";

  if (searchTerm) {
    q += ` and name contains '${searchTerm}'`;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const { data } = await drive.files.list({
    q: q,
    fields: "nextPageToken, files(id,name,owners(displayName),modifiedTime)",
    pageSize: 10,
    pageToken: nextPageToken || undefined,
  });

  return {
    files: data.files,
    nextPageToken: data.nextPageToken,
  };
};

const googleAuthService = {
  connectGoogle,
  myGoogleConnection,
  myGoogleDocList,
};

export default googleAuthService;
