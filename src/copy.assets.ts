import fs from "fs-extra";

/**
 * Copies the template files from the "src/app/templates" directory to
 * the "dist/templates" directory during the build process in producttion.
 *
 * @async
 */
async function copyTemplates() {
  try {
    // Copy the templates directory
    await fs.copy("src/app/templates", "dist/templates");
    console.log("Templates copied successfully!");
  } catch (err) {
    console.error("Error copying templates:", err);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
copyTemplates();
