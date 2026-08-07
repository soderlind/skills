# WordPress Copilot Coding Instructions

This phase adds a project-scoped Copilot instructions file so agents follow
WordPress coding, security, i18n, performance, and testing best practices.

Source: [github/awesome-copilot](https://github.com/github/awesome-copilot/blob/main/instructions/wordpress.instructions.md)
(MIT License). Prefer downloading the canonical file so it stays current.

## Preferred: download the latest

```sh
mkdir -p .github/instructions
curl -fsSL https://raw.githubusercontent.com/github/awesome-copilot/main/instructions/wordpress.instructions.md \
  -o .github/instructions/wordpress.instructions.md
```

The `applyTo` frontmatter in that file scopes the rules to WordPress plugin,
theme, PHP, JS, and CSS paths automatically.

## Fallback: create manually (offline)

If `curl` is unavailable, create `.github/instructions/wordpress.instructions.md`
with the content below. This is a condensed version adapted from
github/awesome-copilot (MIT); replace it with the canonical file when online.

````markdown
---
applyTo: 'wp-content/plugins/**,wp-content/themes/**,**/*.php,**/*.inc,**/*.js,**/*.jsx,**/*.ts,**/*.tsx,**/*.css,**/*.scss,**/*.json'
description: 'Coding, security, and testing rules for WordPress plugins and themes'
---

# WordPress Development — Copilot Instructions

Generate WordPress code that is secure, performant, testable, and compliant with
official WordPress practices. Prefer hooks, small functions, and clear separation
of concerns.

## Core principles
- Never modify WordPress core. Extend via actions and filters.
- Guard entry PHP files with `defined('ABSPATH') || exit;` and a plugin header.
- Use unique prefixes or PHP namespaces to avoid global collisions.
- Enqueue assets; never inline raw `<script>`/`<style>` in PHP templates.
- Make user-facing strings translatable with the correct text domain.

## Coding standards
- Follow WordPress Coding Standards (WPCS); write DocBlocks for public APIs.
- PHP: prefer strict comparisons (`===`, `!==`); target the project's PHP version.
- JS: match WordPress JS style; prefer `@wordpress/*` packages for block/editor code.
- Lint PHP with `phpcs`/`phpcbf` (WPCS) and JS with ESLint (`@wordpress/eslint-plugin`).

## Security & data handling
- Escape on output: `esc_html()`, `esc_attr()`, `esc_url()`, `wp_kses_post()`.
- Sanitize on input: `sanitize_text_field()`, `sanitize_email()`, `absint()`, etc.
- Verify nonces (`wp_verify_nonce()` / `check_admin_referer()`) and capabilities
  (`current_user_can()`) for every write (forms, AJAX, REST).
- Database: always use `$wpdb->prepare()` with placeholders; never concatenate input.
- Uploads: validate type and use `wp_handle_upload()` / `media_handle_upload()`.

## Internationalization
- Wrap user-visible strings: `__()`, `_x()`, `esc_html__()` with the text domain.
- Load translations with `load_plugin_textdomain()` / `load_theme_textdomain()`.
- Keep a `.pot` in `/languages` and use the domain consistently.

## Performance
- Defer heavy logic to specific hooks; avoid expensive work on `init`.
- Use transients or object caching for expensive queries; plan invalidation.
- Enqueue only what you need, conditionally (front vs admin; specific screens).

## REST API
- Register with `register_rest_route()`; always set a `permission_callback`.
- Validate/sanitize args via the `args` schema; return `WP_REST_Response`.

## Blocks & editor
- Use `block.json` + `register_block_type()` and `@wordpress/*` packages.
- Provide server render callbacks for dynamic blocks.

## Testing
- PHP unit: mock WordPress with Brain Monkey (`brain/monkey`) + PHPUnit/Pest;
  test sanitization, capability checks, REST permissions, and hooks.
- PHP integration: use the WordPress test suite (`WP_UnitTestCase`) with factories.
- JavaScript: use Vitest (`vitest run`).
- E2E: use Playwright for editor/front-end journeys.

## Checklist
- Unique prefixes/namespaces; no accidental globals.
- Nonce + capability checks for any write action.
- Inputs sanitized; outputs escaped.
- User-visible strings wrapped in i18n with the correct text domain.
- Assets enqueued via APIs (no inline script/style).
- Tests added/updated; code passes PHPCS (WPCS) and ESLint.
- Never concatenate untrusted input into SQL; always prepare queries.
````
