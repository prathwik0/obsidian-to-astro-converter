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
import { join, extname, relative, basename } from "path";

const sourceDirectory = "";
const destinationDirectory = "";

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
      if (basename(srcPath) === "assets") {
        const relativePath = relative(sourceDirectory, src);
        const publicDir = join(destinationDirectory, "public", relativePath);
        astroConvert(srcPath, publicDir);
      } else {
        astroConvert(srcPath, destPath);
      }
    } else {
      if (extname(file) === ".md") {
        modifyMarkdownFile(srcPath, destPath);
      } else {
        copyFileSync(srcPath, destPath);
      }
    }
  });
};

function modifyMarkdownFile(srcPath, destPath) {
  readFile(srcPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading the file:", err);
      return;
    }

    const rules = [
      {
        name: "images",
        regex: /\((images\/[^)]+)\)/g,
        replace: "(./$1)",
      },
      {
        name: "assets",
        regex: /\((assets\/[^)]+)\)/g,
        replace: (match, p1) => `(/nndl/${p1.replace("assets/", "")})`,
      },
      {
        name: "mdFiles",
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

astroConvert(sourceDirectory, destinationDirectory);
console.log("Files copied, restructured, and modified successfully.");
