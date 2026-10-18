# Usage reference

[Back to Skills Lint](../../README.md)

## Use in GitHub Actions

```yaml
name: Lint agent skills
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
| `profile`          | `auto`    | `spec`, `claude`, `codex`, `gemini`, `opencode`, `openclaw`, `cursor`, `pi`, or `auto`.                      |
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
.opencode/skills  .openclaw/skills  .cursor/skills   .pi/skills  skills
```

Traversal within a root is recursive, including grouped collections. Nested
monorepo roots and plugin directories can be passed in `paths`. This explicit
boundary avoids walking an entire repository merely to find skill roots.

In `auto`, the closest recognized harness directory selects its profile.
`.agents/skills`, plain `skills`, and custom paths use `spec`; select `profile: pi` for Pi extensions in shared roots. `.pi/skills` selects Pi automatically. `.codex/skills` is
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
fail in `spec` mode. Unicode names are NFKC-normalized for matching; OpenCode and Pi add
their documented ASCII restriction. Lengths count Unicode code points.

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

| Profile    | Additional checks                                                                                                                       | Deliberate boundary                                                                                                                                                                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `claude`   | Invocation booleans, argument/tool/path strings or lists, model/agent hints, effort choices, fork context, shell choices, hooks mapping | Requires portable name/description and directory equality even though Claude can infer or override them. Requires real YAML booleans. Hook internals and tool permissions are not simulated.                        |
| `codex`    | Portable core; optional `agents/openai.yaml` fields, policy boolean, and dependency tool declarations                                   | Sidecar is checked wherever present, including shared roots. No connector availability, icon-file existence, or runtime tool authorization checks.                                                                  |
| `gemini`   | Portable core, including multiline descriptions                                                                                         | No activation, consent, extension manifest, or precedence simulation.                                                                                                                                               |
| `opencode` | ASCII names; warns that `allowed-tools` is not a documented recognized field                                                            | Does not parse `opencode.json` permissions.                                                                                                                                                                         |
| `openclaw` | Invocation flags, tool dispatch, nested `metadata.openclaw` gating, OS lists, requirement arrays, installer kinds/required arguments    | Accepts YAML mapping metadata, including JSON-style flow mappings. Quoted JSON5 metadata strings and loader fallback parsing are not supported. Does not install tools or evaluate environment gates.               |
| `cursor`   | Invocation boolean, paths, icon string, badge color choices                                                                             | No glob matching or Custom Mode execution.                                                                                                                                                                          |
| `pi`       | ASCII names and `disable-model-invocation` boolean.                                                                                     | Checks portable directory/name equality even though Pi permits mismatches. Only `SKILL.md` directory skills; no standalone Markdown, settings/package discovery, ancestor traversal, or runtime loading simulation. |

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
