# Changelog

All notable changes to `wordpress-skills` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
