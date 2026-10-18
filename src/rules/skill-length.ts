import { Rule } from "../types.js";
import type { LintRule } from "./types.js";

export const skillLength: LintRule = {
  id: Rule.SkillLength,
  referenceUrl: "https://agentskills.io/specification#directory-structure",
  check: ({ text }) => {
    // Agent Skills guidance: https://agentskills.io/specification#progressive-disclosure
    const lineCount = text.split("\n").length - Number(text.endsWith("\n"));
    return lineCount < 500
      ? []
      : [
          {
            line: 1,
            column: 1,
            message:
              "SKILL.md has at least 500 lines. Recommended guidance: split detailed content into separate files in the skill directory (e.g. references/guide.md) and link them from SKILL.md.",
          },
        ];
  },
};
