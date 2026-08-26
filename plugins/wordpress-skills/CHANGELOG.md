# Changelog

All notable changes to `wordpress-skills` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-08-26

### Added

- wp-org-review: prepare a plugin for the WordPress.org Plugin Directory review — audits suppressed sniffs, arbitrary-path writes, output escaping, readme contributors, and bundled translations that Plugin Check/PHPCS miss.

## [1.2.0] - 2026-08-08

### Changed

- prepare-wordpress: installs agent skills from WordPress/agent-skills (the former automattic/agent-skills repo is archived).
- prepare-wordpress: default skill install trimmed to essentials (wp-plugin-development, wp-wpcli-and-ops); wp-block-development, wp-performance, and wordpress-router are now optional.

## [1.1.0] - 2026-08-08

### Added

- prepare-wordpress: unit tests mock WordPress with Brain Monkey (brain/monkey); added references/php-testing.md and PHPUnit test scaffolding (phpunit.xml.dist, tests/bootstrap.php, tests/TestCase.php).
- prepare-wordpress: ESLint (@wordpress/eslint-plugin) and a committed phpcs.xml ruleset via a new linting-setup.md reference.
- prepare-wordpress: new instructions phase downloads the github/awesome-copilot WordPress coding instructions.

### Changed

- prepare-wordpress: Composer and npm dependencies install the latest compatible releases (unpinned).
- prepare-wordpress: composer.json is written as a file instead of via composer init with user-provided strings.

## [1.0.0] - 2026-08-07

### Added

- Initial release bundling the prepare-wordpress, wp-bump, wp-cli-local, wp-mutate, and wp-pcp-local skills as an Agent Plugin.
