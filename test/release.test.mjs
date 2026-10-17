import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const { version } = JSON.parse(fs.readFileSync("package.json", "utf8"));
for (const ref of [
  `refs/tags/v${version}`,
  "refs/heads/main",
  "refs/tags/v1",
  "refs/tags/v0.0.0",
]) {
  test(`release guard validates ${ref}`, () => {
    const result = spawnSync(process.execPath, ["scripts/verify-release.mjs"], {
      env: { ...process.env, GITHUB_REF: ref },
      encoding: "utf8",
    });
    assert.equal(result.status, ref === `refs/tags/v${version}` ? 0 : 1);
  });
}
