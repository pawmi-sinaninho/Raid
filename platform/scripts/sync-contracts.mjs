import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const platform = join(here, "..");
const projectRoot = join(platform, "..");
const out = join(platform, "contracts");
await mkdir(out, { recursive: true });
for (const name of [
  "raid-definition.schema.json",
  "sanctuaire.v0.2.json",
  "gigalodon.v0.2.json",
  "design-tokens.v0.4.json"
]) {
  await copyFile(join(projectRoot, name), join(out, name));
}
