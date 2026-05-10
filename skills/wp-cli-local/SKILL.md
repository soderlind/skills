---
name: wp-cli-local
description: "Run WP-CLI commands against any Local by Flywheel site. Use when the user says 'wp-cli', 'run wp', 'use wp-cli', 'activate plugin', 'deactivate plugin', 'flush cache', 'wp option', 'wp transient', 'wp db', 'wp eval', 'wp cron', 'wp rewrite', or any request involving WordPress CLI commands."
---

# WP-CLI for Local by Flywheel

Run WP-CLI commands against Local sites using the wrapper script bundled with this skill.

**Never run bare `wp` commands.** Always use the wrapper:

```bash
bash {{SKILL_DIR}}/scripts/wp <wp-cli-command...>
```

## Site Detection

The wrapper **auto-detects the site** by matching the current working directory against site paths in Local's `sites.json`. No site name argument is needed when the terminal is inside a Local site directory.

```bash
WP="bash {{SKILL_DIR}}/scripts/wp"

# Auto-detect (CWD must be inside a Local site directory)
$WP plugin list
$WP core version

# Explicit site override
$WP --site=my-site plugin list

# List all sites with running/halted status
$WP --list
```

**If auto-detection fails** (CWD is not inside any Local site) and no `--site=` is given, the script prints available sites. Ask the user which site to target, or use `--site=<name>`.

## Requirements

- macOS (Apple Silicon or Intel)
- Local by Flywheel installed with sites in `~/Library/Application Support/Local/sites.json`
- WP-CLI installed and available in `PATH` (e.g. via `brew install wp-cli`)
- The target site **must be running** in Local (the site-specific php.ini only exists at runtime)

## Common Commands

```bash
WP="bash {{SKILL_DIR}}/scripts/wp"

# Plugin management
$WP plugin list
$WP plugin activate <slug>
$WP plugin deactivate <slug>
$WP plugin status <slug>

# Cache / transients
$WP cache flush
$WP transient delete --all

# Options
$WP option get <key>
$WP option update <key> <value>
$WP option list --search="<pattern>"

# Database
$WP db query "SELECT * FROM wp_options WHERE option_name LIKE '<pattern>%' LIMIT 10;"
$WP db export backup.sql
$WP db import backup.sql

# Eval PHP
$WP eval 'echo get_option("siteurl");'
$WP eval-file script.php

# Rewrites / cron
$WP rewrite flush
$WP cron event list
$WP cron event run <hook>

# User / site info
$WP user list
$WP option get siteurl
$WP core version
```

**Note:** The AI agent should always use the wrapper script, not direnv. The direnv setup is a convenience for the user's own interactive terminal sessions.
