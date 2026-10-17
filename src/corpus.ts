import fs from "node:fs";
import path from "node:path";
import { readBounded, exists, errorMessage } from "./files.js";
import { parseMapping, parseSkill } from "./yaml.js";
import { validateSchema, validateSidecar } from "./schema.js";
import { Rule, Severity, type Diagnostic } from "./types.js";
import type { SkillFile } from "./discovery.js";
import { lintSkill } from "./rules/index.js";
import type { LintState } from "./rules/types.js";
export class Corpus {
  private readonly lintState: LintState = { names: new Map() };
  private readonly contents = new Map<string, string>();
  private readonly sidecars = new Set<string>();
  constructor(
    private readonly workspace: string,
    private readonly diagnostics: Diagnostic[],
  ) {}
  check(skill: SkillFile) {
    const file = path.relative(this.workspace, skill.file);
    try {
      this.checkSkill(skill, file);
    } catch (error) {
      this.error(file, error);
    }
  }
  private error(file: string, error: unknown) {
    this.diagnostics.push({
      file,
      line: 1,
      column: 1,
      rule: Rule.Discovery,
      severity: Severity.Error,
      message: errorMessage(error),
    });
  }
  private checkSkill(skill: SkillFile, file: string) {
    let text = this.contents.get(skill.realFile);
    if (text === undefined) {
      text = readBounded(skill.file, this.workspace);
      this.contents.set(skill.realFile, text);
    }
    const parsed = parseSkill(text, file, this.diagnostics);
    if (!parsed) return;
    const name = validateSchema(parsed, file, skill.profile, this.diagnostics);
    lintSkill(
      {
        file,
        realFile: skill.realFile,
        ...(name ? { name } : {}),
        nameLocation: parsed.location("name"),
        directory: path.dirname(skill.file),
        text,
        body: parsed.body,
        bodyLine: parsed.bodyLine,
      },
      this.diagnostics,
      this.lintState,
    );
    this.sidecar(path.join(path.dirname(skill.file), "agents", "openai.yaml"));
  }
  private sidecar(sidecar: string) {
    const file = path.relative(this.workspace, sidecar);
    try {
      if (!exists(sidecar)) return;
      const real = fs.realpathSync(sidecar);
      if (this.sidecars.has(real)) return;
      this.sidecars.add(real);
      const parsed = parseMapping(
        readBounded(sidecar, this.workspace),
        file,
        this.diagnostics,
      );
      if (parsed) validateSidecar(parsed, file, this.diagnostics);
    } catch (error) {
      this.error(file, error);
    }
  }
}
