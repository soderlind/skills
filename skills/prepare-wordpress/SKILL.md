---
name: prepare-wordpress
description: "Use to scaffold or update a WordPress project with dev tooling, agent skills, linting (WPCS), testing (PHPUnit/Pest/Vitest), config files (.editorconfig, .gitignore), and i18n support. Works for both new and existing projects."
compatibility: "macOS/Linux with Node.js 18+, Composer 2+, PHP 8.3+, git. Optional: WP-CLI for i18n commands."
---

# Prepare WordPress Project

## When to use

Use this skill when:

- Starting a new WordPress plugin or theme project from scratch
- Adding standard dev tooling to an existing WordPress project
- Ensuring a WordPress project follows coding standards and best practices
- Setting up testing, linting, or i18n scaffolding

## Inputs required

- Repo root (current working directory).
- Whether this is a new or existing project (auto-detected).
- Plugin metadata (prompted during execution).

## Procedure

### 0) Detect existing project state

Run the detection script to discover what already exists:

```sh
node skills/prepare-wordpress/scripts/detect_project.mjs
```

This outputs JSON with booleans for each component. Use it to skip phases that are already configured. Report to the user what will be added and what will be skipped.

### 0b) Choose feature flags and execution mode

Before changing files, ask which phases to run. Defaults: all phases enabled, dry-run first.

- `plugin` — create plugin bootstrap file
- `readme` — create `readme.txt`
- `init` — initialize repo/package/composer basics
- `skills` — install agent skills
- `composer` — install PHP dev deps and merge scripts
- `config` — create/merge `.editorconfig` and `.gitignore`
- `vitest` — install and scaffold Vitest
- `i18n` — scaffold i18n files/scripts
- `cleanup` — remove stray `yarn.lock`

Use the planner script to preview actions:

```sh
node skills/prepare-wordpress/scripts/plan_setup.mjs --dry-run
```

Feature flags:

```sh
# Run only selected phases
node skills/prepare-wordpress/scripts/plan_setup.mjs --dry-run --only=init,composer,config

# Skip selected phases
node skills/prepare-wordpress/scripts/plan_setup.mjs --dry-run --skip=skills,vitest
```

Apply safe shell commands from the plan (manual file merges are still called out as notes):

```sh
node skills/prepare-wordpress/scripts/plan_setup.mjs --apply --only=init,skills,composer
```

Machine-readable dry-run output for automation:

```sh
node skills/prepare-wordpress/scripts/plan_setup.mjs --json --only=init,composer
```

Machine-readable apply output with command execution results:

```sh
node skills/prepare-wordpress/scripts/plan_setup.mjs --json --apply --only=cleanup
```

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

### 1b-2) Create readme.txt

**Skip if the user answered no, or if `readme.txt` already exists.**

Create `readme.txt` using the plugin metadata collected in Phase 1:

```
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

### 1c) Initialize package files (if needed)

If `package.json` does not exist:
```sh
npm init -y
```

If `composer.json` does not exist, create it using the plugin metadata:
```sh
composer init --no-interaction --name=<author>/<plugin-slug> --description="{Description}" --license={License}
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

### 2) Install agent skills

Install the following skills. Skip any that already exist under `~/.copilot/skills/` or `~/.agents/skills/`.

```sh
npx skills add https://github.com/automattic/agent-skills --skill wp-plugin-development
npx skills add https://github.com/automattic/agent-skills --skill wp-block-development
npx skills add https://github.com/automattic/agent-skills --skill wordpress-router
npx skills add https://github.com/automattic/agent-skills --skill wp-performance
npx skills add https://github.com/automattic/agent-skills --skill wp-wpcli-and-ops
npx skills add https://github.com/jeffallan/claude-skills --skill wordpress-pro
```

### 3) Composer dependencies and scripts

Install all PHP dev dependencies in a single command:

```sh
composer require --dev phpunit/phpunit wp-coding-standards/wpcs dealerdirect/phpcodesniffer-composer-installer pestphp/pest
```

Then merge these scripts into `composer.json` (do not overwrite existing scripts).

Replace `<plugin-slug>` with the actual plugin slug (folder name / text domain).

```json
{
  "scripts": {
    "test": "phpunit",
    "lint": "phpcs --standard=WordPress --extensions=php .",
    "check": "wp plugin check <plugin-slug> --format=text"
  }
}
```

> **Note:** The `check` script requires [Plugin Check (PCP)](https://wordpress.org/plugins/plugin-check/) installed and activated in WordPress, and WP-CLI available. Install with `wp plugin install plugin-check --activate`.

See: `references/composer-setup.md`

### 4) Config files

**`.editorconfig`** — Skip if it already exists. Create with WordPress-standard settings.

See: `references/config-files.md`

**`.gitignore`** — If it exists, merge missing entries. If not, create it.

See: `references/config-files.md`

### 5) Vitest setup

**Skip if `vitest.config.js` already exists.**

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

### 7) Cleanup

Remove any stray `yarn.lock` file that may have been created by `npx` commands:

```sh
rm -f yarn.lock
```

Only remove it if it did not exist before the skill ran (check the detection output).

### 9) Final summary

Print a status table showing each phase as ✅ installed, ⏭ skipped, or 🔀 merged.

Remind the user to:
- Run `composer install` and `npm install`.

## Verification

- All config files exist and are well-formed.
- `composer validate` passes.
- `npm ls` shows no missing peer dependencies for vitest.
- Agent skills are present under `~/.copilot/skills/` or `~/.agents/skills/`.

## Failure modes / debugging

- `composer require` fails: PHP version too old, or Composer not installed. Check `php -v` and `composer --version`.
- `npx skills add` fails: Node.js < 18 or network issue. Check `node -v`.
- Pest install fails with conflict: PHPUnit version mismatch. Let Composer resolve dependency tree.

## Escalation

If a specific tool or dependency fails, install it manually and re-run the detection script to continue from where you left off.
