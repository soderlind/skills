# Skills

Public AI agent skills for WordPress development, JavaScript modernization, Azure infrastructure, architecture documentation, and pre-launch security audits.

<img width="1280" height="640" alt="soderlind-skills-social-preview" src="https://github.com/user-attachments/assets/b8da043f-c685-4324-b681-08ec43b145a3" />

[![skills.sh](https://skills.sh/b/soderlind/skills)](https://skills.sh/soderlind/skills)

[Available Skills](#available-skills) · [Related Skills](#related-skills-other-repositories) · [Install](#install) · [Usage](#usage) · [Invocation Strategy](#invocation-strategy) · [Skill Notes](#skill-notes)

## Available Skills

### WordPress

Skills for WordPress plugin and theme development.

| Skill | Purpose |
| --- | --- |
| [`prepare-wordpress`](#prepare-wordpress) | Scaffold or update a WordPress project with dev tooling, coding standards, testing, and i18n support. |
| [`wp-bump`](#wp-bump) | Bump a WordPress plugin version and update related release metadata. |
| [`wp-cli-local`](#wp-cli-local) | Run WP-CLI commands against Local by Flywheel sites on macOS. |
| [`wp-mutate`](#wp-mutate) | Run mutation testing on WordPress PHP and JavaScript to find weak tests, then triage surviving mutants. |
| [`wp-pcp-local`](#wp-pcp-local) | Run the WordPress Plugin Check (PCP) against Local by Flywheel sites on macOS. |

### JavaScript

Skills for JavaScript modernization and dependency audits.

| Skill | Purpose |
| --- | --- |
| [`browser-native`](#browser-native) | Audit JavaScript dependencies and identify packages replaceable by modern browser/runtime native APIs. |

### Azure

Skills for Azure infrastructure and API Management.

| Skill | Purpose |
| --- | --- |
| [`add-apim-api`](#add-apim-api) | Scaffold a new API in Azure API Management with Bicep infrastructure. |

### Documentation

Skills for documenting repository architecture.

| Skill | Purpose |
| --- | --- |
| [`document-architecture`](#document-architecture) | Create, improve, or audit repository architecture and concept documentation. |

### Security

Skills for pre-launch security and abuse-resistance audits.

| Skill | Purpose |
| --- | --- |
| [`pre-launch-security-audit`](#pre-launch-security-audit) | Run an evidence-backed security and abuse-resistance review before an application launch. |

## Related Skills (other repositories)

These live in their own repositories and install from there, not from `soderlind/skills`:

| Skill | Purpose | Install |
| --- | --- | --- |
| [`use-just-bash-for-scripts`](https://github.com/soderlind/just-bash-runner) | Steer the agent to dry-run generated or untrusted shell scripts through [`just-bash`](https://github.com/vercel-labs/just-bash) before touching the real host. | `npx skills add soderlind/just-bash-runner` |

## Install

Install a skill globally with `npx skills add`:

```sh
npx skills add soderlind/skills --skill add-apim-api -g
npx skills add soderlind/skills --skill wp-cli-local -g
npx skills add soderlind/skills --skill wp-pcp-local -g
npx skills add soderlind/skills --skill prepare-wordpress -g
npx skills add soderlind/skills --skill wp-bump -g
npx skills add soderlind/skills --skill wp-mutate -g
npx skills add soderlind/skills --skill browser-native -g
npx skills add soderlind/skills --skill document-architecture -g
npx skills add soderlind/skills --skill pre-launch-security-audit -g
```

Install all detected agent integrations without prompts:

```sh
npx skills add soderlind/skills --skill add-apim-api -g --all
npx skills add soderlind/skills --skill wp-cli-local -g --all
npx skills add soderlind/skills --skill wp-pcp-local -g --all
npx skills add soderlind/skills --skill prepare-wordpress -g --all
npx skills add soderlind/skills --skill wp-bump -g --all
npx skills add soderlind/skills --skill wp-mutate -g --all
npx skills add soderlind/skills --skill browser-native -g --all
npx skills add soderlind/skills --skill document-architecture -g --all
npx skills add soderlind/skills --skill pre-launch-security-audit -g --all
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
npx skills update add-apim-api -g
npx skills update wp-cli-local -g
npx skills update wp-pcp-local -g
npx skills update prepare-wordpress -g
npx skills update wp-bump -g
npx skills update wp-mutate -g
npx skills update browser-native -g
npx skills update document-architecture -g
npx skills update pre-launch-security-audit -g
```

Remove a skill:

```sh
npx skills remove add-apim-api -g
npx skills remove wp-cli-local -g
npx skills remove wp-pcp-local -g
npx skills remove prepare-wordpress -g
npx skills remove wp-bump -g
npx skills remove wp-mutate -g
npx skills remove browser-native -g
npx skills remove document-architecture -g
npx skills remove pre-launch-security-audit -g
```

## Usage

After installation, ask your AI agent for the workflow you want. The matching skill should be selected automatically.

Example prompts:

```txt
Add a new API to Azure API Management for my backend service.
Run wp-cli on my Local site and list plugins.
Prepare this project for WordPress plugin development.
Bump this WordPress plugin to 1.2.3.
Run mutation testing on this plugin and show me which tests are weak.
Scan this JavaScript project for dependencies that can be replaced by native browser APIs.
Document the architecture of this repository for new contributors.
Run a pre-launch security audit on this application.
```

## Invocation Strategy

Use model-invoked skills when autonomous triggering is important or when one skill should call another.

Use user-invoked skills when you want zero context load and explicit manual control.

When many user-invoked skills accumulate, add a lightweight router skill that maps tasks to the right skill so you do not rely on memory.

## Skill Notes

### add-apim-api

```sh
npx skills add soderlind/skills --skill add-apim-api -g
```

Use this to scaffold a new API in Azure API Management with Bicep infrastructure.

Prerequisites:

- Azure CLI with Bicep extension
- Existing APIM infrastructure project
- Access to the target Azure subscription

Example prompt:

```txt
Add a speeches-api to APIM with backend at https://api.example.com/speeches
```

The skill guides you through gathering requirements, creating Bicep files, and wiring up the API.

### wp-cli-local

```sh
npx skills add soderlind/skills --skill wp-cli-local -g
```

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

### wp-pcp-local

```sh
npx skills add soderlind/skills --skill wp-pcp-local -g
```

Use this to run the WordPress Plugin Check (PCP) against a plugin on a Local by Flywheel site.

Prerequisites:

- macOS
- Local by Flywheel installed
- WP-CLI installed and available in `PATH`
- The [Plugin Check](https://wordpress.org/plugins/plugin-check/) plugin installed and activated on the target site
- The target Local site is running

The skill routes Plugin Check through its bundled wrapper, auto-detecting the site and plugin slug from the current directory:

```sh
bash skills/wp-pcp-local/scripts/pcp my-plugin
```

### prepare-wordpress

```sh
npx skills add soderlind/skills --skill prepare-wordpress -g
```

Use this to set up or refresh a WordPress project with common development tooling.

Prerequisites:

- Node.js 18+
- Composer 2+
- PHP 8.3+
- git
- WP-CLI for i18n commands

Preview the setup plan before changing a project (paths below assume a clone of this repo; when installed, use the skill's own directory):

```sh
node skills/prepare-wordpress/scripts/plan_setup.mjs --dry-run
```

Apply selected safe setup phases:

```sh
node skills/prepare-wordpress/scripts/plan_setup.mjs --apply --only=init,composer,config
```

### wp-bump

```sh
npx skills add soderlind/skills --skill wp-bump -g
```

Use this for WordPress plugin releases. It updates existing version fields, changelog entries, build outputs, and test checks according to the target project.

Example prompt:

```txt
Run wp-bump for version 1.2.3.
```

The skill does not create commits, tags, or releases unless you explicitly ask your agent to do so.

### wp-mutate

```sh
npx skills add soderlind/skills --skill wp-mutate -g
```

Use this to measure test *quality* rather than test coverage. Mutation testing changes your source in small ways and re-runs the suite; a mutant that survives marks a line that runs but is never asserted.

Prerequisites:

- An existing test suite. This skill does not create one — use `prepare-wordpress` first.
- PHP: Pest 3+ (native `--mutate`) or PHPUnit (Infection), plus **Xdebug 3+ with `xdebug.mode=coverage`, or PCOV**. Without a coverage driver Pest refuses to start.
- JavaScript: Vitest or Jest, for StrykerJS.

Five failure modes are specific to WordPress plugins, and each one produces a clean-looking run rather than an error. The skill checks for all of them:

- PCOV auto-detects `pcov.directory` and often picks an asset folder such as `lib/`, so every file reports 0.0% coverage.
- Pest's `--everything` enumerates classes via PSR-4, so WordPress `class-*.php` filenames are invisible to it. Scope with `--path=` instead.
- Pest's `--parallel` workers do not inherit `-d` ini flags, and mutants that time out are scored as killed — which can turn a real 60% into a reported 100%.
- Brain Monkey (via Patchwork) stops Infection's mutants from taking effect: the run either exits 0 with no summary or reports MSI 0%. The skill blocks that combination and routes you to Pest.
- StrykerJS copies Composer's `vendor/` into its sandbox unless `ignorePatterns` says otherwise, then tries to parse PHP CodeSniffer's HTML fixtures.

Because all five look like ordinary output, the skill verifies the harness before reporting any score: mutants were created, at least one was killed, and the kills are not just time-outs.

Preview what the skill would run against (path assumes a clone of this repo; when installed, use the skill's own directory):

```sh
node skills/wp-mutate/scripts/detect_mutation_setup.mjs
```

Example prompt:

```txt
Run mutation testing on this plugin and show me which tests are weak.
```

The skill reports two scores (overall and covered-code only), ranks surviving mutants with untested security controls first, and proposes assertions one at a time rather than rewriting tests on its own; see [references/triage-playbook.md](skills/wp-mutate/references/triage-playbook.md) for the mutant-to-assertion mapping and [references/glossary.md](skills/wp-mutate/references/glossary.md) for the engine vocabulary differences.

### browser-native

```sh
npx skills add soderlind/skills --skill browser-native -g
```

Use this to scan JavaScript/Node.js dependencies and find packages that can be replaced with built-in APIs (`fetch`, `URL`, `structuredClone`, `crypto.randomUUID`, `Intl`, etc.).

Run the local scanner directly (path assumes a clone of this repo; when installed, use the skill's own directory):

```sh
node skills/browser-native/scripts/cli.js .
```

Markdown report with before/after examples:

```sh
node skills/browser-native/scripts/cli.js . --md
```

### document-architecture

```sh
npx skills add soderlind/skills --skill document-architecture -g
```

Use this to create, improve, or audit repository architecture and concept documentation (architecture overviews, domain models, component boundaries, data/control flows, invariants, ADRs).

Example prompt:

```txt
Document the architecture of this repository so a new contributor can navigate it.
```

The skill labels current vs. proposed states explicitly and verifies claims against the repository before writing docs; see [references/templates.md](skills/document-architecture/references/templates.md) for document templates.

### pre-launch-security-audit

```sh
npx skills add soderlind/skills --skill pre-launch-security-audit -g
```

Use this to run a stack-agnostic security and abuse-resistance review before launching an application (MVP, SaaS, AI app, public API, or mobile backend).

Example prompt:

```txt
Run a pre-launch security audit on this app before we go live.
```

The skill inspects the repository first, tests failure cases, and ends with a launch recommendation (block, conditional, or baseline met) rather than a compliance certification; see [references/checklist.md](skills/pre-launch-security-audit/references/checklist.md) for the control set.

## Repository Layout

Each skill lives in its own folder under `skills/`:

```txt
skills/
  add-apim-api/
    SKILL.md
    references/
  browser-native/
    SKILL.md
    references/
    scripts/
  prepare-wordpress/
    SKILL.md
    references/
    scripts/
  wp-bump/
    SKILL.md
  wp-cli-local/
    SKILL.md
    scripts/
  wp-mutate/
    SKILL.md
    references/
    scripts/
  wp-pcp-local/
    SKILL.md
    scripts/
  document-architecture/
    SKILL.md
    agents/
    references/
  pre-launch-security-audit/
    SKILL.md
    agents/
    references/
```

## Licenses

All skills in this repository are licensed under the MIT License.

## AI Contribution Attribution

`Assisted-by: GitHub Copilot:GPT-5.3-Codex`
