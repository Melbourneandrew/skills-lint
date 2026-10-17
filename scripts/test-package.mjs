import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const { name, version } = JSON.parse(fs.readFileSync("package.json", "utf8"));
const source = process.argv.includes("--registry")
  ? [`${name}@${version}`]
  : [];

const temporary = fs.mkdtempSync(
  path.join(os.tmpdir(), "skills-lint-package-"),
);
const npm = (args, cwd) =>
  execFileSync(process.execPath, [process.env.npm_execpath, ...args], {
    cwd,
    encoding: "utf8",
  });
try {
  const [packed] = JSON.parse(
    npm(["pack", ...source, "--json", "--pack-destination", temporary], root),
  );
  const allowed = new Set([
    "package.json",
    "README.md",
    "LICENSE",
    "dist/cli.cjs",
    "dist/index.cjs",
    "dist/index.d.cts",
    "dist/types.d.cts",
    "dist/THIRD-PARTY-NOTICES.txt",
  ]);
  assert.deepEqual(new Set(packed.files.map((file) => file.path)), allowed);
  fs.writeFileSync(path.join(temporary, "package.json"), '{"private":true}');
  npm(
    [
      "install",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      path.join(temporary, packed.filename),
    ],
    temporary,
  );
  const installed = path.join(
    temporary,
    "node_modules",
    "@melbourneandrew",
    "skills-lint",
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(installed, "package.json"), "utf8"),
  );
  assert.equal(manifest.version, version);
  assert.equal(manifest.name, name);
  for (const file of ["cli.cjs", "index.cjs", "index.d.cts", "types.d.cts"])
    assert.deepEqual(
      fs.readFileSync(path.join(installed, "dist", file)),
      fs.readFileSync(path.join(root, "dist", file)),
    );
  assert.equal(manifest.bin["skills-lint"], "dist/cli.cjs");
  assert.equal(manifest.dependencies, undefined);
  assert.equal(manifest.scripts.postinstall, undefined);
  const cli = path.join(installed, "dist", "cli.cjs");
  const run = (args) =>
    spawnSync(process.execPath, [cli, "--workspace", root, ...args], {
      cwd: temporary,
      encoding: "utf8",
    });
  const valid = run(["test/fixtures/valid", "--format", "json"]);
  assert.equal(valid.status, 0, valid.stderr);
  assert.ok(JSON.parse(valid.stdout).skillCount > 0);
  assert.equal(run(["test/fixtures/invalid"]).status, 1);
  assert.equal(run(["--unknown"]).status, 2);
  // npm exec resolves the installed bin shim on Windows as well as POSIX.
  assert.match(
    npm(["exec", "--offline", "--", "skills-lint", "--help"], temporary),
    /Usage: skills-lint/,
  );
  const consumer = path.join(temporary, "consumer.cts");
  fs.writeFileSync(
    consumer,
    'import { validate, type Result } from "@melbourneandrew/skills-lint";\nconst result: Result = validate({allowEmpty: true});\nconsole.log(result.ok);\n',
  );
  execFileSync(
    process.execPath,
    [
      path.join(root, "node_modules/typescript/bin/tsc"),
      "--ignoreConfig",
      "--strict",
      "--module",
      "NodeNext",
      "--target",
      "ES2023",
      "--noEmit",
      consumer,
    ],
    { stdio: "inherit" },
  );
  for (const extension of ["cjs", "mjs"]) {
    const code =
      extension === "cjs"
        ? 'const { validate } = require("@melbourneandrew/skills-lint");'
        : 'import { validate } from "@melbourneandrew/skills-lint";';
    const filename = path.join(temporary, `consumer.${extension}`);
    fs.writeFileSync(
      filename,
      `${code}\nif (!validate({allowEmpty:true}).ok) process.exit(1);`,
    );
    execFileSync(process.execPath, [filename], {
      cwd: temporary,
      stdio: "inherit",
    });
  }
  console.log(
    `Packed package verified: ${packed.filename} (${packed.size} bytes)`,
  );
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
