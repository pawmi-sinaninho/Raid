import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const version = "0.8.6.1";
const root = path.resolve(import.meta.dirname, "..");
const masterName = `DOFUS_RCC_PROJECT_MASTER_v${version}.md`;
const zipName = `DOFUS_Raid_Command_Center_Spec_v${version}.zip`;
const archiveRootName = `dofus_raid_command_center_spec_v${version}`;
const stagingBase = path.join(root, `.release-v${version.replaceAll(".", "-")}`);
const stagingRoot = path.join(stagingBase, archiveRootName);

const excludedDirectoryNames = new Set([
  ".git", ".agents", ".codex", ".next", ".pglite", "node_modules",
  "test-results", "playwright-report", path.basename(stagingBase)
]);
const binaryExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".ttf", ".otf", ".woff", ".woff2"]);

function excluded(relativePath, directory = false) {
  const parts = relativePath.split(path.sep);
  if (parts.some((part) => excludedDirectoryNames.has(part))) return true;
  const name = path.basename(relativePath);
  if (directory) return false;
  if (/^DOFUS_RCC_PROJECT_MASTER_v.*\.md$/u.test(name)) return true;
  if (/^DOFUS_Raid_Command_Center_Spec_v.*\.zip$/u.test(name)) return true;
  if (name.endsWith(".tsbuildinfo") || name.endsWith(".log") || name === ".env.local") return true;
  return false;
}

async function collect(directory = root, relativeBase = "") {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relativePath = path.join(relativeBase, entry.name);
    if (excluded(relativePath, entry.isDirectory())) continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await collect(absolutePath, relativePath));
    else if (entry.isFile()) result.push(relativePath);
  }
  return result.sort((a, b) => a.localeCompare(b, "en"));
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function fileType(relativePath) {
  const extension = path.extname(relativePath).toLowerCase();
  const labels = {
    ".md": "MD", ".json": "JSON", ".tsx": "TSX", ".ts": "TypeScript",
    ".mjs": "JavaScript", ".js": "JavaScript", ".css": "CSS", ".html": "HTML",
    ".sql": "SQL", ".png": "PNG", ".ttf": "Font", ".otf": "Font", ".txt": "Text",
    ".yml": "YAML", ".yaml": "YAML"
  };
  return labels[extension] ?? "Text";
}

function posix(relativePath) {
  return relativePath.split(path.sep).join("/");
}

async function buildMaster(files) {
  const records = [];
  for (const relativePath of files) {
    const buffer = await readFile(path.join(root, relativePath));
    records.push({
      relativePath,
      displayPath: posix(relativePath),
      buffer,
      binary: binaryExtensions.has(path.extname(relativePath).toLowerCase()),
      hash: sha256(buffer)
    });
  }
  const textRecords = records.filter((record) => !record.binary);
  const binaryRecords = records.filter((record) => record.binary);
  const lines = [
    "# RAIDWEAVE – Project Master",
    "",
    `**Projektversion:** v${version}  `,
    "**Stand:** 28.06.2026  ",
    "**Status:** Phase 8.6.1 Raid Truth Reconciliation & Pilot Hardening vollständig abgeschlossen; Phase 9B bleibt ausserhalb dieses Releases.  ",
    "**Funktion:** einzige aktive Quelldatei für das ChatGPT-Projekt.",
    "",
    "## Verbindliche Verwendung",
    "",
    "1. Diese Datei ersetzt in den ChatGPT-Projektquellen alle einzelnen Projektdateien.",
    "2. Das gleich versionierte ZIP bleibt das exakte Archiv für lokale Ablage, Git und Codex.",
    "3. Inhalte zwischen `BEGIN FILE` und `END FILE` sind vollständige eingebettete Textquellen.",
    "4. Binärdateien werden im Integritätsmanifest geführt und liegen vollständig im ZIP.",
    "5. Nicht enthalten sind reproduzierbare Abhängigkeiten und Caches wie `node_modules`, `.next`, Test-Traces, TypeScript-Buildinfo und Playwright-HTML-Berichte.",
    "6. Phase 9B und Wow-Layer-Funktionen sind in diesem Stand nicht implementiert.",
    "7. Bei Widersprüchen gelten `DECISIONS.md`, die versionierten JSON-Verträge, `CURRENT_STATUS.md` und `NEXT_STEP.md` in dieser Reihenfolge.",
    "",
    "## Quellenumfang",
    "",
    `- Vollständig eingebettete Textquellen: **${textRecords.length}**`,
    `- Nur manifestierte Binärdateien: **${binaryRecords.length}**`,
    `- Manifestierte Projektdateien gesamt: **${records.length}**`,
    "",
    "## Integritätsmanifest",
    "",
    "| Datei | Typ | Bytes | SHA-256 | Im Master |",
    "|---|---|---:|---|---|"
  ];
  for (const record of records) {
    lines.push(`| \`${record.displayPath}\` | ${fileType(record.relativePath)} | ${record.buffer.length} | \`${record.hash}\` | ${record.binary ? "nur manifestiert" : "vollständig"} |`);
  }
  lines.push("", "## Vollständig eingebettete Textquellen", "");
  for (const record of textRecords) {
    lines.push(`<!-- BEGIN FILE: ${record.displayPath} -->`, "");
    lines.push(record.buffer.toString("utf8").replace(/\r\n/gu, "\n").replace(/\n$/u, ""));
    lines.push("", `<!-- END FILE: ${record.displayPath} -->`, "");
  }
  await writeFile(path.join(root, masterName), `${lines.join("\n")}\n`, "utf8");
  return records;
}

async function stage(files) {
  if (!stagingBase.startsWith(`${root}${path.sep}`) || path.basename(stagingBase) !== `.release-v${version.replaceAll(".", "-")}`) {
    throw new Error("Unsafe staging path");
  }
  await rm(stagingBase, { recursive: true, force: true });
  await mkdir(stagingRoot, { recursive: true });
  for (const relativePath of [...files, masterName]) {
    const target = path.join(stagingRoot, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.join(root, relativePath), target);
  }
}

async function verify(files) {
  const verificationRoot = path.join(stagingBase, "verify");
  await rm(verificationRoot, { recursive: true, force: true });
  await mkdir(verificationRoot, { recursive: true });
  execFileSync("powershell.exe", ["-NoProfile", "-Command", "& { param($source,$destination) Expand-Archive -LiteralPath $source -DestinationPath $destination -Force }", path.join(root, zipName), verificationRoot], { stdio: "inherit" });
  const extractedRoot = path.join(verificationRoot, archiveRootName);
  for (const relativePath of [...files, masterName]) {
    const source = await readFile(path.join(root, relativePath));
    const archived = await readFile(path.join(extractedRoot, relativePath));
    if (sha256(source) !== sha256(archived)) throw new Error(`Archive mismatch: ${relativePath}`);
  }
  await rm(verificationRoot, { recursive: true, force: true });
}

const files = await collect();
const records = await buildMaster(files);
await stage(files);
await rm(path.join(root, zipName), { force: true });
execFileSync("powershell.exe", ["-NoProfile", "-Command", "& { param($source,$destination) Compress-Archive -LiteralPath $source -DestinationPath $destination -CompressionLevel Optimal }", stagingRoot, path.join(root, zipName)], { stdio: "inherit" });
await verify(files);
await rm(stagingBase, { recursive: true, force: true });

const masterStat = await stat(path.join(root, masterName));
const zipStat = await stat(path.join(root, zipName));
process.stdout.write(JSON.stringify({ version, files: records.length, text: records.filter((record) => !record.binary).length, binary: records.filter((record) => record.binary).length, masterBytes: masterStat.size, zipBytes: zipStat.size }, null, 2));
