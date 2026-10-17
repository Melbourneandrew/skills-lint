import fs from "node:fs";
import { setTimeout } from "node:timers/promises";

const { name, version } = JSON.parse(fs.readFileSync("package.json", "utf8"));
const url = `https://registry.npmjs.org/${encodeURIComponent(name)}/${version}`;
async function registryVersion() {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (response.status === 404) return null;
  if (!response.ok)
    throw new Error(`Registry returned HTTP ${response.status}`);
  const manifest = await response.json();
  if (manifest.name !== name || manifest.version !== version)
    throw new Error("Registry returned an unexpected package identity");
  return manifest;
}
async function tarballAvailable(manifest) {
  const tarball = new URL(manifest.dist.tarball);
  if (tarball.origin !== "https://registry.npmjs.org")
    throw new Error("Unexpected tarball registry");
  const response = await fetch(tarball, {
    method: "HEAD",
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`Tarball returned HTTP ${response.status}`);
  return true;
}
if (process.argv.includes("--wait")) {
  let available = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    const manifest = await registryVersion();
    if (manifest && (await tarballAvailable(manifest))) {
      available = true;
      break;
    }
    console.log(
      `Waiting for ${name}@${version} to become available (${attempt + 1}/30)`,
    );
    await setTimeout(10_000);
  }
  if (!available)
    throw new Error(
      "npm has not exposed the published version after 30 availability checks; retry the workflow later",
    );
} else {
  const published = (await registryVersion()) !== null;
  if (!process.env.GITHUB_OUTPUT) throw new Error("GITHUB_OUTPUT is required");
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `published=${published}\n`);
}
