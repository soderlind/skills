---
name: bump
description: "Structured, language-agnostic release-bump workflow that detects version files across ecosystems, syncs them, updates the changelog from commit history, and runs the project's own build and test gates."
compatibility: "Any git repository. Detects Node (package.json), Rust (Cargo.toml), Python (pyproject.toml/setup.py/__version__), PHP (composer.json), .NET (*.csproj/*.props), Java (pom.xml/build.gradle), Ruby (*.gemspec/version.rb), Dart (pubspec.yaml), Elixir (mix.exs), Go, and plain VERSION files."
version: "1.0.0"
---

# Bump

## When to use

Use this skill when:

- Performing a release bump with coordinated version updates across every version file that already exists in the repository.
- Generating release notes from commit history and writing them to the project's changelog.
- Running the project's existing build and validation commands as a release gate.

This is the language-agnostic counterpart to `wp-bump`. For WordPress plugin releases (main-file header, `readme.txt` stable tag), prefer `wp-bump`.

## Inputs required

- Repo root (current working directory).
- Target version, preferably SemVer (`1.2.3`). If missing, ask the user.
- Changelog entry: auto-derived from `git log` since the last tag; prompt only if no useful commits are found.
- Release date. Default to today's date.

## Determinism checklist

Before declaring this skill run complete:

1. Scope fixed: inputs and target files are explicit.
2. Read-first: inspect current state before edits.
3. Plan-first: preview actions before writes when tooling supports it.
4. Confirm-before-write: get user confirmation before destructive or broad writes.
5. One step, one done-test: each step has a checkable completion criterion.
6. Verify outcomes: run the smallest available validation commands.
7. Report skips: list what was skipped and why.
8. Stop on blockers: capture exact failing command and error summary.

Do not create commits, tags, or releases unless the user explicitly asks.

## Procedure

### 0) Inspect project state

Before editing, check for existing user changes:

```sh
git status --short
```

#### Detect version files

Scan the repo for the version sources that actually exist. Only touch files that are present. Common manifests and the field each carries:

| Ecosystem | File(s) | Version location |
| --- | --- | --- |
| Node | `package.json` | `"version"` (and `package-lock.json` / `npm-shrinkwrap.json`) |
| Rust | `Cargo.toml` | `[package] version` (and `Cargo.lock` for the package's own entry) |
| Python | `pyproject.toml` | `[project] version` or `[tool.poetry] version` |
| Python | `setup.py` / `setup.cfg` | `version=` |
| Python | `<pkg>/__init__.py` | `__version__ = "..."` |
| PHP | `composer.json` | `"version"` (often absent by design — do not add it) |
| .NET | `*.csproj`, `Directory.Build.props` | `<Version>` / `<VersionPrefix>` |
| Java | `pom.xml` | `<version>` (project, not dependencies) |
| Java | `build.gradle(.kts)` | `version = "..."` |
| Ruby | `*.gemspec`, `lib/**/version.rb` | `VERSION = "..."` |
| Dart/Flutter | `pubspec.yaml` | `version:` |
| Elixir | `mix.exs` | `version:` |
| Generic | `VERSION` / `version.txt` | whole-file version string |
| Any | `CHANGELOG.md` | changelog heading (step 3) |

Detect them without guessing paths:

```sh
git ls-files | grep -E '(^|/)(package\.json|Cargo\.toml|pyproject\.toml|setup\.(py|cfg)|composer\.json|pom\.xml|build\.gradle(\.kts)?|pubspec\.yaml|mix\.exs|VERSION|version\.txt)$|\.csproj$|\.gemspec$|version\.rb$'
```

Prefer a manifest at the repo root. If several manifests of the same ecosystem exist (monorepo/workspaces), ask the user which package(s) to bump before editing.

#### Gather commits since last release

Find the most recent tag and collect commit subjects since then:

```sh
git tag --sort=-creatordate | head -1          # latest tag, empty if none
git log <last-tag>..HEAD --oneline --no-merges # commits since last tag
```

If there is no tag yet, use `git log --oneline --no-merges` (all commits).

Store these subjects as candidate changelog lines. Filter out noise: subjects starting with `Merge`, `Revert`, `chore:`, `ci:`, `build:`, `style:`, or the bump commit itself. If any candidates remain, use them to draft the changelog entry (step 3). Only prompt the user for changelog content when no useful commits are found after filtering.

Completion criterion: The set of existing version files, current versions, candidate changelog commits, and available scripts are collected before any edits.

### 1) Validate the target version

Use a plain version string without a leading `v` in project files. If the user provides `v1.2.3`, write `1.2.3`. (Git tags may still use a `v` prefix if that is the project's convention — but only when the user asks you to tag.)

Confirm the target version is newer than the current version when both are valid SemVer values. If it is not newer, ask before continuing.

Completion criterion: Target version format and upgrade direction are validated, and any non-increasing bump is explicitly user-approved.

### 2) Bump version fields

Update every version field detected in step 0 to the target version. Prefer the ecosystem's own tool when it exists and a lockfile is present, so the lockfile stays consistent:

```sh
npm version <target> --no-git-tag-version   # Node, when package-lock.json exists
cargo set-version <target>                   # Rust, if cargo-edit is installed
poetry version <target>                      # Python/Poetry
uv version <target>                          # Python/uv
```

When no such tool is available, edit the manifest directly as structured text, changing only the project's own version field — never a dependency's version. For lockfiles, update only the entry for the package being released; do not regenerate the whole lockfile as part of a version bump.

Never create a manifest that does not exist (e.g. do not add `"version"` to a `composer.json` that omits it) solely for a bump.

Completion criterion: Every existing version field matches the target version, and no dependency versions were altered.

### 3) Update the changelog

#### Draft the entry

From the candidate commit subjects collected in step 0:

- Strip conventional-commit prefixes (`fix:`, `feat:`, `docs:`, etc.) and capitalise the first letter.
- One bullet per subject line.
- Group under Keep a Changelog headings (`Added`, `Changed`, `Fixed`, `Removed`) when the commit types make the grouping obvious; otherwise a flat bullet list is fine.
- Present the draft to the user for confirmation or editing before writing.
- If no candidates were found, prompt the user for concise release notes.

Hard gate: Do not write the changelog file until the draft entry is confirmed by the user.

#### CHANGELOG.md

If `CHANGELOG.md` exists, preserve its existing style. For a Keep a Changelog file, move items out of `## [Unreleased]` into a new dated section:

```md
## [<target>] - YYYY-MM-DD

### Added

- Release note.
```

If the project uses a different, simpler style, match it:

```md
## <target> - YYYY-MM-DD

- Release note.
```

If `CHANGELOG.md` does not exist, create it only if the user wants one:

```md
# Changelog

## <target> - YYYY-MM-DD

- Release note.
```

Update any comparison/link references at the bottom of a Keep a Changelog file if the project maintains them.

Completion criterion: The changelog contains one entry for the target version with a consistent version and date, in the project's existing style.

### 4) Rebuild

Run the project's build step only if one exists. Detect it from the manifest's scripts/targets rather than assuming:

```sh
npm run build --if-present      # Node
cargo build --release           # Rust
make build                      # if a Makefile defines a build target
```

For other ecosystems, run the documented build/package command only when it is already defined by the project. If dependencies are missing and a lockfile exists, install them with the matching package manager before rebuilding. Do not add new dependencies as part of a version bump unless the user explicitly asks.

Completion criterion: Existing build command(s) completed, or the exact skip reason was reported.

### 5) Run tests and checks

Run only the tests and checks the project already defines. Detect available scripts/targets first:

- `package.json` → `scripts` object (`test`, `lint`, `typecheck`, `check`, ...).
- `composer.json` → `scripts` object (`test`, `phpunit`, `phpcs`, `stan`, ...).
- `Cargo.toml` project → `cargo test`, `cargo clippy`, `cargo fmt --check`.
- `pyproject.toml` → `pytest`, `ruff`/`flake8`, `mypy` when configured.
- `Makefile` / `justfile` → `test`, `lint`, `check` targets.

Execution order:

1. Validate the manifest where a cheap validator exists (`composer validate --no-check-publish`, `cargo verify-project`, `npm pkg fix --dry-run`).
2. Run each defined test script, then each lint/typecheck/analysis script.

Do not assume scripts exist. If a project defines no test scripts, report that no tests were found and continue. Report any command that could not run because a tool, dependency, or environment was missing.

Completion criterion: Every available check command was run, with pass/fail/skip status captured.

### 6) Final review

Review the diff before responding:

```sh
git diff --stat
git diff --check
```

In the final response, include:

- Files changed.
- Version bumped from/to, per manifest, when known.
- Changelog entry added.
- Rebuild command result.
- Test/check command results.
- Any skipped files or commands and why.

Completion criterion: Diff review completed and the final report includes all required release details.

## Failure modes / debugging

- No version file found: ask the user where the version lives, or bump only `CHANGELOG.md` and a `VERSION` file if that is the project's convention.
- Multiple manifests (monorepo): ask which package(s) to bump; do not bump all silently.
- Version mismatch after edits: re-open each detected manifest; all existing version fields must match the target.
- `npm version` / `cargo set-version` fails: inspect the manifest for invalid syntax or workspace constraints; fall back to a direct structured edit.
- Lockfile drift: update only the released package's own entry; if the tool regenerated unrelated entries, revert those before finishing.
- Build/test fails: stop after collecting the failure output and report the failing command with the relevant error summary.
