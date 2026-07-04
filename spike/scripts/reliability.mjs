import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const runs = Number(process.argv[2] ?? 10);
if (!Number.isInteger(runs) || runs < 1 || runs > 100) throw new Error('Runs must be an integer between 1 and 100.');
const root = process.cwd();
const artifacts = resolve(root, 'artifacts');
const runDir = resolve(artifacts, 'reliability-runs');
await mkdir(runDir, { recursive: true });
const results = [];

for (let index = 1; index <= runs; index += 1) {
  const child = spawnSync(process.execPath, ['--no-warnings', '--test', 'dist/tests/realtime.test.js'], {
    cwd: root,
    encoding: 'utf8'
  });
  if (child.status !== 0) {
    process.stdout.write(child.stdout ?? '');
    process.stderr.write(child.stderr ?? '');
    throw new Error(`Reliability run ${index} failed.`);
  }
  const metricsPath = resolve(artifacts, 'realtime-metrics.json');
  const metrics = JSON.parse(await readFile(metricsPath, 'utf8'));
  metrics.run = index;
  results.push(metrics);
  await copyFile(metricsPath, resolve(runDir, `run-${String(index).padStart(2, '0')}.json`));
  console.log(`Run ${index}/${runs}: p95=${metrics.latencyMs.p95}ms max=${metrics.latencyMs.max}ms updates=${metrics.acceptedQuickUpdates}/50`);
}

const summary = {
  generatedAt: new Date().toISOString(),
  runs,
  passedRuns: results.length,
  simulatedClientsPerRun: 16,
  totalQuickUpdates: results.reduce((sum, item) => sum + item.quickUpdates, 0),
  totalAcceptedQuickUpdates: results.reduce((sum, item) => sum + item.acceptedQuickUpdates, 0),
  allConverged: results.every((item) => item.converged),
  allRecoveryPassed: results.every((item) => item.recoveryPassed),
  allExclusiveClaimsSingleWinner: results.every((item) => JSON.stringify(item.exclusiveClaimStatuses) === JSON.stringify([200, 409])),
  allConflictsExplicit: results.every((item) => JSON.stringify(item.conflictStatuses) === JSON.stringify([200, 409])),
  latencyMsAcrossRuns: {
    medianP50: [...results].sort((a, b) => a.latencyMs.p50 - b.latencyMs.p50)[Math.floor(results.length / 2)].latencyMs.p50,
    worstP95: Math.max(...results.map((item) => item.latencyMs.p95)),
    worstMax: Math.max(...results.map((item) => item.latencyMs.max))
  },
  quickUpdateDurationMs: {
    min: Math.min(...results.map((item) => item.quickUpdateDurationMs)),
    max: Math.max(...results.map((item) => item.quickUpdateDurationMs)),
    average: Math.round(results.reduce((sum, item) => sum + item.quickUpdateDurationMs, 0) / results.length)
  },
  finalRevisionInvariant: results.every((item) => item.finalRevision === item.eventCount),
  runsDetail: results
};
await writeFile(resolve(artifacts, 'reliability-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(`Reliability PASS: ${runs}/${runs} runs, ${summary.totalAcceptedQuickUpdates}/${summary.totalQuickUpdates} updates accepted.`);
