import { GoogleAuthToken } from "@prisma/client";
import { google } from "googleapis";
import config from "../../config";
import prisma from "../../lib/prisma";

const GOOGLE_AUTH_SCOPES = [
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/documents.readonly", // structured read
  // "https://www.googleapis.com/auth/drive.readonly",    // OR export read
];
function areScopesSatisfied(grantedScopes: string) {
  if (!grantedScopes) {
    return false;
  }
  const granted = new Set(grantedScopes.split(/\s+/).filter(Boolean));
  return GOOGLE_AUTH_SCOPES.every((s) => granted.has(s));
}

function missingScopes(grantedScopes: string) {
  const granted = new Set((grantedScopes || "").split(/\s+/).filter(Boolean));
  return GOOGLE_AUTH_SCOPES.filter((s) => !granted.has(s));
}

function makeOAuthClient({ redirectUri }: { redirectUri?: string } = {}) {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = config;
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    redirectUri || GOOGLE_REDIRECT_URI
  );
}

async function saveToken(userId: string, tokens: Omit<GoogleAuthToken, "userId" | "createdAt">) {
  const update = {
    accessToken: tokens.accessToken ?? null,
    scope: tokens.scope ?? null,
    tokenType: tokens.tokenType ?? null,
    expiry_date: tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : new Date().toISOString(),
    refreshToken: tokens.refreshToken ?? null,
  };
  // Only update refresh_token if Google provided one (first consent / re-consent)
  if (typeof tokens.refreshToken !== "undefined") {
    update.refreshToken = tokens.refreshToken;
  }
  await prisma.googleAuthToken.update({
    where: {
      userId,
    },
    data: update,
  });
}

async function loadAuthTokenByUserId(userId: string) {
  const token = await prisma.googleAuthToken.findUnique({
    where: {
      userId,
    },
  });

  return token;
}

async function getAuthForUser(userId: string) {
  const row = await loadAuthTokenByUserId(userId);
  if (!row) {
    return null;
  }

  const oauth2 = makeOAuthClient();
  oauth2.setCredentials({
    access_token: row.accessToken || undefined,
    refresh_token: row.refreshToken || undefined,
    scope: row.scope || undefined,
    token_type: row.tokenType || undefined,
    expiry_date: new Date(row.expiry_date).getTime() || undefined,
  });

  // Persist refreshed tokens automatically (access; refresh only on re-consent)
  oauth2.on("tokens", async (t) => {
    const merged = {
      accessToken: t.access_token ?? row.accessToken,
      refreshToken: t.refresh_token ?? row.refreshToken,
      scope: t.scope ?? row.scope,
      tokenType: t.token_type ?? row.tokenType,
      expiry_date: new Date(t.expiry_date ?? row.expiry_date),
    };
    await saveToken(userId, merged);
  });

  return oauth2;
}

const googleAuthUtils = {
  GOOGLE_AUTH_SCOPES,
  areScopesSatisfied,
  missingScopes,
  makeOAuthClient,
  saveToken,
  loadAuthTokenByUserId,
  getAuthForUser,
};

export default googleAuthUtils;
