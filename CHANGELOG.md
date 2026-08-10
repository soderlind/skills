# Changelog

All notable changes to this skills repository are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The repository is not versioned as a whole; individual skills carry their own
version in their frontmatter, so entries below are grouped by date.

## [Unreleased]

### Added

- browser-native: Baseline status (`widely` / `newly` / `limited`) on replacement
  entries, surfaced alongside confidence in the table, markdown, and JSON output.
- browser-native: new replaceable packages — `timeago.js`, `pluralize`, `numeral`,
  `accounting`, `humanize-duration`, `lodash.groupby`,
  `lodash.union`/`intersection`/`difference`, and a UI Primitives cluster
  (`a11y-dialog`, `focus-trap`, `body-scroll-lock`, `tippy.js`).
- browser-native: three-question decision framework and progressive-enhancement
  guidance in SKILL.md, plus a "keep for now" Temporal note explaining why
  `dayjs`/`date-fns` are not flagged.

### Changed

- browser-native: skill version bumped to 1.2.0.

## [2026-08-08]

### Added

- CI: discovery index is built and committed by CI as the source of truth.

### Changed

- prepare-wordpress: installs agent skills from WordPress/agent-skills; default
  install trimmed to essentials with block/performance/router skills optional
  (plugin 1.2.0).
- prepare-wordpress: Brain Monkey PHP tests, `phpcs.xml`, and ESLint scaffolding;
  Composer/npm hardening (plugin 1.1.0).
- CI: bumped checkout/setup-node to v7 (Node 24), clearing the Node 20 deprecation.

### Fixed

- CI: gzip non-reproducibility in the discovery index build.

## [2026-08-07]

### Added

- wordpress-skills Agent Plugin with a mirror workflow, bundled CHANGELOG, and
  README describing the bundled skills.

## [2026-08-03]

### Added

- Published the agent-skills discovery index with an inline determinism checklist.

### Changed

- README: grouped Available Skills by category, reworked tables, and rewrote the
  install and introduction sections.

### Fixed

- Portable script paths and consistent skill frontmatter.

## [2026-08-02]

### Added

- wp-mutate: WordPress mutation-testing skill.

## [2026-07-27]

### Added

- document-architecture and pre-launch-security-audit skills.

## [2026-07-16]

### Added

- Cross-link to the just-bash-runner skill.

## [2026-07-15]

### Added

- wp-pcp-local: Plugin Check skill for Local by Flywheel.

### Fixed

- wp-pcp-local: multisite handling and argument parsing.

## [2026-06-30]

### Fixed

- wp-bump: detect tests from `package.json` and `composer.json` scripts.

## [2026-06-26]

### Added

- add-apim-api skill with Bicep patterns reference.
- `skills.sh.json` for repo page customization and a skills.sh README badge.
- Version 1.1.0 frontmatter across all skills.

### Security

- Fixed a prompt-injection vulnerability in prepare-wordpress.
- Removed the third-party `jeffallan/claude-skills` skill to reduce risk.

## [2026-06-20]

### Added

- browser-native skill set.

### Changed

- Hardened skill scripts, improved planner detection, and tightened invocation
  semantics with determinism guardrails.

## [2026-05-10]

### Added

- Initial skills repository with skills.sh page links and CLI discoverability.
