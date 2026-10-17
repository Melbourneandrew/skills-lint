import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "skills-lint-types-"));
try {
  execFileSync(
    process.execPath,
    [
      "node_modules/typescript/bin/tsc",
      "--declaration",
      "--emitDeclarationOnly",
      "--outDir",
      temporary,
    ],
    { stdio: "inherit" },
  );
  const declaration = fs.readFileSync(
    path.join(temporary, "validate.d.ts"),
    "utf8",
  );
  fs.writeFileSync(
    "dist/index.d.cts",
    declaration.replaceAll("./types.js", "./types.cjs"),
  );
  fs.copyFileSync(path.join(temporary, "types.d.ts"), "dist/types.d.cts");
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
