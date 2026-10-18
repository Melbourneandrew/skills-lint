import { Rule } from "../types.js";
import type { LintRule } from "./types.js";

export const tokenLength: LintRule = {
  id: Rule.TokenLength,
  referenceUrl: "https://agentskills.io/specification#directory-structure",
  check: ({ text }) => {
    // OpenAI's rough English-text estimate: approximately four characters/token.
    // https://help.openai.com/en/articles/4936856-understanding-and-counting-tokens
    // Count Unicode code points without allocating an array. This is not a
    // tokenizer: language, code, and model can substantially change real counts.
    let characters = 0;
    const codePoints = text[Symbol.iterator]();
    while (!codePoints.next().done) characters++;
    const estimatedTokens = Math.ceil(characters / 4);
    // https://agentskills.io/specification#progressive-disclosure recommends
    // <5,000 instruction tokens. We conservatively include frontmatter as well.
    return estimatedTokens <= 5_000
      ? []
      : [
          {
            line: 1,
            column: 1,
            message: `SKILL.md is approximately ${estimatedTokens} tokens, over 5,000 (rough English-text estimate: 4 characters/token, including frontmatter; actual counts vary). Recommended guidance: split detailed content into separate files in the skill directory (e.g. references/guide.md) and link them from SKILL.md.`,
          },
        ];
  },
};
