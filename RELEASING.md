# Automated releases

Matrix QA frontend releases are managed by Release Please. Contributors do not edit version numbers, tags, or `CHANGELOG.md` by hand.

Use Conventional Commits for every change:

- `fix: ...` creates a patch release.
- `feat: ...` creates a minor release.
- `feat!: ...`, another typed scope followed by `!`, or a `BREAKING CHANGE:` footer creates a major release.
- `docs:`, `test:`, `chore:`, `ci:`, `build:`, `refactor:`, and `perf:` are categorized in the generated release notes according to the Release Please configuration; they do not create a release unless the configured release strategy considers them releasable.

After a releasable commit reaches `main`, the `Release Please` workflow opens or updates a release pull request containing the calculated version, changelog, and release notes. Reviewers merge that release pull request when it is ready. Merging it creates the corresponding GitHub release and tag. The release pull request is the review step; no one should manually choose the next version.

The first configured baseline is `0.1.0`. The bootstrap marker prevents old pre-release history from being included in the first generated changelog. After the first Release Please pull request is merged, Release Please tracks the manifest and previous release tag automatically.

Do not place secrets, tokens, passwords, cookies, or private customer data in commit messages because commit subjects and release notes are published to the repository’s GitHub release history.
