# Skills

Public AI agent skills for WordPress development workflows.

## Available Skills

| Skill | Purpose |
| --- | --- |
| [`wp-cli-local`](https://skills.sh/soderlind/skills/wp-cli-local) | Run WP-CLI commands against Local by Flywheel sites on macOS. |
| [`prepare-wordpress`](https://skills.sh/soderlind/skills/prepare-wordpress) | Scaffold or update a WordPress project with dev tooling, coding standards, testing, and i18n support. |
| [`wp-bump`](https://skills.sh/soderlind/skills/wp-bump) | Bump a WordPress plugin version and update related release metadata. |

## Install

Install a skill globally with `npx skills add`:

```sh
npx skills add soderlind/skills --skill wp-cli-local -g
npx skills add soderlind/skills --skill prepare-wordpress -g
npx skills add soderlind/skills --skill wp-bump -g
```

Install all detected agent integrations without prompts:

```sh
npx skills add soderlind/skills --skill wp-cli-local -g --all
npx skills add soderlind/skills --skill prepare-wordpress -g --all
npx skills add soderlind/skills --skill wp-bump -g --all
```

Preview the skills available from this repository:

```sh
npx skills add soderlind/skills --list
```

List installed skills:

```sh
npx skills list -g
```

Update a skill:

```sh
npx skills update wp-cli-local -g
npx skills update prepare-wordpress -g
npx skills update wp-bump -g
```

Remove a skill:

```sh
npx skills remove wp-cli-local -g
npx skills remove prepare-wordpress -g
npx skills remove wp-bump -g
```

## Usage

After installation, ask your AI agent for the workflow you want. The matching skill should be selected automatically.

Example prompts:

```txt
Run wp-cli on my Local site and list plugins.
Prepare this project for WordPress plugin development.
Bump this WordPress plugin to 1.2.3.
```

## Skill Notes

### wp-cli-local

Use this when working with WordPress sites in Local by Flywheel.

Prerequisites:

- macOS
- Local by Flywheel installed
- WP-CLI installed and available in `PATH`
- The target Local site is running

The skill always routes WP-CLI through its bundled wrapper:

```sh
bash skills/wp-cli-local/scripts/wp --list
```

### prepare-wordpress

Use this to set up or refresh a WordPress project with common development tooling.

Prerequisites:

- Node.js 18+
- Composer 2+
- PHP 8.3+
- git
- WP-CLI for i18n commands

Preview the setup plan before changing a project:

```sh
node skills/prepare-wordpress/scripts/plan_setup.mjs --dry-run
```

Apply selected safe setup phases:

```sh
node skills/prepare-wordpress/scripts/plan_setup.mjs --apply --only=init,composer,config
```

### wp-bump

Use this for WordPress plugin releases. It updates existing version fields, changelog entries, build outputs, and test checks according to the target project.

Example prompt:

```txt
Run wp-bump for version 1.2.3.
```

The skill does not create commits, tags, or releases unless you explicitly ask your agent to do so.

## Repository Layout

Each skill lives in its own folder under `skills/`:

```txt
skills/
  prepare-wordpress/
    SKILL.md
    references/
    scripts/
  wp-bump/
    SKILL.md
  wp-cli-local/
    SKILL.md
    scripts/
```

## Licenses

- `wp-cli-local`: MIT, as published in the original source repository.
- `prepare-wordpress`: GPL-2.0-or-later, as published in the original source repository.
- `wp-bump`: GPL-2.0-or-later, distributed with `prepare-wordpress` in the original source repository.
