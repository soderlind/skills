---
name: wp-bump
description: "Use when: bumping or releasing a WordPress plugin version, updating the main plugin file, readme.txt, package.json, CHANGELOG.md, rebuilding assets, and running tests. Trigger phrases: wp-bump, bump plugin version, release WordPress plugin, update changelog."
compatibility: "WordPress plugin projects with PHP; optional package.json, Composer, npm, and build/test scripts."
---

# WP Bump

## When to use

Use this skill when:

- Bumping a WordPress plugin version for a release.
- Updating version metadata in the plugin file, `readme.txt`, and `package.json`.
- Updating release notes in `CHANGELOG.md` and the WordPress.org `readme.txt` changelog.
- Rebuilding generated assets and running the project's available tests.

## Inputs required

- Repo root (current working directory).
- Target version, preferably SemVer (`1.2.3`). If missing, ask the user.
- Changelog entry: auto-derived from `git log` since the last tag; prompt only if no useful commits are found.
- Release date. Default to today's date.

Do not create commits, tags, or releases unless the user explicitly asks.

## Procedure

### 0) Inspect project state

Before editing, check for existing user changes and project files:

```sh
git status --short
```

Detect the main plugin file by scanning root-level PHP files for a `Plugin Name:` header. If multiple files match, ask the user which one to update.

#### Gather commits since last release

Find the most recent tag and collect commit subjects since then:

```sh
git tag --sort=-creatordate | head -1          # latest tag, empty if none
git log <last-tag>..HEAD --oneline --no-merges # commits since last tag
```

If there is no tag yet, use `git log --oneline --no-merges` (all commits).

Store these subjects as candidate changelog lines. Filter out noise: commits whose subject starts with `Merge`, `Revert`, `chore:`, `ci:`, `build:`, `style:`, or is identical to the bump commit itself. If any candidate lines remain, use them to draft the changelog entry (see step 3). Only prompt the user for changelog content when no useful commits are found after filtering.

Inspect these files if they exist:

- Main plugin file (`Version:` header)
- `readme.txt` (`Stable tag:` and `== Changelog ==`)
- `package.json` (`version` field and available scripts)
- `package-lock.json` or `npm-shrinkwrap.json`
- `composer.json` (available scripts)
- `CHANGELOG.md`

### 1) Validate the target version

Use a plain version string without a leading `v` in project files. If the user provides `v1.2.3`, write `1.2.3`.

Confirm the target version is newer than the current plugin header version when both are valid SemVer values. If the target version is not newer, ask before continuing.

### 2) Bump version fields

Update all version fields that exist in the project:

- Main plugin file: update the header line matching `Version:`.
- `readme.txt`: update `Stable tag:` to the target version.
- `package.json`: update `version` if the file exists.

For `package.json`, prefer the package manager when lockfiles exist:

```sh
npm version <target-version> --no-git-tag-version
```

If there is no npm lockfile, it is acceptable to edit `package.json` directly as structured JSON. Do not create `package.json` only for a version bump.

### 3) Update changelogs

#### Draft the changelog entry

Use the candidate commit subjects collected in step 0 to draft bullet points:

- Strip conventional-commit prefixes (`fix:`, `feat:`, `docs:`, etc.) and capitalise the first letter.
- One bullet per subject line.
- Present the draft to the user for confirmation or editing before writing files.
- If no candidates were found, prompt the user for concise release notes.

Update both changelog locations.

#### CHANGELOG.md

If `CHANGELOG.md` exists, insert a new release section near the top, below the title and optional `Unreleased` section:

```md
## <target-version> - YYYY-MM-DD

- Release note.
```

If the project already follows a different changelog style, preserve that style. If `CHANGELOG.md` does not exist, create it with:

```md
# Changelog

## <target-version> - YYYY-MM-DD

- Release note.
```

#### readme.txt

In `readme.txt`, insert the release entry directly under `== Changelog ==`:

```txt
= <target-version> =
* Release note.
```

Preserve the existing WordPress.org readme format. If `readme.txt` does not exist, skip it and report that it was absent.

### 4) Rebuild

Run the project's build step if one exists.

For npm projects:

```sh
npm run build --if-present
```

If dependencies are missing and the project has a lockfile, install them with the matching package manager before rebuilding. Do not add new dependencies as part of a version bump unless the user explicitly asks.

For Composer-only projects, run the relevant generated/build script only if it exists in `composer.json`.

### 5) Run tests and checks

Run available tests. Use scripts already defined by the project; skip missing scripts cleanly.

Recommended order:

```sh
composer validate --no-check-publish
composer run test
composer run lint
npm test --if-present
npm run test:js --if-present
```

If the project has a plugin-check script, run it when the local WordPress/WP-CLI environment is available:

```sh
composer run check
```

Report any command that could not run because a tool, dependency, or local WordPress environment was missing.

### 6) Final review

Review the diff before responding:

```sh
git diff --stat
git diff --check
```

In the final response, include:

- Files changed.
- Version bumped from/to, when known.
- Changelog entry added.
- Rebuild command result.
- Test/check command results.
- Any skipped files or commands and why.

## Failure modes / debugging

- No plugin file found: ask for the main plugin file path.
- Multiple plugin files found: ask which plugin header should be bumped.
- Version mismatch after edits: re-open the plugin file, `readme.txt`, and `package.json`; all existing version fields must match the target version.
- `npm version` fails: inspect `package.json` for invalid JSON or workspace/package-manager constraints.
- Build/test fails: stop after collecting the failure output and report the failing command with the relevant error summary.