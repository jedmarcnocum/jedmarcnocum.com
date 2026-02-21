import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { minify } from "html-minifier-terser";

const htmlFiles = ["index.html", "404.html", "portfolio.html", "labs.html"];

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await mkdir("dist/assets", { recursive: true });

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
