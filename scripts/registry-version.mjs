import fs from "node:fs";
import { setTimeout } from "node:timers/promises";

const { name, version } = JSON.parse(fs.readFileSync("package.json", "utf8"));
const url = `https://registry.npmjs.org/${encodeURIComponent(name)}/${version}`;
async function isPublished() {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (response.status === 404) return false;
  if (!response.ok)
    throw new Error(`Registry returned HTTP ${response.status}`);
  const manifest = await response.json();
  if (manifest.name !== name || manifest.version !== version)
    throw new Error("Registry returned an unexpected package identity");
  return true;
}
if (process.argv.includes("--wait")) {
  let available = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    if (await isPublished()) {
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
      "npm has not exposed the published version within five minutes; retry the workflow later",
    );
} else {
  const published = await isPublished();
  if (!process.env.GITHUB_OUTPUT) throw new Error("GITHUB_OUTPUT is required");
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `published=${published}\n`);
}
