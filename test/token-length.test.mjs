import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { validate } from "../dist/index.cjs";
import { workspace, write, skill } from "./helpers.mjs";

const skillPath = ".agents/skills/example/SKILL.md";
const reference = "https://agentskills.io/specification#directory-structure";

for (const characters of [19_999, 20_000, 20_001]) {
  test(`token estimate boundary: ${characters} characters including frontmatter`, (t) => {
    const root = workspace(t);
    const content = skill("", "example", "");
    write(root, skillPath, content + "a".repeat(characters - content.length));
    const result = validate({ workspace: root });
    assert.equal(result.errorCount, 0);
    assert.equal(result.ok, true);
    assert.equal(result.warningCount, Number(characters > 20_000));
    if (characters <= 20_000) return;
    assert.equal(result.diagnostics[0].rule, "token-length");
    assert.equal(result.diagnostics[0].referenceUrl, reference);
    assert.match(result.diagnostics[0].message, /approximately 5001 tokens/);
    assert.match(result.diagnostics[0].message, /actual counts vary/);
    assert.match(
      result.diagnostics[0].message,
      /split detailed content into separate files/,
    );
    assert.equal(validate({ workspace: root, failOnWarnings: true }).ok, false);
  });
}

test("token estimate counts Unicode code points rather than UTF-16 units", (t) => {
  const root = workspace(t);
  const header = skill("", "example", "");
  write(root, skillPath, header + "😀".repeat(20_000 - header.length));
  assert.equal(validate({ workspace: root }).warningCount, 0);
  write(root, skillPath, header + "😀".repeat(20_001 - header.length));
  assert.match(
    validate({ workspace: root }).diagnostics[0].message,
    /5001 tokens/,
  );
});

test("line and token warnings coexist with guidance in CLI and action output", (t) => {
  const root = workspace(t);
  write(
    root,
    skillPath,
    skill("", "example", `${"line\n".repeat(500)}${"a".repeat(20_000)}`),
  );
  const result = validate({ workspace: root });
  assert.deepEqual(result.diagnostics.map((d) => d.rule).sort(), [
    "skill-length",
    "token-length",
  ]);
  for (const diagnostic of result.diagnostics) {
    assert.equal(diagnostic.referenceUrl, reference);
    assert.match(diagnostic.message, /references\/guide.md/);
    assert.match(diagnostic.message, /link them from SKILL.md/);
  }
  for (const entrypoint of ["cli", "action"]) {
    const output = spawnSync(
      process.execPath,
      [path.resolve(`dist/${entrypoint}.cjs`)],
      {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env, GITHUB_WORKSPACE: root },
      },
    );
    assert.equal(output.status, 0, output.stderr);
    assert.match(output.stdout, /token-length/);
    assert.ok(output.stdout.includes(reference));
    assert.match(output.stdout, /split detailed content into separate files/);
  }
});
