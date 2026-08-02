# PHP Mutation Testing Setup

Two engines, chosen by the rule in step 2 of [SKILL.md](../SKILL.md). Configure one, never both.

## Prerequisite: a coverage driver

Both engines need line coverage. Verify before anything else:

```sh
php -r 'echo extension_loaded("pcov") ? "pcov\n" : ""; echo extension_loaded("xdebug") ? "xdebug mode=" . ini_get("xdebug.mode") . "\n" : "";'
```

- **PCOV** — fastest for coverage-only work. `pecl install pcov`, then `extension=pcov.so`.
- **Xdebug 3+** — must include `coverage` in the mode. `xdebug.mode=coverage` (or
  `develop,coverage`). An Xdebug installed in `debug` mode only cannot enable coverage, so
  Pest aborts with `InvalidOption: Mutation testing requires code coverage to be enabled`.

Set it per-run without touching php.ini:

```sh
XDEBUG_MODE=coverage vendor/bin/pest --mutate
```

### PCOV silently scopes coverage to the wrong directory

PCOV only instruments files under `pcov.directory`. When the setting is left unset PCOV
auto-detects it, and in a WordPress plugin it frequently picks an asset folder such as
`lib/` or `assets/` instead of the PHP source. Every file then reports **0.0%**, and with
`--covered-only` the mutation run reports **zero mutants and exits cleanly**. Check it
before trusting any coverage number:

```sh
php -i | grep -i '^pcov.directory'
```

If it does not point at the PHP source directory, override it per run:

```sh
php -d pcov.directory=includes vendor/bin/pest --coverage
```

`pcov.directory` is `PHP_INI_SYSTEM`. `ini_set()` returns `false` for it, so a `<php><ini>`
block in `phpunit.xml` cannot fix it — the override must come from `php -d`, `php.ini`, or
a file in `PHP_INI_SCAN_DIR`. `ini_get("pcov.directory")` returns an empty string while the
setting is unset, so it cannot be used to discover the auto-detected path either; only
`php -i` reports the resolved value. Simplest rule: always pass `-d pcov.directory=` and
never rely on auto-detection.

## Pest (>= 3.0)

Pest has mutation testing built in — no extra package.

### Scoping

Pest generates mutations only for classes a test declares:

```php
covers( Acme\Plugin\Settings_Repository::class );
// or, without affecting the coverage report:
mutates( Acme\Plugin\Settings_Repository::class );

it( 'stores the option under the plugin prefix', function () {
    // ...
} );
```

`covers()` also filters the coverage report to the referenced code. `mutates()` affects
mutation scoping only. Otherwise identical.

Without `covers()` / `mutates()` anywhere, Pest generates nothing — and unlike a missing
coverage driver, this failure is silent: the run exits cleanly having tested nothing. It is
the most common setup mistake.

### Pest commands

```sh
# Standard run — serial by default, see the --parallel warning below
vendor/bin/pest --mutate --covered-only

# No covers() in the suite: scope by path, not --everything
php -d pcov.directory=includes vendor/bin/pest --mutate --path=includes --covered-only

# Narrow to one class while validating the loop
vendor/bin/pest --mutate --class="Acme\Plugin\Settings_Repository"

# Re-check a single survivor after adding an assertion
vendor/bin/pest --mutate --id=76d17ad63bb7c307
```

Re-running by `--id` requires the same options as the original run.

### `--everything` cannot see WordPress-named class files

`--everything` enumerates classes through Composer's PSR-4 map. WordPress naming
(`class-acme-plugin-utils.php` for `Acme_Plugin_Utils`) does not satisfy PSR-4, so those
files resolve only through a `classmap` entry — which `--everything` does not read. The run
reports `0 Mutations for 0 Files created` and exits 0.

Measured on a 13-file plugin whose `composer.json` declared both a PSR-4 prefix and a
`classmap` for `includes/`:

| Command | Mutants created |
| --- | --- |
| `--mutate --everything --covered-only` | 0 |
| `--mutate --path=includes --covered-only` | 1203 (9 files) |
| `--mutate --class="…\Acme_Plugin_Utils" --covered-only` | 10 (1 file) |

Use `--path=` for any plugin that does not name files after their classes. Treat
`0 Mutations for 0 Files created` as a setup failure, never as a pass.

### `--parallel` is not safe by default

Two failure modes, both of which produce a plausible-looking but wrong number:

1. **Ini overrides do not reach the workers.** Pest spawns workers as new `php` processes,
   which inherit `php.ini` and the environment but not `-d` flags. With
   `php -d pcov.directory=… --parallel` the workers collect no coverage, so `--covered-only`
   discards every mutant and the run reports a score of 0.00% over 0 mutations. Propagate
   the setting through `PHP_INI_SCAN_DIR` (env vars are inherited) rather than `-d`.
2. **Mutants time out and time-outs score as killed.** On the same class, serial reported
   `4 untested, 6 tested — 60.00%`, while parallel reported `9 timeout, 1 tested — 100.00%`.
   The parallel score was a false pass that hid all four survivors.

Run serially while establishing a baseline. Only adopt `--parallel` after confirming it
reproduces the serial score on one class.

### Useful options

| Option | Use |
| --- | --- |
| `--parallel` | Multiple processes. Verify it matches the serial score first — see above. |
| `--covered-only` | Only mutate lines the tests already reach. Cuts noise and runtime. |
| `--path=` | Scope by file or directory. The reliable choice for WordPress file naming. |
| `--everything` | Bypass `covers()`. PSR-4 classes only — see the warning above. |
| `--class=` / `--ignore=` | Narrow or exclude by class or namespace. |
| `--min=60` | Fail below the threshold. Use for the ratchet. |
| `--ignore-min-score-on-zero-mutations` | Stops CI failing on a run that generated nothing. |
| `--bail` / `--stop-on-untested` / `--stop-on-uncovered` | Fast feedback while iterating. |
| `--retry` | Run previous survivors first, stop on the first one. |
| `--profile` | Ten slowest mutations. Use when a run overruns its budget. |
| `--clear-cache` / `--no-cache` | Pest caches aggressively; clear when results look stale. |

### Suppressing an equivalent mutant in Pest

```php
// Inline
'email' => 'required|email', // @pest-mutate-ignore -- format string, no behaviour to assert

/**
 * @pest-mutate-ignore -- WordPress-reserved keys, values are structural
 */
protected $guarded = [ 'id', 'created_at' ];
```

Non-executable lines always report as **not covered**; the docblock form is the way to
silence property declarations.

### Pest Composer script

```json
{
  "scripts": {
    "test:mutate": "pest --mutate --parallel --covered-only"
  }
}
```

## Infection

For PHPUnit-only suites, or when the Pest procedural gap (step 3) makes Pest the wrong tool.

```sh
composer require --dev infection/infection
```

### Brain Monkey and Infection do not work together

This is the most damaging failure mode in this document, because it produces a *plausible*
result rather than an error. If the suite calls `Brain\Monkey\setUp()`, do not trust
Infection's output at all.

Two symptoms, depending on the project:

- Infection runs the initial test suite, generates coverage, prints
  `Processing source code files...`, then **exits 0 with no summary and no log file**.
- Or it completes and reports **every covered mutant as escaped, MSI 0%**.

Reproduced in a two-class scratch project with two PHPUnit tests, changing one variable:

| Scratch project | Result |
| --- | --- |
| No Brain Monkey | 4 killed / 1 escaped — Covered MSI **80%** |
| `brain/monkey` installed but never called | 4 killed / 1 escaped — Covered MSI **80%** |
| `Monkey\setUp()` / `Monkey\tearDown()` called in the tests | 0 killed / 5 escaped — Covered MSI **0%** |

The last row was reproduced twice, identically. Installing the package is harmless;
*activating* it is what breaks the run. In a real plugin whose every test extends a
Brain Monkey `TestCase`, the run aborted silently instead — and only the directories that
actually had coverage aborted, which is the tell that the failure is in *executing*
mutants rather than parsing them.

Brain Monkey activates Patchwork, which rewrites includes. The mutated file Infection
writes into its sandbox appears not to be the one that ends up executing, so the mutant
never takes effect and is scored as a survivor. The precise mechanism was not verified
further, but the observable behaviour above is consistent and repeatable.

**What to do:** use Pest's native `--mutate` instead. Pest mutates in-process and is
unaffected — a Brain Monkey plugin scored 321 killed out of 1203 mutants under Pest, so
mutants demonstrably apply. If the suite is PHPUnit-only and uses Brain Monkey, report
that PHP mutation testing is blocked rather than reporting a score.

### `infection.json5`

```json5
{
  $schema: "vendor/infection/infection/resources/schema.json",
  source: {
    directories: ["src", "includes"],
    excludes: [
      "**/views/**",
      "**/templates/**",
      "**/vendor/**"
    ]
  },
  mutators: {
    "@default": true
  },
  logs: {
    text: "build/infection/infection.log",
    html: "build/infection/infection.html",
    summary: "build/infection/summary.log"
  },
  phpUnit: {
    configDir: "."
  },
  timeout: 10,
  tmpDir: "build/infection"
}
```

Directory-based scoping is the reason Infection reaches procedural WordPress code that Pest
cannot. Exclude view and template partials explicitly — mutating markup produces survivors
nobody should chase.

Add `build/infection` and `.infection.cache` to `.gitignore`.

### Infection commands

```sh
# Standard run
vendor/bin/infection --threads=max --show-mutations

# Against a Pest suite
vendor/bin/infection --threads=max --test-framework=pest

# Ratchet
vendor/bin/infection --threads=max --min-msi=60 --min-covered-msi=75

# Narrow while validating the loop
vendor/bin/infection --threads=max --filter=src/Settings_Repository.php

# Only code changed against a base branch
vendor/bin/infection --threads=max --git-diff-filter=AM --git-diff-base=main
```

`--git-diff-*` is the practical way to run Infection in CI on a large plugin: mutate only
what the pull request touched.

### Suppressing an equivalent mutant in Infection

```php
/**
 * @infection-ignore-all -- cache key format, no observable behaviour
 */
private function cache_key( int $post_id ): string {
    return self::PREFIX . $post_id;
}
```

### Infection Composer script

```json
{
  "scripts": {
    "test:mutate": "infection --threads=max --show-mutations"
  }
}
```

## WordPress-specific notes

- Run against **system PHP** with `vendor/bin/*`. Do not route through the `wp-cli-local`
  wrapper — that targets a running Local by Flywheel site; unit tests run against Composer
  dev dependencies.
- Exclude the main plugin file. Its header comment and bootstrap produce mutants with no
  meaningful assertion, and mutating the `Version:` header is pure noise.
- Exclude `uninstall.php`. It is only ever executed by WordPress during deletion.
- If the suite uses `WP_UnitTestCase`, re-read step 4 of [SKILL.md](../SKILL.md) before
  starting anything wider than a single class.
