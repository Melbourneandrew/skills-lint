export declare const Profile: {
    readonly Auto: "auto";
    readonly Spec: "spec";
    readonly Claude: "claude";
    readonly Codex: "codex";
    readonly Gemini: "gemini";
    readonly OpenCode: "opencode";
    readonly OpenClaw: "openclaw";
    readonly Cursor: "cursor";
    readonly Pi: "pi";
};
export type Profile = (typeof Profile)[keyof typeof Profile];
export type ResolvedProfile = Exclude<Profile, "auto">;
export declare const Severity: {
    readonly Error: "error";
    readonly Warning: "warning";
};
export type Severity = (typeof Severity)[keyof typeof Severity];
export declare const Rule: {
    readonly Discovery: "discovery";
    readonly Yaml: "yaml";
    readonly Field: "field";
    readonly Name: "name";
    readonly UnknownField: "unknown-field";
    readonly Body: "body";
    readonly SkillLength: "skill-length";
    readonly TokenLength: "token-length";
    readonly UnmentionedReferences: "unmentioned-references";
    readonly Duplicate: "duplicate-name";
    readonly Sidecar: "sidecar";
    readonly Limit: "limit";
};
export type Rule = (typeof Rule)[keyof typeof Rule];
export interface Diagnostic {
    file: string;
    line: number;
    column: number;
    rule: Rule;
    severity: Severity;
    message: string;
    referenceUrl?: string;
}
export interface Options {
    workspace?: string;
    paths?: string[];
    profile?: Profile;
    allowEmpty?: boolean;
    failOnWarnings?: boolean;
}
export interface Result {
    skillCount: number;
    errorCount: number;
    warningCount: number;
    diagnostics: Diagnostic[];
    durationMs: number;
    ok: boolean;
}
export declare const Limits: {
    readonly FileBytes: number;
    readonly FrontmatterBytes: number;
    readonly Entries: 100000;
    readonly Depth: 64;
    readonly Aliases: 50;
};
