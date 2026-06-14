const { cpSync, existsSync } = require("node:fs");
const path = require("node:path");

module.exports = async function afterPack(context) {
  const projectDir = context.packager.projectDir;
  const sourceModules = path.join(projectDir, ".next", "standalone", "node_modules");
  const destModules = path.join(context.appOutDir, "resources", "standalone", "node_modules");

  if (!existsSync(sourceModules)) {
    throw new Error(
      "Missing .next/standalone/node_modules. Run `npm run build:desktop` before packaging.",
    );
  }

  cpSync(sourceModules, destModules, { recursive: true });
  console.log("Copied standalone node_modules into desktop bundle.");
};
