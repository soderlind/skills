# Skills

Public AI agent skills for WordPress development, JavaScript modernization, Azure infrastructure, architecture documentation, and pre-launch security audits.

[![skills.sh](https://skills.sh/b/soderlind/skills)](https://skills.sh/soderlind/skills)

[Available Skills](#available-skills) · [Related Skills](#related-skills-other-repositories) · [Install](#install) · [Usage](#usage) · [Invocation Strategy](#invocation-strategy) · [Skill Notes](#skill-notes)

## Available Skills

### WordPress

Skills for WordPress plugin and theme development.

<table>
<thead><tr><th width="280">Skill</th><th>Purpose</th></tr></thead>
<tbody>
<tr><td nowrap><a href="#prepare-wordpress"><samp>prepare-wordpress</samp></a></td><td>Scaffold or update a WordPress project with dev tooling, coding standards, testing, and i18n support.</td></tr>
<tr><td nowrap><a href="#wp-ability-auth"><samp>wp-ability-auth</samp></a></td><td>Audit or implement two-tier authorization for WordPress abilities and REST routes, catching IDOR gaps and inconsistent 403 contracts.</td></tr>
<tr><td nowrap><a href="#wp-bump"><samp>wp-bump</samp></a></td><td>Bump a WordPress plugin version and update related release metadata.</td></tr>
<tr><td nowrap><a href="#wp-cli-local"><samp>wp-cli-local</samp></a></td><td>Run WP-CLI commands against Local by Flywheel sites on macOS.</td></tr>
<tr><td nowrap><a href="#wp-mutate"><samp>wp-mutate</samp></a></td><td>Run mutation testing on WordPress PHP and JavaScript to find weak tests, then triage surviving mutants.</td></tr>
<tr><td nowrap><a href="#wp-org-review"><samp>wp-org-review</samp></a></td><td>Prepare a plugin for the WordPress.org Directory review, fixing findings the reviewer catches beyond Plugin Check/PHPCS.</td></tr>
<tr><td nowrap><a href="#wp-pcp-local"><samp>wp-pcp-local</samp></a></td><td>Run the WordPress Plugin Check (PCP) against Local by Flywheel sites on macOS.</td></tr>
</tbody>
</table>

### JavaScript

Skills for JavaScript modernization and dependency audits.

<table>
<thead><tr><th width="280">Skill</th><th>Purpose</th></tr></thead>
<tbody>
<tr><td nowrap><a href="#browser-native"><samp>browser-native</samp></a></td><td>Audit JavaScript dependencies and identify packages replaceable by modern browser/runtime native APIs, with Baseline status and confidence.</td></tr>
</tbody>
</table>

### Azure

Skills for Azure infrastructure and API Management.

<table>
<thead><tr><th width="280">Skill</th><th>Purpose</th></tr></thead>
<tbody>
<tr><td nowrap><a href="#add-apim-api"><samp>add-apim-api</samp></a></td><td>Scaffold a new API in Azure API Management with Bicep infrastructure.</td></tr>
</tbody>
</table>

### Documentation

Skills for documenting repository architecture.

<table>
<thead><tr><th width="280">Skill</th><th>Purpose</th></tr></thead>
<tbody>
<tr><td nowrap><a href="#document-architecture"><samp>document-architecture</samp></a></td><td>Create, improve, or audit repository architecture and concept documentation.</td></tr>
</tbody>
</table>

### Security

Skills for pre-launch security and abuse-resistance audits.

<table>
<thead><tr><th width="280">Skill</th><th>Purpose</th></tr></thead>
<tbody>
<tr><td nowrap><a href="#pre-launch-security-audit"><samp>pre-launch-security-audit</samp></a></td><td>Run an evidence-backed security and abuse-resistance review before an application launch.</td></tr>
</tbody>
</table>

## Related Skills (other repositories)

These live in their own repositories and install from there, not from `soderlind/skills`:

<table>
<thead><tr><th width="280">Skill</th><th>Purpose</th></tr></thead>
<tbody>
<tr><td nowrap><a href="https://github.com/soderlind/just-bash-runner"><samp>use-just-bash-for-scripts</samp></a></td><td>Steer the agent to dry-run generated or untrusted shell scripts through <a href="https://github.com/vercel-labs/just-bash"><code>just-bash</code></a> before touching the real host.</td></tr>
</tbody>
</table>

```sh
npx skills add soderlind/just-bash-runner
```

## Install

Every skill installs with the [skills](https://skills.sh) CLI. `-g` installs globally, so the skill is available in every project.

Install all skills from this repository:

```sh
npx skills add soderlind/skills -g
```

Install a single skill — swap in any name from [Available Skills](#available-skills):

```sh
npx skills add soderlind/skills --skill wp-bump -g
```

Add `--all` to install into every detected agent integration without prompts:

```sh
npx skills add soderlind/skills -g --all
```

Browse, list, update, and remove:

```sh
npx skills add soderlind/skills --list   # preview the skills in this repository
npx skills list -g                       # list installed skills
npx skills update wp-bump -g             # update one skill
npx skills remove wp-bump -g             # remove one skill
```

### Discovery index

These skills are published as an [Agent Skills discovery index](https://github.com/cloudflare/agent-skills-discovery-rfc) (schema v0.2.0), so agents can enumerate and fetch them without the CLI:

```sh
curl https://soderlind.no/.well-known/agent-skills/index.json
```

Each entry carries a `sha256:` digest of its artifact — a single `SKILL.md` for skills with no supporting files, otherwise a `.tar.gz` of the skill directory. Clients must verify the digest before use and must not execute anything under `scripts/` without explicit approval.

Regenerate the index and archives after changing any skill, then deploy the whole `.well-known/agent-skills/` directory to the `soderlind.no` document root — it is self-contained, and every `url` in the index resolves inside it:

```sh
node scripts/build-agent-skills-index.mjs           # rebuild
node scripts/build-agent-skills-index.mjs --check   # fail if the committed output is stale (runs in CI)
```

The server must send `application/json` for `index.json`, `application/gzip` for `.tar.gz`, and `text/markdown` or `text/plain` for `SKILL.md`.

Archives are byte-reproducible (fixed mtimes, sorted entries), so unchanged skills produce unchanged digests. Use `--base-url` to point the index at a different origin:

```sh
node scripts/build-agent-skills-index.mjs --base-url https://example.com
```

## Usage

After installation, ask your AI agent for the workflow you want and the matching skill is selected automatically. You can also target a skill directly with a slash command — `/<skill-name>` — optionally passing arguments, e.g. `/prepare-wordpress i18n` to run just the i18n phase.

Example invocations:

```txt
/add-apim-api speeches-api backend https://api.example.com/speeches
/wp-cli-local list plugins
/prepare-wordpress i18n
/wp-bump 1.2.3
/wp-mutate
/browser-native
/document-architecture
/pre-launch-security-audit
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
/add-apim-api speeches-api backend https://api.example.com/speeches
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

### wp-ability-auth

```sh
npx skills add soderlind/skills --skill wp-ability-auth -g
```

Use this to audit or implement authorization for WordPress abilities (`wp_register_ability`)
and REST routes with a two-tier permission model: a coarse capability gate in
`permission_callback`, then a per-object meta-capability check inside the execute callback.

It enforces:

- A single `WP_Error` 403 contract across both tiers (never `array('success' => false)`).
- A tier-2 per-object check on every ability that touches a specific object (IDOR guard).
- Plural caps in tier 1 (`edit_posts`), singular meta-caps in tier 2 (`edit_post`, `$id`).
- A centralized, filterable ability→capability map instead of scattered `current_user_can`.
- An auth-principal check for MCP/agent or background invocations with no current user.

Example prompt:

```txt
/wp-ability-auth audit the abilities in this plugin
```

### wp-org-review

```sh
npx skills add soderlind/skills --skill wp-org-review -g
```

Use this to harden a plugin for the WordPress.org Plugin Directory review, catching the findings the reviewer flags but local tooling misses.

It audits and fixes:

- Suppressed sniffs (`phpcs:ignore` / `phpcs:disable`) — real fix or justified ignore.
- Arbitrary-path or disallowed-location filesystem writes.
- Context-correct output escaping applied at the point of output.
- `readme.txt` `Contributors:` mapping to the wp.org slug owner.
- Bundled compiled translations that should not ship in the zip.

It also bundles [`reviewer-findings.md`](skills/wp-org-review/references/reviewer-findings.md), a generic catalog distilled from real Plugin Directory review emails — every recurring finding (prefixing, location constants, filesystem writes, unneeded files, out-of-date libraries, update checkers, `register_setting` sanitization, textdomain, contributors, enqueuing, escaping, trademarks, external-service disclosure, dead URLs, readme accuracy) with a detection command and a fix for each.

Example prompt:

```txt
/wp-org-review respond to this plugin review email
```

### prepare-wordpress

```sh
npx skills add soderlind/skills --skill prepare-wordpress -g
```

Use this to set up or refresh a WordPress project with common development tooling.

Example prompt (pass a phase name to run just that phase):

```txt
/prepare-wordpress i18n
```

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

Available phases (pass any comma-separated subset to `--only=` or `--skip=`):

| Phase | What it includes |
| --- | --- |
| `plugin` | Plugin bootstrap `<slug>.php` generated from the collected metadata. |
| `readme` | `readme.txt` from the plugin metadata (optional, opt-in only). |
| `init` | Project basics: `npm init -y`, `git init`, a hand-written `composer.json`, and a `git remote add origin` prompt when missing. |
| `skills` | Installs the essential agent skills via `npx skills add`; optional skills are noted to install only if relevant. |
| `composer` | PHP dev deps (`phpunit`, `brain/monkey`, `wpcs`, `phpcodesniffer-composer-installer`, `pest`); merges `test`/`lint`/`check` scripts; scaffolds `phpcs.xml`, `phpunit.xml.dist`, and `tests/`. |
| `config` | Creates or merges `.editorconfig` and `.gitignore`. |
| `vitest` | Installs `vitest jsdom`; scaffolds `vitest.config.js`, `tests/setup.js`, and a `test:js` npm script. |
| `eslint` | Installs `eslint @wordpress/eslint-plugin`; creates `.eslintrc.json`, `.eslintignore`, and a `lint:js` npm script. |
| `i18n` | Scaffolds `i18n-map.json`, a `languages/` directory, and i18n npm scripts keyed to the text domain. |
| `instructions` | Downloads `.github/instructions/wordpress.instructions.md` from github/awesome-copilot (manual fallback if offline). |
| `cleanup` | Removes a stray `yarn.lock`. |

### wp-bump

```sh
npx skills add soderlind/skills --skill wp-bump -g
```

Use this for WordPress plugin releases. It updates existing version fields, changelog entries, build outputs, and test checks according to the target project.

Example prompt:

```txt
/wp-bump 1.2.3
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
/wp-mutate
```

The skill reports two scores (overall and covered-code only), ranks surviving mutants with untested security controls first, and proposes assertions one at a time rather than rewriting tests on its own; see [references/triage-playbook.md](skills/wp-mutate/references/triage-playbook.md) for the mutant-to-assertion mapping and [references/glossary.md](skills/wp-mutate/references/glossary.md) for the engine vocabulary differences.

### browser-native

```sh
npx skills add soderlind/skills --skill browser-native -g
```

Use this to scan JavaScript/Node.js dependencies and find packages that can be replaced with built-in APIs (`fetch`, `URL`, `structuredClone`, `crypto.randomUUID`, `Intl`, `Object.groupBy`, `Set` methods, `<dialog>`/Popover API, etc.).

Each finding carries a **confidence** level (does the native API do what the library does?) and a **Baseline** status (can your users run it? — `widely` / `newly` / `limited`), so you can tell the easy wins from swaps that need an audience check or a fallback.

Example prompt:

```txt
/browser-native
```

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
/document-architecture
```

The skill labels current vs. proposed states explicitly and verifies claims against the repository before writing docs; see [references/templates.md](skills/document-architecture/references/templates.md) for document templates.

### pre-launch-security-audit

```sh
npx skills add soderlind/skills --skill pre-launch-security-audit -g
```

Use this to run a stack-agnostic security and abuse-resistance review before launching an application (MVP, SaaS, AI app, public API, or mobile backend).

Example prompt:

```txt
/pre-launch-security-audit
```

The skill inspects the repository first, tests failure cases, and ends with a launch recommendation (block, conditional, or baseline met) rather than a compliance certification; see [references/checklist.md](skills/pre-launch-security-audit/references/checklist.md) for the control set.

## Repository Layout

Each skill lives in its own folder under `skills/`:

```txt
.well-known/
  agent-skills/            # generated discovery index + skill archives
scripts/
  build-agent-skills-index.mjs
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
