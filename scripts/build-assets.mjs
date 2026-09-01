import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { minify } from "terser";

async function copyDirectory(source, destination) {
  await mkdir(destination, { recursive: true });

  for (const entry of await readdir(source, { withFileTypes: true })) {
    const sourcePath = `${source}/${entry.name}`;
    const destinationPath = `${destination}/${entry.name}`;

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath);
    } else if ([".js", ".mjs"].includes(extname(entry.name))) {
      const result = await minify(await readFile(sourcePath, "utf8"), {
        compress: true,
        mangle: true,
        module: extname(entry.name) === ".mjs",
        format: { comments: false }
      });

      if (!result.code) {
        throw new Error(`Unable to minify JavaScript asset: ${sourcePath}`);
      }

      await writeFile(destinationPath, result.code, "utf8");
    } else {
      await copyFile(sourcePath, destinationPath);
    }
  }
}

await rm("dist/assets", { recursive: true, force: true });
await copyDirectory("assets", "dist/assets");
