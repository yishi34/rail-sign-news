import { copyFile, mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = dirname(fileURLToPath(import.meta.resolve("maplibre-gl")));
const packageRoot = dirname(dist);
const { version } = JSON.parse(await readFile(join(packageRoot, "package.json"), "utf8"));
const destination = new URL(`../public/vendor/maplibre/${version}/`, import.meta.url);
await mkdir(destination, { recursive: true });
for (const name of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  await copyFile(join(dist, name), new URL(name, destination));
}
await copyFile(join(packageRoot, "LICENSE.txt"), new URL("LICENSE.txt", destination));
console.log(`Prepared MapLibre ${version} worker assets`);
