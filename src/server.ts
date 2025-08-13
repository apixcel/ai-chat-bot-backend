/* eslint-disable no-console */
import app from "./app";
import config from "./app/config";
import prisma from "./app/lib/prisma";
import planSeed from "./app/utils/plan.utils";

async function main() {
  try {
    await prisma.$connect();
    await planSeed();
    app.listen(config.port, () => {
      console.log(`server running ⚡⚡⚡ on port => ${config.port}`);
    });
  } catch (error) {
    console.log(error);
  }
}

main();
