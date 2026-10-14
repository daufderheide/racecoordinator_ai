const fs = require("fs");
const path = require("path");

const clientNodeModules = path.resolve(__dirname, "..", "node_modules");
const widgetsDir = path.resolve(__dirname, "..", "..", "custom_widgets");
const targetLink = path.join(widgetsDir, "node_modules");

if (fs.existsSync(widgetsDir) && fs.existsSync(clientNodeModules)) {
  try {
    const stat = fs.lstatSync(targetLink);
    if (stat.isSymbolicLink()) {
      try {
        fs.statSync(targetLink);
      } catch {
        // Stale or broken symlink: recreate
        fs.unlinkSync(targetLink);
        fs.symlinkSync(clientNodeModules, targetLink, "junction");
        console.log(
          "Re-linked custom_widgets/node_modules -> client/node_modules",
        );
      }
    }
  } catch {
    // Does not exist yet: create link / junction
    try {
      fs.symlinkSync(clientNodeModules, targetLink, "junction");
      console.log("Linked custom_widgets/node_modules -> client/node_modules");
    } catch (err) {
      console.warn(
        "Warning: Could not link custom_widgets/node_modules:",
        err.message,
      );
    }
  }
}
