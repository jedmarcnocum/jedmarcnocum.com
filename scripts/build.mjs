import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { minify } from "html-minifier-terser";

const htmlFiles = ["index.html", "404.html", "certifications.html", "portfolio.html", "labs.html"];

async function copyDirectory(source, destination) {
  await mkdir(destination, { recursive: true });

  const entries = await readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = `${source}/${entry.name}`;
    const destinationPath = `${destination}/${entry.name}`;

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath);
      continue;
    }

    await copyFile(sourcePath, destinationPath);
  }
}

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await mkdir("dist/assets", { recursive: true });
await copyDirectory("assets", "dist/assets");

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const minified = await minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true
  });

  await writeFile(`dist/${file}`, minified, "utf8");
}
