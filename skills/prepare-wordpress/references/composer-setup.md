# Composer Setup

## Dependencies

Install all PHP dev dependencies in one command (no pinned versions — Composer
resolves the latest compatible releases):

```sh
composer require --dev phpunit/phpunit brain/monkey wp-coding-standards/wpcs dealerdirect/phpcodesniffer-composer-installer pestphp/pest
```

### What each package does

| Package | Purpose |
| --- | --- |
| `phpunit/phpunit` | PHP unit testing framework |
| `brain/monkey` | Mocks WordPress core functions/hooks in unit tests (pulls in `mockery/mockery`) so tests run without a WordPress install |
| `wp-coding-standards/wpcs` | WordPress PHP Coding Standards ruleset for PHP_CodeSniffer |
| `dealerdirect/phpcodesniffer-composer-installer` | Auto-registers PHPCS standards (including WPCS) with Composer |
| `pestphp/pest` | Elegant PHP testing framework built on PHPUnit |

> **Latest versions:** Do not pin versions in `composer require`. Run
> `composer update` periodically to pick up new compatible releases.

For how to write unit tests with Brain Monkey, see `php-testing.md`.

## Scripts

Merge these scripts into `composer.json`. Do NOT overwrite existing scripts — only add missing keys.

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

> **Note:** The `check` script requires [Plugin Check (PCP)](https://wordpress.org/plugins/plugin-check/) to be installed and activated in the WordPress environment, and WP-CLI to be available. Install it with `wp plugin install plugin-check --activate`.

### How to merge via PHP (if jq is unavailable)

```sh
php -r '
$f = "composer.json";
$c = json_decode(file_get_contents($f), true);
$c["scripts"] = array_merge($c["scripts"] ?? [], [
    "test" => "phpunit",
    "lint" => "phpcs --standard=WordPress --extensions=php .",
    "check" => "wp plugin check <plugin-slug> --format=text"
]);
file_put_contents($f, json_encode($c, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n");
'
```
