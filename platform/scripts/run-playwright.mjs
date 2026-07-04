import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const playwrightCli = require.resolve("@playwright/test/cli");
const testArgs = process.argv.slice(2);

const server = spawn(process.execPath, [nextBin, "start", "--hostname", "127.0.0.1", "--port", "3100"], {
  stdio: "inherit",
  env: {
    ...process.env,
    RAIDWEAVE_DB_MODE: "pglite",
    RAIDWEAVE_PGLITE_PATH: "memory://",
    RAIDWEAVE_TEST_MODE: "1"
  }
});

async function waitForServer() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Test server exited with code ${server.exitCode}.`);
    try {
      const response = await fetch("http://127.0.0.1:3100/api/health");
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Test server did not become ready within 120 seconds.");
}

async function stopServer() {
  if (server.exitCode !== null || !server.pid) return;
  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore" });
    await new Promise((resolve) => killer.once("exit", resolve));
  } else {
    server.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => server.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 5_000))
    ]);
  }
}

let exitCode = 1;
try {
  await waitForServer();
  const tests = spawn(process.execPath, [playwrightCli, "test", ...testArgs], {
    stdio: "inherit",
    env: { ...process.env, RAIDWEAVE_EXTERNAL_SERVER: "1" }
  });
  exitCode = await new Promise((resolve) => tests.once("exit", (code) => resolve(code ?? 1)));
} finally {
  await stopServer();
}

process.exit(exitCode);
