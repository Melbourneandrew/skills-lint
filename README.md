# Skills Lint

[![CI](https://github.com/Melbourneandrew/skills-lint/actions/workflows/ci.yml/badge.svg)](https://github.com/Melbourneandrew/skills-lint/actions/workflows/ci.yml)

Skills Lint validates agent skill metadata and checks content against authoring
best practices. Run it locally or in pull requests to catch problems before
other people use your skills.

It checks the [Agent Skills specification](https://agentskills.io/specification)
and supports [Claude Code](https://code.claude.com/docs/en/skills#frontmatter-reference),
[Codex](https://learn.chatgpt.com/docs/build-skills),
[Gemini CLI](https://geminicli.com/docs/cli/creating-skills/),
[OpenCode](https://opencode.ai/docs/skills/),
[OpenClaw](https://docs.openclaw.ai/tools/skills),
[Cursor](https://cursor.com/docs/skills), and
[Pi](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/skills.md).

Install and run with Node.js 24 or newer:

```sh
npm install --save-dev @melbourneandrew/skills-lint
npx skills-lint
```

Or save this as `.github/workflows/lint-skills.yml`:

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

See [inputs and outputs](docs/usage/README.md#inputs),
[skill discovery](docs/usage/README.md#discovery), and
[CLI, library, and pre-commit usage](docs/usage/README.md#local-cli-and-library).

## Errors and warnings

Errors fail the check for problems that can prevent an agent from loading or
using a skill. Warnings suggest improvements to skill content and organization.

### Errors

| Check                     | What fails                                                                                                                                                                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| YAML and frontmatter      | Missing `---` delimiters, malformed YAML, duplicate keys, unresolved tags or aliases, a non-mapping root, or non-string mapping keys.                                                                                              |
| Required fields and types | Missing `name` or `description`; invalid types, lengths, or values in portable fields or supported harness extensions.                                                                                                             |
| Skill name                | Invalid name syntax or a name that does not match its parent directory. OpenCode and Pi additionally require ASCII names.                                                                                                          |
| Unknown portable fields   | Unrecognized top-level fields when using `profile: spec`.                                                                                                                                                                          |
| Codex sidecar             | Invalid types or values in supported `agents/openai.yaml` fields, wherever that file is present.                                                                                                                                   |
| Discovery and limits      | Missing explicit paths, unreadable files, incorrect `SKILL.md` casing, paths outside the workspace, symlink cycles, invalid UTF-8, or exceeded file, traversal, or YAML limits. Zero skills fails unless `allow-empty` is enabled. |

Invalid action inputs or CLI options also fail before validation.

### Warnings

| Check                     | What is reported                                                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty instructions        | No Markdown instructions after the frontmatter.                                                                                                                                                                           |
| Skill length              | 500 or more lines in `SKILL.md`. The [standard recommends keeping it under 500](https://agentskills.io/specification#progressive-disclosure).                                                                             |
| Estimated tokens          | Over 5,000 estimated tokens in `SKILL.md`, including frontmatter (four Unicode characters per token). A rough English-text heuristic, not an exact count.                                                                 |
| Unmentioned references    | A nonempty, direct `references/` directory whose name never appears in the skill body. This is a heuristic based on [loading supporting material on demand](https://agentskills.io/specification#progressive-disclosure). |
| Duplicate name            | The same skill name appears in distinct physical files. Harness overrides can make this intentional.                                                                                                                      |
| Unknown harness fields    | Unrecognized top-level fields in a harness profile, or unknown top-level sections in the Codex sidecar.                                                                                                                   |
| OpenCode tool declaration | `allowed-tools` is present, but OpenCode does not list it among recognized skill fields.                                                                                                                                  |

Warnings with a source print its URL alongside the finding. See
[compatibility boundaries](docs/usage/README.md#harness-profiles-and-compatibility-boundaries) for
profile-specific details and [reference documentation](docs/usage/README.md#operational-limits) for the
validator's resource limits. These checks do not assess instruction quality or
prove that a skill works inside an agent.

The action ships as one bundled JavaScript file, including its YAML parser, so
validation needs no package installation or agent setup.

See [research and compatibility references](docs/research/README.md) for the sources
behind these checks, and [CONTRIBUTING.md](CONTRIBUTING.md) for development.

## Performance

The action ships as one **129 KiB JavaScript bundle** with no runtime install.
The benchmark uses synthetic skill files: small test fixtures with valid metadata
and a one-line instruction, created by a script rather than collected from real projects.

Measured on 2026-10-18, Apple M3 Max, macOS ARM64, Node 26.5.0:

| Skill files | Validation in an existing process | Full CLI run, including startup |
| ----------: | --------------------------------: | ------------------------------: |
|          10 |                           7.74 ms |                        87.60 ms |
|         100 |                          49.70 ms |                       142.96 ms |
|       1,000 |                         415.10 ms |                       553.61 ms |

For context, an empty Node process took **49.12 ms**; starting Node and loading
this library took **56.35 ms**, before any validation. Process startup therefore
accounts for a substantial part of small CLI runs. These are separate medians,
not an exact breakdown of the CLI time.

Five-run medians with warm filesystem caches; validation has one discarded warmup.
Results depend on document size, disk, and host load, and exclude checkout,
action download, and runner setup. See the [benchmark script](scripts/benchmark.mjs).

## License

MIT. The bundled YAML parser retains its ISC notice in
[dist/THIRD-PARTY-NOTICES.txt](dist/THIRD-PARTY-NOTICES.txt).
