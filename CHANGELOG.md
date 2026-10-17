# Changelog

## 1.2.1

- Verify the actual npm registry artifact after publishing: exact bundle contents,
  CLI installation, exit codes, library imports, and TypeScript declarations.

## 1.2.0

- Renamed the project to Skills Lint and the GitHub repository to `skills-lint`.
- Added the public npm CLI/library package, type declarations, pre-commit examples,
  packed-package CI checks, and a trusted publishing workflow.
- Moved content rules into `src/rules/`, including duplicate-name checking.
- Required PRs and passing Linux, macOS, and Windows CI checks before merging.

## 1.1.0

- Added an advisory for nonempty `references/` directories not mentioned by the skill.
- Split per-skill lint advisories into individual, registered rule modules with
  optional reference URLs printed in text and GitHub annotations.
- Documented why the portable action does not estimate model-specific tokens.

## 1.0.1

- Cite the Agent Skills progressive disclosure guidance for the skill length
  advisory. Warn at 500 physical lines, including when the file ends in a newline.

## 1.0.0

- Portable Agent Skills schema checks plus Claude Code, Codex, Gemini CLI,
  OpenCode, OpenClaw, and Cursor profiles.
- YAML parsing, bounded discovery, in-workspace symlinks, annotations, summaries,
  CLI JSON output, and optional Codex sidecar checks.
- Single-file Node 24 action with no runtime installation; bundled YAML license.
- Strict TypeScript, complexity/line limits, small modules, and three-platform CI.
