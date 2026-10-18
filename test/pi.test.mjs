import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { check, skill, workspace, write } from "./helpers.mjs";

for (const value of ["true", "false", '"true"', "1", "[]"]) {
  test(`Pi invocation flag: ${value}`, (t) => {
    const result = check(t, skill(`disable-model-invocation: ${value}\n`), {
      profile: "pi",
    });
    assert.equal(result.ok, value === "true" || value === "false");
    assert.equal(result.warningCount, 0);
  });
}

test("Pi recognizes portable tools, warns on unknown fields, and requires ASCII names", (t) => {
  assert.equal(
    check(t, skill("allowed-tools: Bash\n"), { profile: "pi" }).warningCount,
    0,
  );
  const unknown = check(t, skill("future-field: true\n"), { profile: "pi" });
  assert.equal(unknown.errorCount, 0);
  assert.equal(unknown.diagnostics[0].rule, "unknown-field");
  const unicode = check(t, skill("", "éxample"), { profile: "pi" });
  assert.ok(
    unicode.diagnostics.some(
      (d) => d.rule === "name" && d.message.includes("ASCII"),
    ),
  );
});

test("Pi profile works through CLI and GitHub action inputs", (t) => {
  const root = workspace(t);
  write(
    root,
    ".agents/skills/example/SKILL.md",
    skill("disable-model-invocation: true\n"),
  );
  for (const entrypoint of ["cli", "action"]) {
    const args = entrypoint === "cli" ? ["--profile", "pi"] : [];
    const result = spawnSync(
      process.execPath,
      [path.resolve(`dist/${entrypoint}.cjs`), ...args],
      {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, GITHUB_WORKSPACE: root, INPUT_PROFILE: "pi" },
      },
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /0 errors, 0 warnings/);
  }
});
