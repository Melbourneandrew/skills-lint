# Skills Lint

[![CI](https://github.com/Melbourneandrew/skills-lint/actions/workflows/ci.yml/badge.svg)](https://github.com/Melbourneandrew/skills-lint/actions/workflows/ci.yml)

Lint agent skills with `npx @melbourneandrew/skills-lint` (Node.js 24+) or add
`- uses: Melbourneandrew/skills-lint@v1` after checkout in GitHub Actions.

The baseline is the [Agent Skills specification](https://agentskills.io/specification).
Harness profiles add checks for fields documented by
[Claude Code](https://code.claude.com/docs/en/skills#frontmatter-reference),
[Codex](https://learn.chatgpt.com/docs/build-skills),
[Gemini CLI](https://geminicli.com/docs/cli/creating-skills/),
[OpenCode](https://opencode.ai/docs/skills/),
[OpenClaw](https://docs.openclaw.ai/tools/skills), and
[Cursor](https://cursor.com/docs/skills). See [Research, references, and precedents](#research-references-and-precedents)
for the reference implementations and related validators reviewed.

## Errors and warnings

Errors fail the check for problems that can prevent an agent from loading or
using a skill. Warnings suggest improvements to skill content and organization.

### Errors

| Check                     | What fails                                                                                                                                                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| YAML and frontmatter      | Missing `---` delimiters, malformed YAML, duplicate keys, unresolved tags or aliases, a non-mapping root, or non-string mapping keys.                                                                                              |
| Required fields and types | Missing `name` or `description`; invalid types, lengths, or values in portable fields or supported harness extensions.                                                                                                             |
| Skill name                | Invalid name syntax or a name that does not match its parent directory. OpenCode additionally requires ASCII names.                                                                                                                |
| Unknown portable fields   | Unrecognized top-level fields when using `profile: spec`.                                                                                                                                                                          |
| Codex sidecar             | Invalid types or values in supported `agents/openai.yaml` fields, wherever that file is present.                                                                                                                                   |
| Discovery and limits      | Missing explicit paths, unreadable files, incorrect `SKILL.md` casing, paths outside the workspace, symlink cycles, invalid UTF-8, or exceeded file, traversal, or YAML limits. Zero skills fails unless `allow-empty` is enabled. |

Invalid action inputs or CLI options also fail before validation.

### Warnings

| Check                     | What is reported                                                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty instructions        | No Markdown instructions after the frontmatter.                                                                                                                                                                           |
| Skill length              | At least 500 physical lines in `SKILL.md`. The [standard recommends keeping it under 500](https://agentskills.io/specification#progressive-disclosure).                                                                   |
| Estimated tokens          | Over 5,000 estimated tokens in `SKILL.md`, including frontmatter (four Unicode characters per token). A rough English-text heuristic, not an exact count.                                                                 |
| Unmentioned references    | A nonempty, direct `references/` directory whose name never appears in the skill body. This is a heuristic based on [loading supporting material on demand](https://agentskills.io/specification#progressive-disclosure). |
| Duplicate name            | The same skill name appears in distinct physical files. Harness overrides can make this intentional.                                                                                                                      |
| Unknown harness fields    | Unrecognized top-level fields in a harness profile, or unknown top-level sections in the Codex sidecar.                                                                                                                   |
| OpenCode tool declaration | `allowed-tools` is present, but OpenCode does not list it among recognized skill fields.                                                                                                                                  |

Warnings with a source print its URL alongside the finding. See
[compatibility boundaries](#harness-profiles-and-compatibility-boundaries) for
profile-specific details and [operational limits](#operational-limits) for the
validator's resource limits. These checks do not assess instruction quality or
prove that a skill works inside an agent.

The action ships as one bundled JavaScript file, including its YAML parser, so
validation needs no package installation or agent setup.

## Use in GitHub Actions

```yaml
name: Skills
on: [push, pull_request]
permissions:
  contents: read
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: Melbourneandrew/skills-lint@v1
```

No token or additional permissions are needed. Pin the action to the full commit
SHA from a release for immutable builds. `v1` tracks compatible releases.

For shared portable skills, select the standard explicitly:

```yaml
- uses: Melbourneandrew/skills-lint@v1
  with:
    paths: |
      .agents/skills
      packages/frontend/.agents/skills
    profile: spec
    fail-on-warnings: "true"
```

OpenClaw's workspace `skills/` directory is ambiguous with generic skill
collections, so explicitly choose its profile:

```yaml
- uses: Melbourneandrew/skills-lint@v1
  with:
    paths: skills
    profile: openclaw
```

### Inputs

| Input              | Default   | Meaning                                                                                                      |
| ------------------ | --------- | ------------------------------------------------------------------------------------------------------------ |
| `paths`            | automatic | Newline-separated **literal** directories or `SKILL.md` files, relative to the workspace. No glob expansion. |
| `profile`          | `auto`    | `spec`, `claude`, `codex`, `gemini`, `opencode`, `openclaw`, `cursor`, or `auto`.                            |
| `allow-empty`      | `false`   | Permit zero discovered skills. Missing explicit paths and other discovery errors still fail.                 |
| `fail-on-warnings` | `false`   | Fail on advisory findings as well as errors.                                                                 |

Boolean inputs accept `true` or `false`. Unknown profiles and malformed inputs
fail the action.

### Outputs

| Output           | Meaning                                                    |
| ---------------- | ---------------------------------------------------------- |
| `skills-checked` | Distinct physical `SKILL.md` files checked                 |
| `errors`         | Schema, YAML, or discovery errors                          |
| `warnings`       | Advisory findings                                          |
| `duration-ms`    | Validation time; excludes Node startup and action download |

### Discovery

Automatic discovery checks these roots **at the workspace top level**:

```text
.agents/skills    .claude/skills    .codex/skills    .gemini/skills
.opencode/skills  .openclaw/skills  .cursor/skills   skills
```

Traversal within a root is recursive, including grouped collections. Nested
monorepo roots and plugin directories can be passed in `paths`. This explicit
boundary avoids walking an entire repository merely to find skill roots.

In `auto`, the closest recognized harness directory selects its profile.
`.agents/skills`, plain `skills`, and custom paths use `spec`. `.codex/skills` is
included for existing repositories; the current Codex documentation recommends
`.agents/skills`. User home directories are never scanned automatically.

Symlinks within the workspace are followed. Physical files are counted once;
aliases with different harness profiles are checked against each profile. Cycles,
broken symlinks, and paths resolving outside the workspace fail. Discovery skips
`.git`, `node_modules`, `.venv`, `vendor`, `dist`, `build`, and `coverage` below a
selected root. Use `paths` to select a normally excluded directory explicitly.
Only exact `SKILL.md` casing is accepted.

## What gets checked

### Portable core

The [Agent Skills specification](https://agentskills.io/specification) is the
baseline: required string fields, name syntax and directory equality, 64-character
names, 1–1024-character descriptions, 1–500-character compatibility declarations,
optional license/tool strings, and metadata string maps. Unknown top-level fields
fail in `spec` mode. Unicode names are NFKC-normalized for matching; OpenCode adds
its documented ASCII restriction. Lengths count Unicode code points.

YAML is parsed with the bundled [`yaml`](https://eemeli.org/yaml/) library, with
unique mapping keys and bounded alias expansion. Block scalars, multiline text,
quotes, flow collections, anchors, BOM, and CRLF are supported. Parse errors,
unresolved tags/aliases, non-string field keys, and parser warnings fail clearly.
Scalar types are retained: quote numeric metadata values when strings are needed.

The token-length advisory warns above 5,000 estimated tokens, using the whole
`SKILL.md` (including frontmatter, whitespace, and code): Unicode character count
divided by four, rounded up. This uses [OpenAI’s rough English-text estimate](https://help.openai.com/en/articles/4936856-understanding-and-counting-tokens),
not a tokenizer. Actual counts vary by model, language, and content. The
[standard’s instruction budget](https://agentskills.io/specification#progressive-disclosure)
is guidance; both length warnings recommend splitting details into linked files
in the skill directory. A schema check does not grade instruction quality.

### Harness profiles and compatibility boundaries

Every profile validates the portable core, then its supported extensions. These
are authoring checks, **not exact emulations of permissive agent loaders**.
Unknown top-level fields in harness profiles warn; `fail-on-warnings` makes those
findings fatal. Arbitrary extra metadata is permitted for Claude and OpenClaw.

| Profile    | Additional checks                                                                                                                       | Deliberate boundary                                                                                                                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `claude`   | Invocation booleans, argument/tool/path strings or lists, model/agent hints, effort choices, fork context, shell choices, hooks mapping | Requires portable name/description and directory equality even though Claude can infer or override them. Requires real YAML booleans. Hook internals and tool permissions are not simulated.          |
| `codex`    | Portable core; optional `agents/openai.yaml` fields, policy boolean, and dependency tool declarations                                   | Sidecar is checked wherever present, including shared roots. No connector availability, icon-file existence, or runtime tool authorization checks.                                                    |
| `gemini`   | Portable core, including multiline descriptions                                                                                         | No activation, consent, extension manifest, or precedence simulation.                                                                                                                                 |
| `opencode` | ASCII names; warns that `allowed-tools` is not a documented recognized field                                                            | Does not parse `opencode.json` permissions.                                                                                                                                                           |
| `openclaw` | Invocation flags, tool dispatch, nested `metadata.openclaw` gating, OS lists, requirement arrays, installer kinds/required arguments    | Accepts YAML mapping metadata, including JSON-style flow mappings. Quoted JSON5 metadata strings and loader fallback parsing are not supported. Does not install tools or evaluate environment gates. |
| `cursor`   | Invocation boolean, paths, icon string, badge color choices                                                                             | No glob matching or Custom Mode execution.                                                                                                                                                            |

The Codex sidecar's known field types are checked; unknown top-level sections
warn. Nested future extension fields are retained without validation. OpenClaw
installer validation checks structure, not URLs, packages, archives, or binaries.
License and tool declarations are checked as strings, not as SPDX or tool grammars.

### Operational limits

Validation reads files only; it never runs skill scripts, shell snippets, hooks,
or body instructions. It makes no network requests. Reads are capped at 1 MiB per
file, frontmatter at 64 KiB, traversal at 64 directory levels and 100,000 visited
candidates, and YAML alias expansion at the parser's limit of 50. Limits are
validator policy, not Agent Skills requirements. Run against a stable checkout;
concurrent filesystem mutation is outside the supported model.

The action prints at most 100 annotations; output counts include all findings.
The CLI JSON report includes all diagnostics and structured `referenceUrl` fields
where a rule has a source. Text and GitHub annotations print the same link.
Annotation messages and properties are escaped so input text cannot create extra
workflow commands. This tool is a
linter for structure and content guidance. It does not assess whether instructions
are safe to execute.

## Local CLI and library

Install with Node.js 24 or newer:

```sh
npm install --save-dev @melbourneandrew/skills-lint
npx skills-lint .agents/skills --profile spec
npx skills-lint skills --profile openclaw --format json
npx skills-lint --workspace /path/to/repository --fail-on-warnings
```

The npm package has no runtime dependencies or installation scripts; its YAML
parser is bundled. You can also clone the repository and run `node dist/cli.cjs`.

CLI formats: `text`, `json`, `github`. Exit codes: `0` pass, `1` validation failure,
`2` invalid CLI invocation. Paths containing spaces are ordinary quoted arguments.

```js
const { validate } = require("@melbourneandrew/skills-lint");
const result = validate({
  workspace: process.cwd(),
  paths: [".agents/skills"],
  profile: "spec",
});
console.log(result.ok, result.diagnostics);
```

The library supports both CommonJS and ESM imports and includes TypeScript types.

### Pre-commit hooks

After installing the package, add a script to your project's `package.json`:

```json
{
  "scripts": {
    "lint:skills": "skills-lint --fail-on-warnings"
  }
}
```

Run `npm run lint:skills` from your existing Git or Husky pre-commit hook.
For the Python [pre-commit framework](https://pre-commit.com/), use a local hook:

```yaml
repos:
  - repo: local
    hooks:
      - id: skills-lint
        name: Lint agent skills
        entry: npm run lint:skills
        language: system
        pass_filenames: false
        always_run: true
```

Install project dependencies before running the hook. It scans the whole skill
collection, so duplicate names and supporting-directory changes are checked too.
It reads the working tree; partially staged edits may differ from the commit.
CI validates the committed checkout.

## Research, references, and precedents

Reviewed **2026-10-17**. Upstream documentation changes; these references explain
the decisions and the limits of the compatibility claims.

| Primary reference or precedent                                                                                                                                                                                                                                                                                    | What was examined and how it informed this action                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Agent Skills specification](https://agentskills.io/specification)                                                                                                                                                                                                                                                | Portable format and naming rules; mandatory constraints are errors, while authoring recommendations are advisories.                                                                                                                                     |
| [skills-ref validator, pinned source](https://github.com/agentskills/agentskills/blob/69ef37e9424c0a7ea9dd2293b559e43ec8176379/skills-ref/src/skills_ref/validator.py) and [parser](https://github.com/agentskills/agentskills/blob/69ef37e9424c0a7ea9dd2293b559e43ec8176379/skills-ref/src/skills_ref/parser.py) | Reference implementation's Unicode/NFKC naming behavior. It accepts lowercase filenames and uses StrictYAML's scalar model; this action requires exact casing and typed YAML. Source review, not a claim of identical behavior.                         |
| [Anthropic quick validator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/scripts/quick_validate.py)                                                                                                                                                                                        | Six-field allowlist precedent. Its angle-bracket restriction is not imposed as a universal standard rule. No source was copied.                                                                                                                         |
| [Claude Code skill reference](https://code.claude.com/docs/en/skills#frontmatter-reference)                                                                                                                                                                                                                       | Native extension fields, loader defaults, tool lists, and differences between Claude Code and portable skill uploads. Profile tests cover the supported field types and choices.                                                                        |
| [Codex / ChatGPT skill documentation](https://learn.chatgpt.com/docs/build-skills)                                                                                                                                                                                                                                | Shared `.agents/skills` discovery, symlink support, and the `agents/openai.yaml` example. Tests cover interface, policy, and dependency shapes.                                                                                                         |
| [Gemini overview](https://geminicli.com/docs/cli/skills/) and [authoring guide](https://geminicli.com/docs/cli/creating-skills/)                                                                                                                                                                                  | `.gemini`/`.agents` roots and multiline YAML descriptions. Its consent and precedence behavior are runtime concerns.                                                                                                                                    |
| [OpenCode skills](https://opencode.ai/docs/skills/)                                                                                                                                                                                                                                                               | Documented ASCII name regex, field recognition, paths, and string-map metadata.                                                                                                                                                                         |
| [OpenClaw skills](https://docs.openclaw.ai/tools/skills)                                                                                                                                                                                                                                                          | Workspace roots, native flags, YAML-first parsing, nested metadata, gating, and installer declarations. Schema tests cover the documented shapes supported here.                                                                                        |
| [Cursor skills](https://cursor.com/docs/skills)                                                                                                                                                                                                                                                                   | Recursive collections, shared roots, invocation control, path scoping, and badge metadata.                                                                                                                                                              |
| [Official TypeScript Action template](https://github.com/actions/typescript-action)                                                                                                                                                                                                                               | JavaScript action packaging and checked-in distribution precedent. This repository was built independently with a smaller toolchain and no Actions SDK.                                                                                                 |
| [GitHub action metadata](https://docs.github.com/en/actions/reference/workflows-and-actions/metadata-syntax)                                                                                                                                                                                                      | `node24`, inputs, outputs, and branding.                                                                                                                                                                                                                |
| [GitHub workflow commands](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands)                                                                                                                                                                                                  | Annotations and environment-file outputs; command escaping is regression-tested.                                                                                                                                                                        |
| [YAML parser documentation](https://eemeli.org/yaml/)                                                                                                                                                                                                                                                             | Strict parsing, source locations, duplicate-key detection, and alias limits. Bundled third-party license is in `dist/THIRD-PARTY-NOTICES.txt`.                                                                                                          |
| [thedaviddias/skill-check](https://github.com/thedaviddias/skill-check)                                                                                                                                                                                                                                           | Related action/CLI, broader linting, and optional security scanning. README reviewed; no comparative benchmark run.                                                                                                                                     |
| [agent-ecosystem/skill-validator](https://github.com/agent-ecosystem/skill-validator)                                                                                                                                                                                                                             | Related structural and quality checks. Scope precedent; no comparative benchmark run.                                                                                                                                                                   |
| Existing SF Platform validator (internal)                                                                                                                                                                                                                                                                         | Read-only review of a TypeScript/YAML/Markdown validator with composite setup. This action independently implements portable and harness schemas, ships a ready-to-run bundle, and does not export repository-specific Markdown policy or private code. |

No affiliation with or certification by the harness vendors is implied.

## License

MIT. The bundled YAML parser retains its own ISC notice in
[dist/THIRD-PARTY-NOTICES.txt](dist/THIRD-PARTY-NOTICES.txt).

See [CONTRIBUTING.md](CONTRIBUTING.md) for development, verification, and releases.

## Performance

The action loads one **131,588-byte bundle (129 KiB)**, including its YAML parser.
It requires no package installation at runtime. Source modules compile into
`dist/action.cjs`; TypeScript types are erased, and the separate CLI and library
bundles are not loaded by the action. Discovery is scoped to skill roots, with
physical-file contents cached within each validation run.

### Measured validation time

Measured on 2026-10-17 with an Apple M3 Max, macOS ARM64, and Node 26.5.0:

| Generated skills | Warm validation median | Fresh CLI process median |
| ---------------: | ---------------------: | -----------------------: |
|               10 |                6.89 ms |                100.72 ms |
|              100 |               58.80 ms |                158.40 ms |
|            1,000 |              623.23 ms |                757.29 ms |

The [benchmark](scripts/benchmark.mjs) generates small valid skills containing
frontmatter and a one-line instruction body. Warm validation measures the library
in an existing process: five runs after one discarded warmup. Fresh CLI timings
measure five new Node processes, including startup, validation, and JSON output.
Filesystem caches are warm in both cases.

These timings exclude runner provisioning, repository checkout, and action
download. Larger documents, sidecars, diagnostics, filesystem performance, and
host load affect results. The table is a reproducible example measurement;
comparative performance against other linters has not been measured. The action's
`duration-ms` output measures validation only.

### Reproduce

```sh
npm ci
npm run build
npm run bench
```

The command prints the hardware, Node version, bundle size, and timing medians.
[Linux CI](.github/workflows/ci.yml) also logs benchmarks on Node 24, which is the
action's runtime. Benchmarks are informational, with no timing threshold that
could fail on a busy runner.
