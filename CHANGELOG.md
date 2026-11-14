# Changelog

All notable changes to this skills repository are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The repository is not versioned as a whole; individual skills carry their own
version in their frontmatter, so entries below are grouped by date.

## [Unreleased]

### Changed

- illustrate-design: palettes can colour each diagram role. `--palette github` applies the
  GitHub Light/Dark Default syntax colours (purple titles, blue subtitles and edges, red lane
  labels, orange icons). Palette files can set `title`, `subtitle`, `label`, `laneLabel`,
  `badge` and `icon`, which recolour only elements with that role, and can `extends` a preset.
  The contrast check now tests each role, including badge text on faded participant cards,
  which the 1.1.0 check missed (skill 1.2.0).
- illustrate-design: contrast is measured, not judged by eye. The new
  `scripts/check-contrast.mjs` checks WCAG 2.2 ratios in both themes, including text on
  faded cards; failures block completion. `render.mjs --palette` applies palette overrides,
  only with the user's approval. Architecture documents such as `document-architecture`
  output are now accepted evidence, with claims checked against the code. Added notes on
  renderer limits: notes are not drawn, node selections drop outside edges, and long
  subtitles are cut off (skill 1.1.0).

### Added

- acceptance-test: new skill that learns an app from its code and docs,
  runs a `grilling` interview to agree on acceptance criteria (recorded in
  `tests/acceptance/CRITERIA.md` with stable `AC-xx` IDs), then writes and runs
  Playwright tests that trace to each criterion. Failures are triaged as test,
  environment, or app bugs; app bugs are reported, never hidden by weakening
  assertions (skill 1.0.0).
- bump: new language-agnostic release-bump skill — the generic counterpart to
  `wp-bump`. Detects the version files already present in a repo (`package.json`,
  `Cargo.toml`, `pyproject.toml`, `composer.json`, `*.csproj`, `pom.xml`,
  `build.gradle`, `*.gemspec`, `pubspec.yaml`, `mix.exs`, plain `VERSION` files),
  syncs them to the target version, drafts a changelog entry from `git log` since
  the last tag, and runs the project's own build and test gates. Prefers each
  ecosystem's own tool when a lockfile is present and never touches dependency
  versions or creates commits/tags unless asked (skill 1.0.0).
- illustrate-design: evidence-backed PR Lens architecture, sequence, and decision
  dependency diagrams from design documents, code, or interviews, with light/dark
  SVGs, local PNG companions, and a validated rendering helper (skill 1.0.0).

## [2026-09-02]

### Changed

- prepare-wordpress renamed to wp-prepare (breaking): the `/prepare-wordpress`
  command and `--skill prepare-wordpress` no longer resolve; use `wp-prepare`
  (skill 2.0.0, wordpress-skills plugin 2.0.0). The skill now lists `wp-bump`,
  `wp-mutate`, `wp-org-review`, and `wp-ability-auth` as companion skills.

## [2026-09-01]

### Added

- wp-ability-auth: new skill to audit or implement two-tier authorization for WordPress
  abilities (`wp_register_ability`) and REST routes — a coarse capability gate in
  `permission_callback` plus a per-object meta-capability check inside the execute
  callback, catching IDOR gaps, inconsistent `WP_Error` 403 contracts, and scattered
  capability logic (wordpress-skills plugin 1.5.0).

## [2026-08-28]

### Added

- wp-org-review: new skill to prepare a WordPress plugin for the WordPress.org
  Plugin Directory review — audits suppressed sniffs, arbitrary-path writes,
  output escaping, readme contributors, and bundled translations that Plugin
  Check/PHPCS miss (wordpress-skills plugin 1.4.0).
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

- wp-org-review: skill version bumped to 1.2.0.
- browser-native: skill version bumped to 1.2.0.

### Fixed

- wp-org-review: audit/detection commands now scan all PHP from the project root
  (`--include='*.php'`, excluding `vendor`/`node_modules`/`.git`/`tests`/`dist`/`build`)
  instead of hard-coding `src/ includes/`, so code under `admin/`, `public/`, `app/`,
  etc. is covered and absent directories no longer emit errors.
- wp-cli-local / wp-pcp-local: expand `~/Local Sites/...` paths from Local's
  `sites.json` before matching CWD or invoking WP-CLI (both skills 1.1.1;
  wordpress-skills plugin 1.4.1). Default macOS installs store site directories
  with a leading tilde, which previously broke auto-detect and produced a
  non-existent `~/...` filesystem path.

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
