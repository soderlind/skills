---
name: wp-org-review
description: "Prepare a WordPress plugin for the WordPress.org Plugin Directory review. Audits and fixes the findings the reviewer catches but local Plugin Check/PHPCS miss — suppressed sniffs, arbitrary-path writes, output escaping, readme contributors, bundled translations, and disallowed file writes. Use when submitting/resubmitting a plugin to wordpress.org, responding to a plugin review email, or hardening a plugin against Plugin Check."
compatibility: "WordPress plugin repos using PHPCS (WordPress standard), a .distignore or 10up deploy action, and optional Composer/npm build."
version: "1.2.0"
---

# WordPress.org Directory Review

## When to use

- Submitting or resubmitting a plugin to the WordPress.org Plugin Directory.
- Responding to a plugin review email / rejection with a findings list.
- Hardening a plugin so the reviewer's scan and Plugin Check both pass.

## Core principle

**Local Plugin Check / PHPCS silence is not review approval.** The reviewer re-scans
without honouring your inline `phpcs:ignore` comments, and checks things no static
sniff evaluates (contributor↔owner mapping, "writes to a disallowed location",
translation-file policy). Treat every `phpcs:ignore` as an *unreviewed* line, and
every human-only rule as invisible to your local tooling.

## Reviewer findings catalog

[reviewer-findings.md](references/reviewer-findings.md) is a generic RAG distilled from
real Plugin Directory review emails: every recurring finding (prefixing, location
constants, filesystem writes, unneeded files, out-of-date libraries, update checkers,
`register_setting` sanitization, textdomain, contributors, enqueuing, escaping,
trademarks, external-service disclosure, dead URLs, readme accuracy) with a detection
command and a fix for each. Consult it to map a review email's findings to fixes, and to
pre-empt the ones the reviewer will raise on the next pass.

## Procedure

### 0) Inventory the blind spots

Find everything local tooling was told to skip, or that it cannot see:

```sh
# Suppressed sniffs — each one is something the reviewer WILL re-flag.
grep -rn --include='*.php' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "phpcs:ignore\|phpcs:disable" .

# Filesystem writes (arbitrary-path / disallowed-location risk).
grep -rn --include='*.php' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "file_put_contents\|fopen\|fwrite\|fputs\|mkdir\|unlink\|file_get_contents" .

# Direct output that may be unescaped.
grep -rn --include='*.php' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "echo\|print\|printf\|<script\|<style" .
```

Map each hit to a category below. Fix real findings; for genuine false positives,
keep the ignore **but add a justification** after `--` so a human reviewer accepts it.

### 1) Suppressed sniffs → real fix or justified ignore

- If the sniff is correct, fix the code (see categories 2–3).
- If it is a true false positive, rewrite the ignore with a reason:
  `// phpcs:ignore Sniff.Code -- <why this is safe in this context>`.
  Bare ignores read as "hiding a problem"; justified ones read as "reviewed".

### 2) Filesystem writes (reviewer rule, NO sniff exists)

Plugins must never write to core dirs, other plugins/themes, their own folder, or
arbitrary user paths. Allowed: the database (Settings API), the media library, or a
plugin-slug subfolder under `wp_upload_dir()` resolved **at runtime**.

Pattern for a CLI/user-supplied output path — strip directory components and confine
to `uploads/<slug>/`, then write via `WP_Filesystem` (also clears the
`AlternativeFunctions` sniff):

```php
private function resolve_output_path( string $output ): string {
    $uploads = wp_upload_dir();
    if ( ! empty( $uploads['error'] ) ) {
        WP_CLI::error( (string) $uploads['error'] );
    }
    $dir = trailingslashit( $uploads['basedir'] ) . 'my-slug';
    if ( ! wp_mkdir_p( $dir ) ) {
        WP_CLI::error( "Could not create directory: {$dir}" );
    }
    $name = sanitize_file_name( basename( $output ) ); // discards traversal + dirs
    return trailingslashit( $dir ) . ( '' === $name ? 'output.json' : $name );
}

// Write:
require_once ABSPATH . 'wp-admin/includes/file.php';
WP_Filesystem();
global $wp_filesystem;
$wp_filesystem->put_contents( $file, $data, FS_CHMOD_FILE );
```

For "write anywhere" ergonomics, keep STDOUT and let the user shell-redirect
(`wp my-cmd > /any/path`) instead of accepting a path to write to.

### 3) Output escaping (context-correct, applied late)

| Context | Function |
| --- | --- |
| URLs | `esc_url()` |
| HTML attributes | `esc_attr()` |
| Text in HTML | `esc_html()` |
| Rich HTML | `wp_kses()` / `wp_kses_post()` |

Escape at the point of output, using the most restrictive fit.

**Inert `type="text/plain"` gated scripts:** `esc_html()` the inline body. It blocks a
`</script>` breakout in the served markup, and client code that reads `.textContent`
gets the entity-decoded original back — so activation is unaffected. Verify the
consumer uses `.textContent`/`.text` (decodes) and not `.innerHTML` before relying on this.

### 4) readme.txt contributors (server-side check, NO sniff)

`Contributors:` must include the **WordPress.org account that owns the slug** (from the
review email: "owner of the plugin '<username>'"). It is NOT the GitHub handle. List
only real wp.org usernames — a non-existent one triggers its own warning.

```text
Contributors: <wporg-owner-username>
```

### 5) Bundled translations (advisory, easy to miss locally)

`.po/.mo/.l10n.php/.json` are delivered by translate.wordpress.org after publishing;
shipping them is discouraged. Keep only the `.pot` template in the distributed zip.
Exclude the compiled files via `.distignore` (or your build's ignore list):

```text
/languages/*.po
/languages/*.mo
/languages/*.l10n.php
/languages/*.json
```

Ensure the plugin is properly internationalized so community translations flow in.

### 6) Other common reviewer catches

- Enqueue static/inline JS & CSS (`wp_enqueue_script/style`, `wp_add_inline_*`) instead
  of raw `<script>`/`<style>`. Genuinely-inert placeholder nodes are an exception —
  justify the ignore (category 1).
- No obfuscation / no bundled minified-only code without source or a build step.
- No calling home / loading remote code; assets served locally.
- Sanitize all input (`sanitize_*`, `wp_unslash`), verify nonces + capabilities on
  every state-changing request.
- `Requires at least`, `Requires PHP`, `Tested up to`, and `Stable tag` present and accurate.

## Verify

Run the project's real checks (not just your edited files) and confirm the harness did work:

```sh
./vendor/bin/phpcs --standard=phpcs.xml.dist .          # 0 errors/warnings
# If installed: Plugin Check
wp plugin check <slug>
# Build the ACTUAL distributed payload from a --no-dev tree and diff it,
# so .distignore exclusions are proven (dev trees hide missing files).
```

## Determinism checklist

1. Every `phpcs:ignore` is either removed by a real fix or carries a `--` justification.
2. No write targets core/plugin/theme/arbitrary paths; writes go to DB, media, or `uploads/<slug>/`.
3. Every echoed variable uses a context-correct escape applied at output.
4. `Contributors:` lists the real wp.org slug owner.
5. Distributed zip ships only `.pot`, not compiled translations.
6. `phpcs` (whole tree) passes and, if available, `wp plugin check` passes.
7. Report anything intentionally left as a justified false positive, with the reason.
