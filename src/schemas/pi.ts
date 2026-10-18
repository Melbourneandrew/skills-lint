import { optional, boolean, type Shape } from "./checks.js";

// https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md
export const pi: Shape = {
  "disable-model-invocation": optional(boolean),
};
