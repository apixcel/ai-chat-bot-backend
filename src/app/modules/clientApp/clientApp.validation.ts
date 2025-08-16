import { z } from "zod";

const originUrl = z
  .string()
  .url()
  .refine((u) => {
    try {
      const url = new URL(u);

      // Allow localhost or 127.0.0.1 (IPv4) or ::1 (IPv6)
      if (
        url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname === "[::1]"
      ) {
        return true;
      }

      // Allow valid origins without path/query/fragment
      return (
        !!url.protocol &&
        !!url.host &&
        (url.pathname === "/" || url.pathname === "") &&
        !url.search &&
        !url.hash
      );
    } catch {
      return false;
    }
  }, "Must be a valid origin (e.g., https://example.com or http://localhost:3000)");

const create = z
  .object({
    appName: z.string().min(1, "App name is required"),
    authorizedOrigin: originUrl,
    googleDocId: z.string().min(1, "Google Doc ID is required"),
  })
  .strict();

const update = create.partial();

const clientAppValidation = {
  create,
  update,
};

export default clientAppValidation;
