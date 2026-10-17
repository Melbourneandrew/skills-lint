import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { validate } from "../dist/index.cjs";
import { workspace, write, skill } from "./helpers.mjs";

const standard = "https://agentskills.io/specification#progressive-disclosure";
const skillPath = ".agents/skills/example/SKILL.md";

test("length advisory cites its source and empty body has no source", (t) => {
  const root = workspace(t);
  write(root, skillPath, skill("", "example", "line\n".repeat(496).trimEnd()));
  const result = validate({ workspace: root });
  assert.equal(result.errorCount, 0);
  assert.equal(result.warningCount, 1);
  assert.equal(result.diagnostics[0].rule, "skill-length");
  assert.equal(result.diagnostics[0].referenceUrl, standard);
  write(root, skillPath, skill("", "example", ""));
  const empty = validate({ workspace: root });
  assert.equal(empty.diagnostics[0].rule, "body");
  assert.equal(empty.diagnostics[0].referenceUrl, undefined);
});

test("nonempty references directory unmentioned in the body warns", (t) => {
  const root = workspace(t);
  write(root, skillPath, skill());
  write(root, ".agents/skills/example/references/sample.txt", "sample");
  write(root, ".agents/skills/example/scripts/run.sh", "run");
  write(root, ".agents/skills/example/assets/template.txt", "template");
  const result = validate({ workspace: root });
  assert.equal(result.errorCount, 0);
  assert.equal(result.warningCount, 1);
  assert.ok(
    result.diagnostics.every(
      (diagnostic) =>
        diagnostic.rule === "unmentioned-references" &&
        diagnostic.referenceUrl === standard,
    ),
  );
  assert.ok(result.diagnostics[0].message.includes("references/"));
});

test("body mention and empty references directory do not warn", (t) => {
  const root = workspace(t);
  write(root, skillPath, skill("", "example", "Read references/guide.md."));
  write(root, ".agents/skills/example/references/guide.md", "Guide");
  assert.equal(validate({ workspace: root }).warningCount, 0);
  write(root, skillPath, skill());
  fs.rmSync(path.join(root, ".agents/skills/example/references"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(root, ".agents/skills/example/references"));
  assert.equal(validate({ workspace: root }).warningCount, 0);
});

test("CLI and GitHub annotations print optional reference links", (t) => {
  const root = workspace(t);
  write(root, skillPath, skill());
  write(root, ".agents/skills/example/references/guide.md", "Guide");
  const cli = path.resolve("dist/cli.cjs");
  const text = spawnSync(process.execPath, [cli], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(text.status, 0);
  assert.match(
    text.stdout,
    /Reference: https:\/\/agentskills\.io\/specification/,
  );
  const json = spawnSync(process.execPath, [cli, "--format", "json"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(JSON.parse(json.stdout).diagnostics[0].referenceUrl, standard);
  const github = spawnSync(process.execPath, [cli, "--format", "github"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.match(
    github.stdout,
    /::warning .*Reference: https:\/\/agentskills\.io/,
  );
  const action = spawnSync(
    process.execPath,
    [path.resolve("dist/action.cjs")],
    {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, GITHUB_WORKSPACE: root },
    },
  );
  assert.equal(action.status, 0);
  assert.match(
    action.stdout,
    /::warning .*Reference: https:\/\/agentskills\.io/,
  );
});
