# Release process

1. Update the package version, lockfile, README compatibility notes, and changelog
   on a branch. Use an immutable version such as `v1.0.0`.
2. Run `npm ci`, `npm run check`, and `npm run bench`. Commit all `dist` outputs
   and their third-party notice. Rebuild and require `git diff --exit-code -- dist`.
3. Run `npm run test:package` to verify the exact npm tarball. Open a pull request. Inspect the diff and all six CI jobs: quality and action
   execution on Linux, macOS, and Windows. Merge only after they pass.
4. Wait for main CI to pass. Tag that exact verified commit with the immutable
   version, push the tag, and create a GitHub release with meaningful notes.
5. Create the `v1` major tag for the first release. For later compatible releases,
   deliberately move the existing major tag to the verified release commit. Never
   move an immutable version tag. Breaking behavior belongs in a new major.
6. Dispatch `release-smoke.yml` and require all three imported-action jobs to pass.
   It must use `Melbourneandrew/skills-lint@v1`, not a local checkout action.
7. Include the immutable commit SHA and verification run links in the release.

## Marketplace

Direct `uses: Melbourneandrew/skills-lint@v1` works with the public release
without a Marketplace listing. To list the action, follow GitHub's
[publishing instructions](https://docs.github.com/en/actions/how-tos/create-and-publish-actions/publish-in-github-marketplace).
The owner must accept the Marketplace terms and select the publication option
when editing/drafting the release. Confirm the action display name is available.
Do not claim Marketplace publication until the listing exists.

## npm publishing

The public package is `@melbourneandrew/skills-lint`; its binary is `skills-lint`.
The release workflow `.github/workflows/publish.yml` rebuilds, tests, verifies the
package and committed bundles, and publishes with provenance using
[npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).
It accepts only a matching immutable `vX.Y.Z` tag whose commit is on main.
The `npm` GitHub environment restricts deployments to version tags.

Initial setup requires the npm owner to publish the first verified version and
configure trust for GitHub owner `Melbourneandrew`, repository `skills-lint`,
workflow `publish.yml`, and environment `npm`, with direct publishing allowed.
Subsequent GitHub releases trigger publishing automatically. After publishing,
the workflow downloads the exact registry version, compares its bundles to the
verified checkout, and exercises the installed CLI and library. Run
`npm run test:published` to repeat these checks locally. For a retry, dispatch
`publish.yml` against the version tag. Retries skip an already published version
and verify its contents against the checkout. Registry visibility is polled for up
to five minutes because npm can acknowledge publication before downloads work. Published npm versions are immutable;
a code change requires a new version and release.
