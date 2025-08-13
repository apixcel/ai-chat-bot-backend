import { readFileSync } from "fs";
import config from "../config";

const getFileContent = (filePath: string) => {
  let file = readFileSync(filePath, "utf-8");
  file = file.replace("{{link}}", config.frontend_base_url!);
  return file;
};


export { getFileContent };