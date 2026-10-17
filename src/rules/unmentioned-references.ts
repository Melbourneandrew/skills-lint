import fs from "node:fs";
import path from "node:path";
import { Rule } from "../types.js";
import type { LintRule } from "./types.js";

export const unmentionedReferences: LintRule = {
  id: Rule.UnmentionedReferences,
  referenceUrl: "https://agentskills.io/specification#progressive-disclosure",
  check: ({ directory, body, bodyLine }) => {
    if (/\breferences\b/i.test(body)) return [];
    const references = path.join(directory, "references");
    if (!fs.existsSync(references)) return [];
    if (!fs.lstatSync(references).isDirectory()) return [];
    if (!fs.readdirSync(references).length) return [];
    return [
      {
        line: bodyLine,
        column: 1,
        message:
          "references/ contains files but is not mentioned in SKILL.md; consider pointing to it so agents know when to load it.",
      },
    ];
  },
};
