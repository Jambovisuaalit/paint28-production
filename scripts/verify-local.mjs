import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import process from "node:process";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const includeE2E = process.argv.includes("--e2e");
const publish = process.argv.includes("--publish");
const outputDirectory = publish ? "docs/verification" : "verification-results";
const outputLimit = 20_000;

const publicBuildEnv = {
  ...process.env,
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? "https://example.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY:
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_local_verification_placeholder",
  VITE_EDGE_FUNCTION_NAME: process.env.VITE_EDGE_FUNCTION_NAME ?? "submit-quote",
  VITE_PREVIEW_ADMIN_EMAIL: process.env.VITE_PREVIEW_ADMIN_EMAIL ?? "ville@vidosocial.com",
};

function tail(value) {
  if (!value) return "";
  const text = String(value);
  return text.length > outputLimit ? text.slice(-outputLimit) : text;
}

function run(command, args, options = {}) {
  const startedAt = new Date();
  const started = performance.now();
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: options.env ?? process.env,
    encoding: "utf8",
    shell: false,
  });
  const endedAt = new Date();

  return {
    command: [command, ...args].join(" "),
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    durationMs: Math.round(performance.now() - started),
    exitCode: result.status ?? 1,
    signal: result.signal ?? null,
    stdoutTail: tail(result.stdout),
    stderrTail: tail(result.stderr),
    error: result.error?.message ?? null,
  };
}

function readVersion(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    encoding: "utf8",
    shell: false,
  });
  return result.status === 0 ? String(result.stdout).trim() : null;
}

const gitSha = readVersion("git", ["rev-parse", "HEAD"]) ?? "unknown";
const gitBranch = readVersion("git", ["branch", "--show-current"]) ?? "unknown";
const startedAt = new Date().toISOString();
const steps = [
  { name: "lint", command: npmCommand, args: ["run", "lint"], env: publicBuildEnv },
  { name: "typecheck", command: npmCommand, args: ["run", "typecheck"], env: publicBuildEnv },
  {
    name: "build-vercel",
    command: npmCommand,
    args: ["run", "build", "--", "--mode", "vercel"],
    env: publicBuildEnv,
  },
];

if (includeE2E) {
  steps.push({
    name: "playwright-ui-smoke",
    command: npmCommand,
    args: ["run", "test:e2e:ci"],
    env: publicBuildEnv,
  });
}

const results = [];
for (const step of steps) {
  console.log(`\n[verify] ${step.name}`);
  const result = run(step.command, step.args, { env: step.env });
  results.push({ name: step.name, ...result });

  if (result.stdoutTail) process.stdout.write(result.stdoutTail);
  if (result.stderrTail) process.stderr.write(result.stderrTail);
  if (result.exitCode !== 0) break;
}

const passed = results.length === steps.length && results.every((step) => step.exitCode === 0);
const completedAt = new Date().toISOString();
const safeSha = gitSha.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 40);
const timestamp = completedAt.replace(/[:.]/g, "-");
const reportFile = `verification-${safeSha}-${timestamp}.json`;
const reportPath = join(outputDirectory, reportFile);

const report = {
  schemaVersion: "1.0",
  project: "Paint28 Oy",
  repository: "Jambovisuaalit/paint28-production",
  git: {
    sha: gitSha,
    branch: gitBranch,
  },
  runtime: {
    platform: process.platform,
    architecture: process.arch,
    node: process.version,
    npm: readVersion(npmCommand, ["--version"]),
  },
  configuration: {
    includeE2E,
    publishedToRepository: publish,
    turnstileSiteKeyConfigured: Boolean(process.env.VITE_TURNSTILE_SITE_KEY),
    supabaseUrlConfigured: Boolean(process.env.VITE_SUPABASE_URL),
    supabasePublishableKeyConfigured: Boolean(process.env.VITE_SUPABASE_PUBLISHABLE_KEY),
  },
  startedAt,
  completedAt,
  passed,
  steps: results,
};

mkdirSync(outputDirectory, { recursive: true });
const json = `${JSON.stringify(report, null, 2)}\n`;
writeFileSync(reportPath, json, "utf8");

const digest = createHash("sha256").update(json).digest("hex");
writeFileSync(`${reportPath}.sha256`, `${digest}  ${basename(reportPath)}\n`, "utf8");
writeFileSync(join(outputDirectory, "latest.json"), json, "utf8");
writeFileSync(join(outputDirectory, "latest.sha256"), `${digest}  latest.json\n`, "utf8");

console.log(`\n[verify] report: ${reportPath}`);
console.log(`[verify] sha256: ${digest}`);
console.log(`[verify] result: ${passed ? "PASS" : "FAIL"}`);

process.exit(passed ? 0 : 1);
