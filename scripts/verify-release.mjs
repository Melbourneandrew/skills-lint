import assert from "node:assert/strict";
import fs from "node:fs";

const { version } = JSON.parse(fs.readFileSync("package.json", "utf8"));
assert.match(version, /^\d+\.\d+\.\d+$/);
assert.equal(
  process.env.GITHUB_REF,
  `refs/tags/v${version}`,
  "Publish must run from the matching immutable version tag",
);
