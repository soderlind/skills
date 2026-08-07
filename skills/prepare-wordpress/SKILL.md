---
name: prepare-wordpress
description: "Phase-based WordPress project setup workflow with dry-run planning and confirmed apply for predictable scaffolding/standardization."
compatibility: "macOS/Linux with Node.js 18+, Composer 2+, PHP 8.3+, git. Optional: WP-CLI for i18n commands, curl for downloading coding instructions."
version: "1.4.0"
---

# Prepare WordPress Project

## When to use

Use this skill when:

- Bootstrapping a new WordPress plugin or theme repo with standard tooling.
- Backfilling missing tooling in an existing project after drift or partial setup.
- Running a selective, phase-based setup flow with dry-run then confirmed apply.

## Inputs required

- Repo root (current working directory).
- Whether this is a new or existing project (auto-detected).
- Plugin metadata (prompted during execution).

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

## Procedure

### 0) Detect existing project state

Run the detection script to discover what already exists:

```sh
node {{SKILL_DIR}}/scripts/detect_project.mjs
```

This outputs JSON with booleans for each component. Use it to skip phases that are already configured. Report to the user what will be added and what will be skipped.

Completion criterion: Detection JSON was produced and a phase-by-phase add/skip summary was shown to the user.

### 0b) Choose feature flags and execution mode

Before changing files, ask which phases to run. Defaults: all phases enabled, dry-run first.

Hard gate: Do not run any `--apply` command until dry-run output is shown and the user confirms the selected phases.

- `plugin` — create plugin bootstrap file
- `readme` — create `readme.txt`
- `init` — initialize repo/package/composer basics
- `skills` — install agent skills
- `composer` — install PHP dev deps and merge scripts
- `config` — create/merge `.editorconfig` and `.gitignore`
- `vitest` — install and scaffold Vitest (JavaScript test runner)
- `eslint` — install and configure ESLint for JavaScript
- `i18n` — scaffold i18n files/scripts
- `instructions` — download WordPress Copilot coding instructions
- `cleanup` — remove stray `yarn.lock`

Use the planner script to preview actions:

```sh
node {{SKILL_DIR}}/scripts/plan_setup.mjs --dry-run
```

Feature flags:

```sh
# Run only selected phases
node {{SKILL_DIR}}/scripts/plan_setup.mjs --dry-run --only=init,composer,config

# Skip selected phases
node {{SKILL_DIR}}/scripts/plan_setup.mjs --dry-run --skip=skills,vitest
```

Apply safe shell commands from the plan (manual file merges are still called out as notes):

```sh
node {{SKILL_DIR}}/scripts/plan_setup.mjs --apply --only=init,skills,composer
```

Machine-readable dry-run output for automation:

```sh
node {{SKILL_DIR}}/scripts/plan_setup.mjs --json --only=init,composer
```

Machine-readable apply output with command execution results:

```sh
node {{SKILL_DIR}}/scripts/plan_setup.mjs --json --apply --only=cleanup
```

Completion criterion: Selected phases and execution mode are explicit, dry-run output is shown, and user confirmation is captured before apply mode.

### 1) Gather plugin metadata

Derive the **plugin slug** from the current folder name (e.g. `~/Projects/my-plugin` → `my-plugin`). Use this as the default for the text domain.

Ask the user for the following (show defaults in parentheses):

- **Plugin Name**: Human-readable name (default: slug with hyphens replaced by spaces and title-cased, e.g. `My Plugin`)
- **Plugin URI**: URL for the plugin (default: empty)
- **Description**: Short description (default: empty)
- **Author**: Author name (default: empty)
- **Author URI**: Author URL (default: empty)
- **License**: License identifier (default: `GPL-2.0-or-later`)
- **Text Domain**: (default: folder name / plugin slug)
- **Requires at least**: Minimum WordPress version (default: `6.8`)
- **Tested up to**: Highest WordPress version tested (default: `7.0`)
- **Requires PHP**: Minimum PHP version (default: `8.3`)

Store these values — they are used in Phase 1b (`plugin.php`), Phase 1b-2 (`readme.txt`), Phase 3 (`composer.json`), and Phase 6 (i18n scripts).

Also ask:
- **Create readme.txt?**: Whether to create a WordPress.org-style `readme.txt` (default: yes)
- **Git remote URL**: URL for the remote repository (e.g. `https://github.com/user/my-plugin` or `git@github.com:user/my-plugin.git`). Leave empty to skip.

Completion criterion: Every metadata field is filled (or intentionally empty), including readme and remote decisions.

### 1b) Create plugin.php

**Skip if a PHP file with a `Plugin Name:` header already exists in the project root.**

Create `<plugin-slug>.php` (using the folder name) with the standard WordPress plugin header:

```php
<?php
/**
 * Plugin Name: {Plugin Name}
 * Plugin URI:  {Plugin URI}
 * Description: {Description}
 * Version:     0.1.0
 * Author:      {Author}
 * Author URI:  {Author URI}
 * License:     {License}
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: {Text Domain}
 * Domain Path: /languages
 * Requires at least: {Requires at least}
 * Tested up to:      {Tested up to}
 * Requires PHP: {Requires PHP}
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;
```

See: `references/plugin-bootstrap.md`

Completion criterion: Either an existing plugin header file was detected and preserved, or `<plugin-slug>.php` was created with the required header fields.

### 1b-2) Create readme.txt

**Skip if the user answered no, or if `readme.txt` already exists.**

Create `readme.txt` using the plugin metadata collected in Phase 1:

```text
=== {Plugin Name} ===
Contributors: {author-slug}
Tags:
Requires at least: {Requires at least}
Tested up to: {Tested up to}
Requires PHP: {Requires PHP}
Stable tag: 0.1.0
License: {License}
License URI: https://www.gnu.org/licenses/gpl-2.0.html

{Description}

== Description ==

{Description}

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/{plugin-slug}/`, or install through the WordPress plugins screen.
2. Activate the plugin through the 'Plugins' screen in WordPress.

== Changelog ==

= 0.1.0 =
* Initial release.
```

See: `references/readme-txt.md`

Completion criterion: `readme.txt` exists in valid WordPress.org format, or skip reason is recorded.

### 1c) Initialize package files (if needed)

If `package.json` does not exist:

```sh
npm init -y
```

If `composer.json` does not exist, create it as a JSON file using the plugin
metadata. Do **not** pass user-provided metadata to `composer init` on the
command line — write the file directly to avoid shell-quoting and injection
issues:

```json
{
  "name": "<author>/<plugin-slug>",
  "description": "{Description}",
  "type": "wordpress-plugin",
  "license": "{License}",
  "require": {},
  "require-dev": {}
}
```

If `.git/` does not exist:

```sh
git init
```

If the user provided a **Git remote URL**, add it as the `origin` remote:

```sh
git remote add origin <remote-url>
```

If `.git/` already exists and has no `origin` remote but the user provided a URL, add it. If `origin` already exists, skip.

Completion criterion: Required init artifacts exist (`package.json`, `composer.json`, `.git`) and remote handling result is reported.

### 2) Install agent skills

Install the **essential** WordPress development skills from
[WordPress/agent-skills](https://github.com/WordPress/agent-skills). Skip any
that already exist under `~/.copilot/skills/` or `~/.agents/skills/`.

```sh
npx skills add https://github.com/WordPress/agent-skills --skill wp-plugin-development
npx skills add https://github.com/WordPress/agent-skills --skill wp-wpcli-and-ops
```

**Optional** — offer these and install only the ones relevant to the project
(do not install by default):

```sh
# Gutenberg blocks (only if the plugin ships blocks)
npx skills add https://github.com/WordPress/agent-skills --skill wp-block-development
# Profiling / caching / query optimization
npx skills add https://github.com/WordPress/agent-skills --skill wp-performance
# Repo classification / routing to other skills
npx skills add https://github.com/WordPress/agent-skills --skill wordpress-router
```

> **Source moved:** these skills are maintained at `WordPress/agent-skills`. The
> former `automattic/agent-skills` repo is archived (read-only), so it no longer
> receives fixes.

Completion criterion: The essential skills are installed or skipped (already present); optional skills were offered and installed only if the user opted in.

### 3) Composer dependencies and scripts

Install all PHP dev dependencies in a single command:

```sh
composer require --dev phpunit/phpunit brain/monkey wp-coding-standards/wpcs dealerdirect/phpcodesniffer-composer-installer pestphp/pest
```

> **Dependencies:** Do not pin versions — let Composer resolve the latest compatible releases. Run `composer update` periodically to stay current.

Unit tests mock WordPress functions with **Brain Monkey** (`brain/monkey`, which pulls in `mockery/mockery`), so tests run without a full WordPress install. See: `references/php-testing.md`.

Then merge these scripts into `composer.json` (do not overwrite existing scripts).

Replace `<plugin-slug>` with the actual plugin slug (folder name / text domain).

```json
{
  "scripts": {
    "test": "phpunit",
    "lint": "phpcs",
    "check": "wp plugin check <plugin-slug> --format=text"
  }
}
```

> **Note:** The `check` script requires [Plugin Check (PCP)](https://wordpress.org/plugins/plugin-check/) installed and activated in WordPress, and WP-CLI available. Install with `wp plugin install plugin-check --activate`.

**PHP lint ruleset.** Create `phpcs.xml` so the `lint` script (`phpcs`) uses a
committed WordPress ruleset and excludes `vendor/` and `node_modules/`. Skip if
`phpcs.xml` (or `phpcs.xml.dist`) already exists. See: `references/linting-setup.md`.

**PHP test scaffolding.** Skip any file that already exists. Create
`phpunit.xml.dist`, `tests/bootstrap.php`, and `tests/TestCase.php` (wires Brain
Monkey `setUp`/`tearDown`) so `composer test` runs out of the box. See:
`references/php-testing.md`.

See: `references/composer-setup.md`

Completion criterion: Composer dev dependencies are installed; `scripts.test`, `scripts.lint`, and `scripts.check` exist without overwriting unrelated scripts; `phpcs.xml` and the PHPUnit test scaffolding exist (or were already present).

### 4) Config files

**`.editorconfig`** — Skip if it already exists. Create with WordPress-standard settings.

See: `references/config-files.md`

**`.gitignore`** — If it exists, merge missing entries. If not, create it.

See: `references/config-files.md`

Completion criterion: `.editorconfig` and `.gitignore` are present, and existing `.gitignore` entries were merged non-destructively.

### 4b) ESLint (JavaScript linting)

**Skip if an ESLint config (`.eslintrc.json`, `.eslintrc.js`, or `eslint.config.js`) already exists.**

Install the latest releases and use WordPress' shared config:

```sh
npm install --save-dev eslint @wordpress/eslint-plugin
```

Create `.eslintrc.json` and `.eslintignore`, then merge a `lint:js` script into
`package.json`:

```json
{
  "scripts": {
    "lint:js": "eslint ."
  }
}
```

See: `references/linting-setup.md`

Completion criterion: `.eslintrc.json`, `.eslintignore`, and `scripts.lint:js` are present, or a skip reason is recorded.

### 5) Vitest setup

**Skip if `vitest.config.js` already exists.**

Vitest is the JavaScript test runner for this project. Install the latest
releases (no pinned versions):

```sh
npm install --save-dev vitest jsdom
```

Create `vitest.config.js` and `tests/setup.js`.

Merge a `test:js` script into `package.json`:

```json
{
  "scripts": {
    "test:js": "vitest run"
  }
}
```

See: `references/vitest-setup.md`

Completion criterion: `vitest.config.js`, `tests/setup.js`, and `scripts.test:js` are present, or a skip reason is recorded.

### 6) i18n scaffolding

**Skip if `i18n-map.json` already exists.**

Use the **text domain** collected in Phase 1.

Ask the user:
- **Block paths**: List any block directories that contain translatable JS strings (e.g. `blocks/my-block`). If none yet, leave empty and update `i18n-map.json` later.

Then:

1. Create `i18n-map.json` with the provided block paths. For each block path, map `blocks/<name>/save.js` → `build/blocks/<name>/index.js`. If no block paths given, create an empty `{}` placeholder.
2. Merge i18n npm scripts into `package.json`, using the provided text domain for the `.pot` filename and `--domain` flag.
3. Create `languages/` directory.

See: `references/i18n-setup.md`

Completion criterion: `i18n-map.json`, `languages/`, and i18n npm scripts are present (or explicit skip/defer rationale is recorded).

### 6b) WordPress Copilot coding instructions

**Skip if `.github/instructions/wordpress.instructions.md` already exists.**

Add the community WordPress coding, security, and testing rules from
[github/awesome-copilot](https://github.com/github/awesome-copilot/blob/main/instructions/wordpress.instructions.md)
so agents follow WordPress best practices in this project:

```sh
mkdir -p .github/instructions
curl -fsSL https://raw.githubusercontent.com/github/awesome-copilot/main/instructions/wordpress.instructions.md \
  -o .github/instructions/wordpress.instructions.md
```

If `curl` is unavailable or you are offline, create the file manually from
`references/copilot-instructions.md`.

See: `references/copilot-instructions.md`

Completion criterion: `.github/instructions/wordpress.instructions.md` exists (downloaded or created manually), or a skip reason is recorded.

### 7) Cleanup

Remove any stray `yarn.lock` file that may have been created by `npx` commands:

```sh
rm -f yarn.lock
```

Only remove it if it did not exist before the skill ran (check the detection output).

Completion criterion: `yarn.lock` was removed only when it was created during this run.

### 8) Final summary

Print a status table showing each phase as ✅ installed, ⏭ skipped, or 🔀 merged.

Remind the user to:
- Run `composer install` and `npm install`.

Completion criterion: Final report includes per-phase status, skipped reasons, and verification outcomes.

## Verification

- All config files exist and are well-formed.
- `composer validate` passes.
- `npm ls` shows no missing peer dependencies for vitest.
- Agent skills are present under `~/.copilot/skills/` or `~/.agents/skills/`.
- `phpcs.xml`, `phpunit.xml.dist`, and `tests/` scaffolding exist when the `composer` phase ran.
- `.eslintrc.json` and `scripts.lint:js` exist when the `eslint` phase ran.
- `.github/instructions/wordpress.instructions.md` exists when the `instructions` phase ran.

## Failure modes / debugging

- `composer require` fails: PHP version too old, or Composer not installed. Check `php -v` and `composer --version`.
- `npx skills add` fails: Node.js < 18 or network issue. Check `node -v`.
- Pest install fails with conflict: PHPUnit version mismatch. Let Composer resolve dependency tree.

## Escalation

If a specific tool or dependency fails, install it manually and re-run the detection script to continue from where you left off.
