import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { workspace } from "./helpers.mjs";

const { name, version } = JSON.parse(fs.readFileSync("package.json", "utf8"));
for (const [label, status, identity, expected] of [
  ["available", 200, { name, version }, 0],
  ["not yet visible", 404, {}, 0],
  ["registry error", 503, {}, 1],
  ["wrong identity", 200, { name: "other", version }, 1],
]) {
  test(`registry release check: ${label}`, (t) => {
    const root = workspace(t);
    const mock = path.join(root, "registry.mjs");
    const output = path.join(root, "output");
    fs.writeFileSync(
      mock,
      `globalThis.fetch = async () => new Response(${JSON.stringify(JSON.stringify(identity))}, {status:${status}});`,
    );
    const result = spawnSync(
      process.execPath,
      ["--import", pathToFileURL(mock).href, "scripts/registry-version.mjs"],
      {
        encoding: "utf8",
        env: { ...process.env, GITHUB_OUTPUT: output },
      },
    );
    assert.equal(result.status, expected, result.stderr);
    if (!expected)
      assert.equal(
        fs.readFileSync(output, "utf8"),
        `published=${status === 200}\n`,
      );
    else assert.equal(fs.existsSync(output), false);
  });
}

for (const host of ["registry.npmjs.org", "example.com"]) {
  test(`registry wait checks tarball host ${host}`, (t) => {
    const root = workspace(t);
    const mock = path.join(root, "registry.mjs");
    const manifest = {
      name,
      version,
      dist: { tarball: `https://${host}/package.tgz` },
    };
    fs.writeFileSync(
      mock,
      `globalThis.fetch = async (_url, options) => new Response(options.method === "HEAD" ? null : ${JSON.stringify(JSON.stringify(manifest))});`,
    );
    const result = spawnSync(
      process.execPath,
      [
        "--import",
        pathToFileURL(mock).href,
        "scripts/registry-version.mjs",
        "--wait",
      ],
      { encoding: "utf8" },
    );
    assert.equal(
      result.status,
      host === "registry.npmjs.org" ? 0 : 1,
      result.stderr,
    );
  });
}
