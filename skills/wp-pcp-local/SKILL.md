---
name: wp-pcp-local
description: "Run the WordPress Plugin Check (PCP) against a Local by Flywheel site via wrapper, with explicit site and plugin resolution before checks."
version: "1.0.0"
---

# Plugin Check (PCP) for Local by Flywheel

Run the WordPress [Plugin Check](https://wordpress.org/plugins/plugin-check/) plugin (`wp plugin check <slug>`) against Local sites using the wrapper script bundled with this skill.

**Never run bare `wp plugin check` commands.** Always use the wrapper:

```bash
bash {{SKILL_DIR}}/scripts/pcp <plugin-slug> [check-args...]
```

## Determinism checklist

Apply [DETERMINISM-CHECKLIST.md](../DETERMINISM-CHECKLIST.md) for this skill run.

## Shell compatibility (zsh vs bash)

The default shell in macOS and VS Code terminals is **zsh**, which does **not** word-split unquoted variable expansions. A pattern like `PCP="bash .../pcp"` followed by `$PCP my-plugin` runs the whole string as a single command name in zsh and fails with `no such file or directory`.

To make examples work on the first try in both bash and zsh, either:

- **Invoke the wrapper as a full command** (recommended for agents):

  ```bash
  bash "{{SKILL_DIR}}/scripts/pcp" --site=my-site my-plugin
  ```

- **Or define a shell function wrapper** that forwards arguments correctly in both shells:

  ```bash
  pcp() { bash "{{SKILL_DIR}}/scripts/pcp" "$@"; }

  pcp my-plugin
  ```

Do **not** use a bare `$PCP` variable to hold the command. If a variable is truly required in zsh, force word-splitting with `${=PCP}`.

## Site and plugin detection

The wrapper **auto-detects the site** by matching the current working directory against site paths in Local's `sites.json`. When run from inside `wp-content/plugins/<slug>`, it also **auto-detects the plugin slug**. No arguments are needed when the terminal is inside a plugin directory of a Local site.

```bash
# Define a function wrapper (works in bash and zsh)
pcp() { bash "{{SKILL_DIR}}/scripts/pcp" "$@"; }

# Auto-detect site + plugin (CWD must be inside wp-content/plugins/<slug>)
pcp

# Explicit plugin slug (site still auto-detected from CWD)
pcp my-plugin

# Explicit site + plugin slug
pcp --site=my-site my-plugin

# List all sites with running/halted status
pcp --list
```

**If auto-detection fails** (CWD is not inside any Local site) and no `--site=` is given, the script prints available sites. Ask the user which site to target, or use `--site=<name>`. If no plugin slug is provided and none can be detected, pass the slug explicitly as the first argument.

Completion criterion: A target site and plugin slug are explicitly resolved by auto-detection or by argument before checks are run.

## Requirements

- macOS (Apple Silicon or Intel)
- Local by Flywheel installed with sites in `~/Library/Application Support/Local/sites.json`
- WP-CLI installed and available in `PATH` (e.g. via `brew install wp-cli`)
- The [Plugin Check](https://wordpress.org/plugins/plugin-check/) plugin installed and activated on the target site
- The target site **must be running** in Local (the site-specific php.ini only exists at runtime)

Install the Plugin Check plugin (using the `wp-cli-local` skill's wrapper):

```bash
bash <wp-cli-local>/scripts/wp --site=my-site plugin install plugin-check --activate
```

## Common commands

```bash
# Define a function wrapper (works in bash and zsh)
pcp() { bash "{{SKILL_DIR}}/scripts/pcp" "$@"; }

# Run all default checks against a plugin
pcp my-plugin

# Only the plugin repository readiness checks
pcp my-plugin --categories=plugin_repo

# Run specific checks
pcp my-plugin --checks=i18n_usage,late_escaping

# Exclude specific checks
pcp my-plugin --exclude-checks=file_type

# Output formats: table (default), csv, json, wp
pcp my-plugin --format=json

# Only surface errors (ignore warnings), or the reverse
pcp my-plugin --ignore-warnings
pcp my-plugin --ignore-errors

# Filter by severity threshold (numeric)
pcp my-plugin --severity=5

# List available checks / categories
pcp my-plugin --help
```

All arguments after the plugin slug are forwarded directly to `wp plugin check`.

## Failure modes / recovery

- `WP-CLI not found`: Verify `wp --info` works in PATH, then retry wrapper command.
- `plugin check command not available`: Install/activate the Plugin Check plugin on the site, then rerun.
- `Site is not running`: Start the Local site first, then rerun command.
- `Could not auto-detect site`: Run `pcp --list` (or `bash "{{SKILL_DIR}}/scripts/pcp" --list`), then rerun with `--site=<name>`.
- `No plugin slug`: Pass the slug as the first argument, or `cd` into `wp-content/plugins/<slug>`.
- `Wrapper path issue`: Use the absolute wrapper path from `{{SKILL_DIR}}/scripts/pcp` and retry.

Completion criterion: Checks ran through the wrapper, target site and plugin were explicit, and any failures were reported with the exact failing command.
