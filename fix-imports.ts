import { readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

function processDirectory(dir: string) {
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    if (statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith(".ts")) {
      let content = readFileSync(fullPath, "utf8");
      // Match `import something from "./path"` and `export something from "./path"`
      content = content.replace(/(from\s+["'])(\.[^"']*)(["'])/g, (match, prefix, path, suffix) => {
        if (!path.endsWith(".js") && !path.endsWith(".json")) {
          return `${prefix}${path}.js${suffix}`;
        }
        return match;
      });
      writeFileSync(fullPath, content);
    }
  }
}

processDirectory("api");
