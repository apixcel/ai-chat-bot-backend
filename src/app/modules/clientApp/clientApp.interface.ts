import { App } from "@prisma/client";

export type TClientAppCreatePayload = Pick<App, "appName" | "authorizedOrigin">;
