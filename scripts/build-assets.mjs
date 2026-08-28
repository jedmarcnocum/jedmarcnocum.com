import { copyFile, mkdir, readdir, rm } from "node:fs/promises";

async function copyDirectory(source, destination) {
  await mkdir(destination, { recursive: true });

  for (const entry of await readdir(source, { withFileTypes: true })) {
    const sourcePath = `${source}/${entry.name}`;
    const destinationPath = `${destination}/${entry.name}`;

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath);
    } else {
      await copyFile(sourcePath, destinationPath);
    }
  }
}

await rm("dist/assets", { recursive: true, force: true });
await copyDirectory("assets", "dist/assets");
