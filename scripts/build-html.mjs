import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { minify } from "html-minifier-terser";

const analyticsTag = `    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-DK03RZY5FJ"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag("js", new Date());
      gtag("config", "G-DK03RZY5FJ");
    </script>`;

async function findHtmlFiles(directory = ".") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = directory === "." ? entry.name : `${directory}/${entry.name}`;

    if (entry.isDirectory()) {
      if (path !== "dist" && path !== "node_modules" && !path.startsWith(".")) {
        files.push(...await findHtmlFiles(path));
      }
    } else if (entry.isFile() && path.endsWith(".html")) {
      files.push(path);
    }
  }

  return files;
}

const htmlFiles = await findHtmlFiles();

await mkdir("dist", { recursive: true });

for (const file of htmlFiles) {
  const sourceHtml = await readFile(file, "utf8");
  const html = sourceHtml.includes("googletagmanager.com/gtag/js")
    ? sourceHtml
    : sourceHtml.replace(/(<head[^>]*>)/i, `$1\n${analyticsTag}`);
  const outputPath = `dist/${file}`;
  const outputDirectory = outputPath.slice(0, outputPath.lastIndexOf("/"));
  const minifiedHtml = await minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    minifyJS: true,
    useShortDoctype: true
  });

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, minifiedHtml, "utf8");
}
