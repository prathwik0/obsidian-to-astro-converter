import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  readFile,
  writeFile,
  readFileSync,
  writeFileSync,
  copyFileSync,
} from "fs";

import { join, extname, relative, basename, dirname } from "path";
import "dotenv/config";

const SOURCE_DIR = process.env.SOURCE_DIR;
const DEST_DIR = process.env.DEST_DIR;
const PUBLIC_DIR = process.env.PUBLIC_DIR;
const IGNORE = process.env.IGNORE;

const astroConvert = (src, dest) => {
  if (!existsSync(dest)) {
    mkdirSync(dest);
  }

  const files = readdirSync(src);

  files.forEach((file) => {
    const srcPath = join(src, file);
    const destPath = join(dest, file);
    const stats = statSync(srcPath);

    if (stats.isDirectory()) {
      if (basename(srcPath) === ".obsidian" || basename(srcPath) === IGNORE) {
        return;
      } else if (basename(srcPath) === "assets") {
        /* all items in assets folder are moved to public folder while retaining folder structure */
        const relativePath = relative(SOURCE_DIR, src);
        const publicDir = join(PUBLIC_DIR, relativePath);
        astroConvert(srcPath, publicDir);
      } else {
        astroConvert(srcPath, destPath);
      }
    } else if (extname(file) === ".md") {
      modifyMarkdownFile(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  });
};

function modifyMarkdownFile(srcPath, destPath) {
  readFile(srcPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the file:", err);
      return;
    }

    const relativePath = relative(SOURCE_DIR, dirname(srcPath));

    const rules = [
      {
        name: "images",
        regex: /\((images\/[^)]+)\)/g,
        replace: "(./$1)",
      },
      {
        name: "assets",
        regex: /\((assets\/[^)]+)\)/g,
        replace: (match, p1) =>
          `(/${relativePath}${p1.replace("assets/", "")})`,
      },
      {
        name: "md-links",
        regex: /\(([^)]+\.md)\)/g,
        replace: (match, p1) => `(../${p1.replace(".md", "")})`,
      },
    ];

    let updatedContent = data;

    for (let rule in rules) {
      updatedContent = updatedContent.replace(
        rules[rule].regex,
        rules[rule].replace
      );
    }

    writeFile(destPath, updatedContent, "utf8", (err) => {
      if (err) {
        console.error("Error writing to the file:", err);
        return;
      }
    });
  });
}

astroConvert(SOURCE_DIR, DEST_DIR);
console.log("Files copied, restructured, and modified successfully.");
