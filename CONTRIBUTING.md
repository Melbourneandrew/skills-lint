# Contributing

## Development and releases

```sh
npm ci
npm run check
npm run bench
```

Source layout:

```text
src/
  schemas/       Small declarative schemas and reusable type checks
  rules/         One file per content/corpus advisory, with optional source URL
  rules/index.ts Built-in advisory registry and diagnostic conversion
  discovery.ts   Scoped filesystem traversal and alias handling
  files.ts       Bounded reads and path containment
  yaml.ts        Parsing and source locations
  schema.ts      Profile selection and cross-field validation
  corpus.ts      File caching, sidecars, and rule orchestration
  validate.ts    Public validation API and result aggregation
  action.ts      Thin GitHub Actions adapter
  cli.ts         Thin command-line adapter
  report.ts      Text and workflow-command formatting
```

[AGENTS.md](AGENTS.md) requires diligent code splitting. ESLint enforces a maximum
cyclomatic complexity of **10**, maximum nesting depth **4**, and **500 lines per
source/test/script file**, including comments and blank lines. Generated bundles
are exempt. Strict TypeScript includes unchecked indexed access and exact
optional properties. CI verifies that rebuilding produces the committed bundles.

To add a content advisory, add a small `LintRule` module in `src/rules/`,
register it in `src/rules/index.ts`, and test both findings and non-findings. A rule
may set `referenceUrl`; the CLI and action print it with its warning. The action
does not load executable rule code from the repository it scans. Rules receive
parsed skill context and per-run state; duplicate-name checking uses that state.
Schema constraints remain in `src/schemas/`. Source splitting adds no runtime
module loading: the build bundles all rules into the single action script.

See [RELEASING.md](RELEASING.md). The repository includes a license, action
metadata, branding, and release instructions for
[Marketplace publication](https://docs.github.com/en/actions/how-tos/create-and-publish-actions/publish-in-github-marketplace).
A tagged public action can be imported immediately; a Marketplace listing is a
separate GitHub publication step requiring the owner's acceptance of its terms.

## Verification

`npm run check` runs strict TypeScript, type-aware ESLint, formatting, a fresh
bundle build, and Node's test runner. Tests cover:

- Portable constraints and boundary lengths, Unicode normalization, actual YAML
  types, duplicate keys, multiline/flow syntax, aliases, and malformed input.
- Positive and negative cases for harness extensions and the Codex sidecar.
- Recursive discovery, aliases, cycles, external paths, missing paths, filename
  casing, invalid UTF-8, size limits, duplicates, and empty-result policy.
- CLI exit codes and formats; action inputs, outputs, summaries, failure paths,
  annotation escaping, and running the bundle without `node_modules`.
- Lint findings and non-findings, optional source links in JSON, text, and GitHub
  annotations, and the warning gate.
- Actual rejection of excessive complexity and overlong source files by ESLint.

[CI](https://github.com/Melbourneandrew/skills-lint/actions/workflows/ci.yml)
runs on every PR and push to main on Linux, macOS, and Windows with Node 24.
Main requires a PR and all six quality/action checks to pass, including for admins.
Each quality job also packs and installs the npm tarball in an isolated directory,
tests the CLI and library imports, and compiles a typed consumer. Separate action jobs invoke the
committed bundle **without installing dependencies**, assert a valid fixture
passes, and assert an invalid fixture fails with the expected outputs. A
[release smoke workflow](.github/workflows/release-smoke.yml) imports the published
`@v1` action on all three platforms.

The original repository-local corpus was also checked read-only: 72 skills,
zero schema errors, and one skill-length advisory as of 2026-10-17. No private skill contents are
included here. Tests verify documented schema behavior; they do not launch the
six agents or claim exhaustive compatibility with every agent version.
