import { mkdir, readFile, writeFile } from "node:fs/promises";
import { minify } from "html-minifier-terser";

const htmlFiles = [
  "index.html",
  "404.html",
  "resume.html",
  "certifications.html",
  "portfolio.html",
  "blog.html",
  "blog/cml-lab-rebuild/part-1-getting-started.html"
];

await mkdir("dist", { recursive: true });

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const outputPath = `dist/${file}`;
  const outputDirectory = outputPath.slice(0, outputPath.lastIndexOf("/"));
  const minifiedHtml = await minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true
  });

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, minifiedHtml, "utf8");
}
