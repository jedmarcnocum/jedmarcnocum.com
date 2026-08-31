import { mkdir, readFile, writeFile } from "node:fs/promises";

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
  const outputPath = `dist/${file}`;
  const outputDirectory = outputPath.slice(0, outputPath.lastIndexOf("/"));

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, await readFile(file, "utf8"), "utf8");
}
