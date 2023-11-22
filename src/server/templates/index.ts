import path from "path";
import fs from "fs";

import mustache from "mustache";

import { ASTRO_CLIENT_DIST_PATH } from "../constants";

const fileCache: { [x: string]: string } = {};

export function renderTemplate(templatePath: string, data: any) {
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
  data.EMAIL_BUCKET = `https://s3.us-west-2.amazonaws.com/${process.env.AWS_BUCKET_NAME}/template/email`;
  return mustache.render(cachedFile, data);
}