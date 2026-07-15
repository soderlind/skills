---
name: wp-cli-local
description: "Safe WP-CLI execution for Local by Flywheel via wrapper, including explicit site resolution before mutating operations."
version: "1.1.0"
---

# WP-CLI for Local by Flywheel

Run WP-CLI commands against Local sites using the wrapper script bundled with this skill.

**Never run bare `wp` commands.** Always use the wrapper:

```bash
bash {{SKILL_DIR}}/scripts/wp <wp-cli-command...>
```

## Determinism checklist

Apply [DETERMINISM-CHECKLIST.md](../DETERMINISM-CHECKLIST.md) for this skill run.

## Shell compatibility (zsh vs bash)

The default shell in macOS and VS Code terminals is **zsh**, which does **not** word-split unquoted variable expansions. A pattern like `WP="bash .../wp"` followed by `$WP plugin list` runs the whole string as a single command name in zsh and fails with `no such file or directory`.

To make examples work on the first try in both bash and zsh, either:

- **Invoke the wrapper as a full command** (recommended for agents):

  ```bash
  bash "{{SKILL_DIR}}/scripts/wp" --site=my-site plugin list
  ```

- **Or define a shell function wrapper** that forwards arguments correctly in both shells:

  ```bash
  wp() { bash "{{SKILL_DIR}}/scripts/wp" "$@"; }

  wp plugin list
  ```

Do **not** use a bare `$WP` variable to hold the command. If a variable is truly required in zsh, force word-splitting with `${=WP}` (e.g. `${=WP} plugin list`).

## Site Detection

The wrapper **auto-detects the site** by matching the current working directory against site paths in Local's `sites.json`. No site name argument is needed when the terminal is inside a Local site directory.

```bash
# Define a function wrapper (works in bash and zsh)
wp() { bash "{{SKILL_DIR}}/scripts/wp" "$@"; }

# Auto-detect (CWD must be inside a Local site directory)
wp plugin list
wp core version

# Explicit site override
wp --site=my-site plugin list

# List all sites with running/halted status
wp --list
```

**If auto-detection fails** (CWD is not inside any Local site) and no `--site=` is given, the script prints available sites. Ask the user which site to target, or use `--site=<name>`.

Completion criterion: A target site is explicitly resolved by auto-detection or `--site=<name>` before mutating commands are run.

## Requirements

- macOS (Apple Silicon or Intel)
- Local by Flywheel installed with sites in `~/Library/Application Support/Local/sites.json`
- WP-CLI installed and available in `PATH` (e.g. via `brew install wp-cli`)
- The target site **must be running** in Local (the site-specific php.ini only exists at runtime)

## Common Commands

```bash
# Define a function wrapper (works in bash and zsh)
wp() { bash "{{SKILL_DIR}}/scripts/wp" "$@"; }

# Plugin management
wp plugin list
wp plugin activate <slug>
wp plugin deactivate <slug>
wp plugin status <slug>

# Cache / transients
wp cache flush
wp transient delete --all

# Options
wp option get <key>
wp option update <key> <value>
wp option list --search="<pattern>"

# Database
wp db query "SELECT * FROM wp_options WHERE option_name LIKE '<pattern>%' LIMIT 10;"
wp db export backup.sql
wp db import backup.sql

# Eval PHP
wp eval 'echo get_option("siteurl");'
wp eval-file script.php

# Rewrites / cron
wp rewrite flush
wp cron event list
wp cron event run <hook>

# User / site info
wp user list
wp option get siteurl
wp core version
```

## Failure modes / recovery

- `WP-CLI not found`: Verify `wp --info` works in PATH, then retry wrapper command.
- `Site is not running`: Start the Local site first, then rerun command.
- `Auto-detection failed`: Run `wp --list` (or `bash "{{SKILL_DIR}}/scripts/wp" --list`), then rerun with `--site=<name>`.
- `Wrapper path issue`: Use absolute wrapper path from `{{SKILL_DIR}}/scripts/wp` and retry.

**Note:** The AI agent should always use the wrapper script, not direnv. The direnv setup is a convenience for the user's own interactive terminal sessions.

Completion criterion: Commands were executed through the wrapper, target site was explicit, and any failures were reported with the exact failing command.
