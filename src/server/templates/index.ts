import path from "path";
import fs from "fs";

import mustache from "mustache";

import { ASTRO_CLIENT_DIST_PATH } from "../constants";

const fileCache: { [x: string]: string } = {};

export function renderTemplate(templatePath: string, data: unknown) {
  let cachedFile = fileCache[templatePath];
  if (!cachedFile) {
    let filePath = path.join(
      ASTRO_CLIENT_DIST_PATH,
      templatePath,
      "index.html"
    );
    try {
      console.log(`[server] caching template ${filePath}`);
      cachedFile = fs.readFileSync(filePath).toString();
      fileCache[templatePath] = cachedFile;
    } catch (error) {
      console.error(error);
      console.warn(`[potential solution] remove ext? ie renderTemplate("magic-link") not renderTemplate("magic-link.html")`);
    }
  }
  return mustache.render(cachedFile, data);
}