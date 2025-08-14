import { readFileSync } from "fs";
import config from "../config";

const getFileContent = (filePath: string) => {
  let file = readFileSync(filePath, "utf-8");
  file = file.replace("{{link}}", config.frontend_base_url!);
  return file;
};

const getPassThroughRedirectUrl = (params: Record<string, string | number>) => {
  const query = Object.keys(params)
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return `${config.frontend_base_url}/pass-through?${query}`;
};

export { getFileContent, getPassThroughRedirectUrl };
