import { Rule } from "../../types.js";
import type { LintRule } from "../types.js";

export const skillLength: LintRule = {
  id: Rule.SkillLength,
  referenceUrl: "https://agentskills.io/specification#progressive-disclosure",
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
              "SKILL.md has at least 500 lines; keep the main instructions shorter and move detail to references.",
          },
        ];
  },
};
