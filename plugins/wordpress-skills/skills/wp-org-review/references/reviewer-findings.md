# WordPress.org reviewer findings — generic catalog

A retrieval reference distilled from real Plugin Directory review emails. Each entry
is a finding the human reviewer (or their AI pre-scan) raises that local Plugin Check /
PHPCS often does **not** catch, or that authors routinely miss. Placeholders:
`myplugin` = display name, `my-plugin` = slug, `mypfx` = your chosen prefix (≥ 4 chars).

Use the detection commands to find every occurrence — the reviewer re-scans the whole
tree and expects *all* instances fixed, not only the ones they quoted.

---

## 1. Generic function / class / define / namespace / option names (prefixing)

**Reviewer rule.** Every global symbol you define — functions, classes, namespaces,
constants (`define`/`const`), options, transients, meta keys, hooks, shortcodes,
globals, cron event names, script/style handles, localized JS object names — must
carry a prefix unique to the plugin.

- Prefix must be **≥ 4 characters**. Two- and three-letter prefixes are rejected.
- Do **not** use `wp_`, `_`, or `__` as a prefix (reserved for core).
- Do **not** use a common word as the prefix (e.g. `ai`, `seo`, `wc`, `woo`) — it is
  treated as effectively unprefixed.
- Do **not** wrap definitions in `if ( ! function_exists() )` / `if ( ! class_exists() )`
  to dodge conflicts. If another plugin defines the name first and loads first, yours
  silently breaks. Reserve `*_exists()` guards for genuinely shared libraries.
- A PSR-4 namespace (`namespace My\Plugin;`) counts as a prefix **only** if the root
  segment is distinctive. Bare `namespace Settings;` or a common word fails.

**Detect.**

```sh
grep -rnE --include='*.php' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "function [a-z0-9_]+\(|^\s*(class|trait|interface) |namespace |define\(|const [A-Z]" .
grep -rnE --include='*.php' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "update_option\(|get_option\(|add_option\(|set_transient\(|get_transient\(" .
grep -rnE --include='*.php' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "wp_enqueue_(script|style)\(|wp_register_(script|style)\(|wp_localize_script\(" .
grep -rnE --include='*.php' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "add_shortcode\(|register_setting\(|wp_schedule_event\(|add_action\('wp_ajax_" .
```

**Fix.** Rename to `mypfx_*` (snake) / `Mypfx_*` (class) / a distinctive namespace root.
This also clears the PHPCS `WordPress.NamingConventions.PrefixAllGlobals.*` sniffs
(`NonPrefixedConstantFound`, `NonPrefixedHooknameFound`, etc.). Provide a migration for
renamed option keys so existing installs keep their data.

---

## 2. Determine file / directory / URL locations correctly

**Reviewer rule.** No hard-coded paths and no reliance on WordPress *internal* location
constants (`WP_PLUGIN_DIR`, `WP_CONTENT_DIR`, `ABSPATH`, `WPMU_PLUGIN_DIR`) to locate
your own plugin — these vary per install (custom `wp-content`, symlinks, multisite).

**Detect.**

```sh
grep -rnE --include='*.php' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "WP_PLUGIN_DIR|WP_CONTENT_DIR|WP_CONTENT_URL|plugins_url\(\)|__DIR__|ABSPATH" .
```

**Fix.** Anchor everything to `__FILE__` in the main file, saved into prefixed defines,
and derive paths/URLs from them:

```php
define( 'MYPFX_FILE', __FILE__ );
define( 'MYPFX_DIR',  plugin_dir_path( __FILE__ ) );
define( 'MYPFX_URL',  plugin_dir_url( __FILE__ ) );
// elsewhere:
require_once MYPFX_DIR . 'includes/thing.php';
wp_enqueue_script( 'mypfx-app', plugins_url( 'js/app.js', MYPFX_FILE ), array(), MYPFX_VERSION, true );
```

For the uploads dir use `wp_upload_dir()` resolved at runtime — never a hard-coded path.

---

## 3. Filesystem writes — where a plugin may write

**Reviewer rule (no PHPCS sniff exists).** Preferred order:

1. **Database** via the Settings API — especially for privileged data.
2. **Media library** via the media uploader, for user media.
3. **`uploads/<slug>/`** resolved at runtime with `wp_upload_dir()` (never hard-coded),
   creating a folder named with the plugin slug. If the data is not public, protect it
   from direct access.

Writing to the plugin's own folder, another plugin/theme, core dirs, or arbitrary
user-supplied paths is **not** allowed. Writing directly into `wp-content/` is
acceptable **only** when the plugin's nature genuinely requires it (caching drop-ins,
backup/migration storage) — and you should expect to justify it.

**Detect.**

```sh
grep -rnE --include='*.php' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "file_put_contents|fopen|fwrite|fputs|mkdir|unlink|rename\(|copy\(" .
```

**Fix.** Confine any user/CLI-supplied output path to `uploads/<slug>/`, stripping
directory components with `sanitize_file_name( basename( $path ) )`, and write through
`WP_Filesystem` (which also clears `WordPress.WP.AlternativeFunctions`). For
"write anywhere" ergonomics in a CLI command, print to STDOUT and let the user redirect.

---

## 4. Included unneeded folders / not-permitted files

**Reviewer rule.** The distributed zip should contain only what production needs:
`php/js/css/txt/md`, some media (`png/svg/jpg`), and data files (`json/xml`).
Flagged as unneeded: dev tooling, `node_modules`, `bower_components`, build/release
scripts, demos, unit tests, caches (`.phpunit.cache`, `.phpunit.result.cache`),
CI/meta folders (`.github`, `.wordpress-org`), and any unusual file types.

Exceptions: readable source you ship to comply with the human-readable-code guideline,
and config files needed to rebuild assets (`composer.json`, `package.json`, etc.) —
keep those.

**Detect / fix.** Ship with a `.distignore` (or 10up action ignore list) and build the
archive with `wp dist-archive`. Verify the produced zip, not your dev tree:

```sh
grep -rlE "\.phpunit|node_modules|\.github|\.wordpress-org|tests?/" . | grep -v vendor
# then build the real payload from a --no-dev tree and inspect it
```

---

## 5. Out-of-date bundled libraries

**Reviewer rule.** Any bundled third-party library must be on its latest **stable**
version (no betas/RCs) for security and support.

**Fix.** Bump the dependency (`composer update vendor/lib`), rebuild `vendor/`, re-verify
the version actually shipped in the zip.

---

## 6. Update checkers / calling home for updates

**Reviewer rule.** Plugins hosted on WordPress.org must not bundle self-update code or
contact external servers for updates (e.g. `plugin-update-checker`, custom updater
endpoints). Updates are provided by WordPress.org hosting; interfering with the built-in
updater is prohibited.

**Detect.**

```sh
grep -rniE "plugin-?update-?checker|PucFactory|pre_set_site_transient_update_plugins|puc_" . 
```

**Fix.** Remove the updater library and any `Update URI:` header pointing off-wordpress.org.
Keep such code only in a separate, non-directory build if you also distribute privately.

---

## 7. `register_setting()` sanitization

**Reviewer rule.** Every `register_setting()` call must declare a `sanitize_callback`.

**Fix.**

```php
register_setting( 'mypfx_group', 'mypfx_option', array(
    'type'              => 'string',
    'sanitize_callback' => 'sanitize_text_field', // or a custom callback for arrays
) );
```

For array/object options, write a dedicated callback that sanitizes each field; the
built-in scalar sanitizers are not enough.

---

## 8. `load_plugin_textdomain()` no longer needed (since WP 4.6)

**Reviewer rule.** For directory-hosted plugins, WordPress auto-loads translations by
slug; an explicit `load_plugin_textdomain()` is unnecessary. If you keep it to support
older WP, it must run on `init` (not earlier) to avoid the "loaded too early" notice.

**Detect / fix.**

```sh
grep -rn "load_plugin_textdomain" . 
```

Remove the call (and its `/languages` argument) unless you support pre-4.6; if kept,
hook it on `init`.

---

## 9. Contributors list in `readme.txt`

**Reviewer rule.** `Contributors:` is a case-sensitive, comma-separated list of
**WordPress.org usernames**. It must include the account that **owns the slug** (named
in the review email as the owner of `my-plugin`) — this is the wp.org username, not a
GitHub handle. Listing a non-existent username triggers its own warning.

**Fix.**

```text
Contributors: your-wporg-username
```

---

## 10. Enqueue scripts and styles (no raw tags)

**Reviewer rule.** Include JS/CSS through the enqueue API, not raw `<script>` / `<style>`
blocks echoed into markup.

- Files: `wp_register_script()` / `wp_enqueue_script()`, `wp_register_style()` /
  `wp_enqueue_style()`.
- Inline: `wp_add_inline_script()` / `wp_add_inline_style()` attached to a registered
  handle.
- Admin pages: use `admin_enqueue_scripts`.
- `async`/`defer` and other attributes are supported natively since WP 6.3 / 5.7.

**Detect.**

```sh
grep -rnE --include='*.php' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "<script|<style" .
```

**Fix.** Move code into enqueued files or inline-attach it. A genuinely inert
placeholder node (e.g. `type="text/plain"` read later via `.textContent`) is an
exception — keep it but justify the `phpcs:ignore` with a `--` reason and escape the body.

---

## 11. Output escaping

**Reviewer rule.** Every dynamic value must be escaped at the point of output, using the
most restrictive function for the context, applied as late as possible.

| Context | Function |
| --- | --- |
| URLs | `esc_url()` |
| HTML attributes | `esc_attr()` |
| Text inside HTML | `esc_html()` |
| Rich / raw HTML | `wp_kses()`, `wp_kses_post()` |

```php
echo '<a href="' . esc_url( $link ) . '" class="' . esc_attr( $cls ) . '">'
   . esc_html( $label ) . '</a>';
```

**Detect.**

```sh
grep -rnE --include='*.php' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "echo|print|printf|<\?=" .
grep -rn --include='*.php' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "EscapeOutput.OutputNotEscaped" .   # each phpcs:ignore is a re-flag
```

**Fix.** Escape the variable, not the literal. For inline script/JSON payloads that are
output verbatim, escape or validate the value so injected markup (e.g. a `</script>`
breakout) cannot reach the page even if untrusted input reaches the source. A bare
`phpcs:ignore WordPress.Security.EscapeOutput.*` reads as hiding a problem — fix it or
add a `--` justification.

---

## 12. Trademarks / project names in the plugin name and slug

**Reviewer rule (AI pre-scan + human).** The display name and slug must not use a
trademark or another project's name in a way that implies affiliation.

- A trademark at the **start** of the name/slug implies false affiliation → rejected.
- A trademark elsewhere without a clear "unaffiliated" structure → still problematic.
- No altered forms / portmanteaus of a trademark (e.g. `SomethingPress`).
- Safer pattern: put the trademark at the **end**, after `for` or `with`, and lead with
  your own distinctive coined term or brand.
- Adding a generic word (`Advanced`, `Simple`) or a couple of letters does **not** fix a
  similarity/trademark problem; the distinguishing term must be genuinely distinctive and
  at the **beginning**.

If you use a third-party service, also disclose non-affiliation and link its terms /
privacy (see §13). If a change is requested, state your desired **permalink/slug**
explicitly in the reply — the slug cannot change after approval, and renaming the display
name alone is not enough.

---

## 13. External / third-party services disclosure

**Reviewer rule (Guideline 6).** If the plugin contacts any remote service — even one you
operate yourself — you must disclose it in `readme.txt`, in plain language, covering:
what the service is and what it is used for, what data is sent and when, and links to the
service's **terms of service** and **privacy policy**.

**Detect.**

```sh
grep -rnE --include='*.php' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "wp_remote_(get|post|request)|curl_|file_get_contents\('https?://|https?://[a-z0-9.-]+/" .
```

**Fix.** Add an `== External services ==` section to `readme.txt`:

```text
== External services ==

This plugin connects to <Service> to <purpose>.
It sends <what data> to <endpoint> when <trigger/condition>.
This service is provided by <Provider>: <terms of service URL>, <privacy policy URL>.
```

Verify the linked terms/privacy URLs resolve. Never track users without explicit consent
(Guidelines 7 & 9), and don't load remote code or hijack the admin dashboard (Guideline 11).

---

## 14. Valid, public URLs in headers and readme

**Reviewer rule.** URLs the reviewer can fetch — `Plugin URI:`, `Author URI:`, and any
repository/doc links in `readme.txt` — must return 200, not 404. Private repos or
not-yet-pushed doc files fail.

**Detect / fix.**

```sh
grep -rnhoE --include='*.php' --include='readme.txt' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "https?://[^ )\"'<>]+" . | sort -u | while read u; do
  printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' -L "$u")" "$u"
done
```

Fix or remove any non-200 URL (and confirm the repo/branch/path exists and is public).

---

## 15. Readme clarity and header accuracy

**Reviewer rule.** The `readme.txt` must clearly explain what the plugin does and how to
configure/use it, so anyone can set it up from scratch. Install instructions must match
the current slug (a stale `/wp-content/plugins/old-slug` path is flagged as unclear).
Required headers must be present and accurate: `Stable tag`, `Requires at least`,
`Requires PHP`, `Tested up to`, `License` (GPL-compatible), `License URI`.

**Detect / fix.**

```sh
grep -nE "^(Stable tag|Requires at least|Requires PHP|Tested up to|License|License URI|Contributors):" readme.txt
grep -n "wp-content/plugins/" readme.txt   # slug must match
```

---

## Quick self-audit before (re)submitting

```sh
# Suppressed sniffs — each is something the reviewer will re-flag.
grep -rn --include='*.php' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "phpcs:ignore\|phpcs:disable" .

# Prefixing / naming, location constants, filesystem writes, remote calls, raw tags.
grep -rnE --include='*.php' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "WP_PLUGIN_DIR|WP_CONTENT_DIR|__DIR__" .
grep -rnE --include='*.php' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "file_put_contents|fopen|fwrite|mkdir|unlink" .
grep -rnE --include='*.php' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "wp_remote_|curl_|https?://" .
grep -rnE --include='*.php' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "<script|<style" .
grep -rn  --include='*.php' --exclude-dir={vendor,node_modules,.git,tests,dist,build} "load_plugin_textdomain\|plugin-update-checker" .

# Then run the real checks and build the real payload.
./vendor/bin/phpcs --standard=phpcs.xml.dist .
wp plugin check my-plugin      # if installed
wp dist-archive . && unzip -l my-plugin.zip   # inspect the actual shipped files
```

Remember: local silence is not approval. The reviewer re-scans the whole tree without
honouring your `phpcs:ignore` comments, checks human-only rules (contributor↔owner,
trademarks, external-service disclosure, write locations), and expects **every**
occurrence fixed — not just the lines they quoted.
