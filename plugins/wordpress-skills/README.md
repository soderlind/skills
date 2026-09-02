# wordpress-skills

WordPress development, testing, and release skills.

An [Agent Plugin](https://agent-plugins.org) (spec v1.0.0) bundling 7 skills:

| Skill | Description |
| ----- | ----------- |
| [`wp-ability-auth`](skills/wp-ability-auth/SKILL.md) | Audit or implement authorization for WordPress abilities (wp_register_ability) and REST routes using a two-tier permission model — a coarse capability gate in permission_callback and a per-object meta-capability check inside the execute callback. Use when adding permission_callback logic, reviewing wp_register_ability or register_rest_route authorization, hunting IDOR gaps, centralizing an ability→capability map, enforcing a consistent WP_Error 403 contract, or hardening abilities invoked via MCP/agent or background contexts. |
| [`wp-bump`](skills/wp-bump/SKILL.md) | Structured WordPress plugin release-bump workflow that orchestrates version sync, changelog, rebuild, and validation steps with explicit gates. |
| [`wp-cli-local`](skills/wp-cli-local/SKILL.md) | Safe WP-CLI execution for Local by Flywheel via wrapper, including explicit site resolution before mutating operations. |
| [`wp-mutate`](skills/wp-mutate/SKILL.md) | Run mutation testing on WordPress plugins and themes to find weak tests — Pest --mutate or Infection for PHP, StrykerJS for JavaScript — then triage surviving mutants into concrete test improvements. |
| [`wp-org-review`](skills/wp-org-review/SKILL.md) | Prepare a WordPress plugin for the WordPress.org Plugin Directory review. Audits and fixes the findings the reviewer catches but local Plugin Check/PHPCS miss — suppressed sniffs, arbitrary-path writes, output escaping, readme contributors, bundled translations, and disallowed file writes. Use when submitting/resubmitting a plugin to wordpress.org, responding to a plugin review email, or hardening a plugin against Plugin Check. |
| [`wp-pcp-local`](skills/wp-pcp-local/SKILL.md) | Run the WordPress Plugin Check (PCP) against a Local by Flywheel site via wrapper, with explicit site and plugin resolution before checks. |
| [`wp-prepare`](skills/wp-prepare/SKILL.md) | Phase-based WordPress project setup workflow with dry-run planning and confirmed apply for predictable scaffolding/standardization. |

## Install

The root of [https://github.com/soderlind/wordpress-agent-plugin](https://github.com/soderlind/wordpress-agent-plugin) is this plugin. Installation is
client-specific; common patterns:

**Clone the plugin (repo root is the plugin root)**

```bash
git clone https://github.com/soderlind/wordpress-agent-plugin
```

**Copy into a client plugins directory** (path varies by client)

```bash
git clone https://github.com/soderlind/wordpress-agent-plugin ~/.agents/plugins/wordpress-skills
```

**Or use your client's native install command**, pointing it at the repository
above. Refer to your client's documentation for the exact command and plugins
directory.

## Contents

Each skill lives under `skills/<name>/` with its own `SKILL.md` and any
`scripts/` and `references/`. Open a skill's `SKILL.md` (linked above) for its
full instructions. See the Agent Skills specification at
https://agentskills.io/specification.

---

This plugin is generated from [https://github.com/soderlind/skills](https://github.com/soderlind/skills) by
`scripts/build-agent-plugin.mjs` and mirrored here. Do not edit files directly.
