---
name: wp-mutate
description: "Run mutation testing on WordPress plugins and themes to find weak tests — Pest --mutate or Infection for PHP, StrykerJS for JavaScript — then triage surviving mutants into concrete test improvements."
compatibility: "WordPress plugin/theme projects with an existing PHP test suite (Pest 3+ or PHPUnit) and/or JS tests (Vitest or Jest). Requires Xdebug 3+ with coverage mode or PCOV for PHP."
version: "1.0.0"
---

# WP Mutate

Mutation testing changes your source code in small ways and re-runs the tests. If the
suite still passes, the mutant **survived** — the code path is executed but nothing
asserts its behaviour. Line coverage says the code ran; mutation testing says the tests
would notice if it broke.

## When to use

Use this skill when:

- Test coverage looks healthy but bugs still ship.
- You want to know whether tests actually assert behaviour or just execute lines.
- You need evidence that security controls (capability checks, nonces, sanitization) are
  genuinely tested.
- You want a regression ratchet on test quality, not just test quantity.

Do not use this skill to create a test suite from scratch. If there are no tests, stop and
point the user at `wp-prepare`.

## Inputs required

- Repo root (current working directory).
- Nothing else. Everything is detected; each decision that follows is reported before it is acted on.

## Determinism checklist

Before declaring this skill run complete:

1. Scope fixed: inputs and target files are explicit.
2. Read-first: inspect current state before edits.
3. Plan-first: preview actions before writes when tooling supports it.
4. Confirm-before-write: get user confirmation before destructive or broad writes.
5. One step, one done-test: each step has a checkable completion criterion.
6. Verify outcomes: run the smallest available validation commands.
7. Report skips: list what was skipped and why.
8. Stop on blockers: capture exact failing command and error summary.

Never modify source code under test. This skill changes **test files and configuration only**.

## Vocabulary

Three engines use three different words for the same things. Always report using the
canonical terms below and translate at the boundary. Full table in
[glossary.md](references/glossary.md).

| Canonical | Meaning | Action |
| --- | --- | --- |
| **Killed** | The suite failed on the mutated code. | None. This is the goal. |
| **Survived** | The suite executed the mutated line and still passed. | Strengthen an assertion. |
| **Not covered** | No test executes that line at all. | Write a test. Not a mutation problem. |
| **Timed out / errored** | Counted as killed, per Infection and Stryker convention. | None. |

Trap: Pest prints **untested** for what Infection calls **escaped** and Stryker calls
**survived**. Pest's "untested" does *not* mean "no test exists" — that is Pest's
"uncovered".

Always report **two** scores, never one:

- **Mutation score** = killed / all mutants (not-covered counts against you).
- **Covered-code score** = killed / mutants on covered lines only.

A plugin with 20% coverage can post a flattering covered-code score. Quoting one number
without the other misrepresents the suite.

## Procedure

### 0) Detect the stack

```sh
node {{SKILL_DIR}}/scripts/detect_mutation_setup.mjs
```

The script is read-only. It emits JSON plus a summary covering: PHP engine, Pest version,
suite type, source/procedural file counts, coverage driver, JS runner, and existing configs.

Do not re-derive any of this by ad-hoc grepping. The script exists so that two runs on the
same repo classify the project identically.

Completion criterion: Detection JSON is captured before any other step.

### 1) Gate on prerequisites

Stop with the exact fix, do not continue, if any of these hold:

| Condition | Why it is a hard stop |
| --- | --- |
| `php.driver` is `none` | Pest mutation and Infection both need line coverage. Pest aborts with `Pest\Exceptions\InvalidOption: Mutation testing requires code coverage to be enabled`; Infection reports no covered code. Fix: install PCOV, or set `xdebug.mode=coverage` — an installed Xdebug in `debug` mode only is not enough. |
| `php.engine` is `none` **and** `js.runner` is `none` | Nothing to mutate. Point at `wp-prepare`. |
| The plain test suite is failing | Mutation testing on a red suite is meaningless — every mutant reads as killed. |
| `js.runner` is `unsupported` (mocha/karma only) | Without a supported runner there is no per-test coverage analysis, so every mutant runs the whole suite. Report and skip the JS phase; do not fall back to Stryker's `command` runner. |

PHP binary: use system `php` with the project's `vendor/bin/*`. Do **not** route this
through the `wp-cli-local` wrapper — that wrapper targets a running Local by Flywheel site,
whereas unit tests run against Composer dev dependencies.

Completion criterion: Every gate is evaluated and either passed or reported as a stop.

### 2) Choose the PHP engine

Apply this rule exactly:

1. `pestphp/pest` **>= 3.0** → **Pest** `--mutate`. (Mutation testing landed in Pest 3; treat Pest 1 and 2 as "no Pest".)
2. `pestphp/pest` **< 3.0** → offer to upgrade Pest. If declined, fall back to Infection.
3. No Pest, PHPUnit-only suite → **Infection** (`infection/infection`, `infection.json5`).
4. No PHP test suite → skip the PHP phase.

**Hard stop: Infection + Brain Monkey.** If the engine resolves to Infection *and*
`brain/monkey` is a dev dependency that the tests actually activate, stop and report that
PHP mutation testing is blocked. Brain Monkey activates Patchwork, and Infection's mutants
then fail to take effect: the run either exits 0 with no summary and no log, or reports
every covered mutant as escaped at MSI 0%. Both look like ordinary output, which is what
makes this dangerous. Offer Pest instead — Pest mutates in-process and is unaffected.
Evidence and the minimal reproduction are in [php-setup.md](references/php-setup.md).

Never migrate a PHPUnit suite to Pest to unlock mutation testing. Rewriting a test suite's
framework to obtain a metric is a bad trade; Infection runs against PHPUnit directly.

Never run two engines in one project — two score definitions produce incomparable reports.

Setup details for both engines: [php-setup.md](references/php-setup.md).

Completion criterion: One PHP engine is selected and the rule branch is stated.

### 3) Report the Pest procedural gap

Pest scopes mutations by **class**: `covers(Foo::class)`, `mutates(Foo::class)`,
`--class=`, and `--everything` means "all of your project's *classes*". A file of
`add_action()` calls and global functions is invisible to it. Infection scopes by
**directory**, so it reaches procedural code.

If the engine is Pest and `php.proceduralFiles > 0`, report the measurement verbatim:

> 12 of 31 in-scope PHP files (39%) declare no class and cannot be mutated by Pest.
> Switch to Infection to cover them, or continue with Pest for the 19 class files.

Then let the user choose. Do not auto-switch on a hidden threshold — that makes the skill's
behaviour unpredictable across similar projects.

A second, sharper limit: Pest's `--everything` enumerates classes through Composer's PSR-4
map. WordPress file naming (`class-acme-plugin-utils.php` for `Acme_Plugin_Utils`) is not
PSR-4, so those classes are invisible to it even when they autoload correctly via a `classmap`
entry. Verified on a real plugin: `--everything` created 0 mutants where `--path=includes`
created 1203. **Scope with `--path=` whenever filenames do not match class names.**

Completion criterion: The gap is measured and reported, or confirmed to be zero.

### 4) Fix the mutation scope

Default in scope: PHP classes under the detected source directories, covered by fast tests.

Default excluded, always: `vendor/`, `node_modules/`, `build/`, `dist/`, `tests/`, the main
plugin file (header and bootstrap), `uninstall.php`, template and view partials, and
generated asset files.

Suite type decides the rest:

| Suite type | Treatment |
| --- | --- |
| **isolated** (Brain Monkey, WP_Mock, plain PHPUnit/Pest, no WP bootstrap) | In scope. Run by default. |
| **integration** (`WP_UnitTestCase`, `wp-phpunit`, `$_tests_dir` bootstrap) | Out of scope by default. **Hard stop** with an explanation; proceed only on explicit opt-in and with a narrowed target. |
| **mixed** | Mutate only code covered by the isolated tests. |

Why: a WP integration suite takes seconds per run because it bootstraps WordPress and a
database. Multiplied by hundreds of mutants that is an overnight job. Mutation score is
only meaningful where the suite is fast and deterministic.

JS scope: Stryker's built-in `mutate` glob (`{src,lib}/**` minus specs) plus explicit
ignores for `build/`, `dist/`, `vendor/`, `node_modules/`.

Completion criterion: The exact file/class scope is written down and shown to the user.

### 5) Budget the run

In this order:

1. **Timed baseline.** Run the plain suite once and record wall time. Fails → stop (step 1).
2. **Config smoke test.** For JS, `npx stryker run --dryRunOnly` proves the setup works before mutating anything. For PHP, the baseline run serves the same purpose.
3. **Estimate and confirm.** Report worst-case `mutant count × baseline time` *before* the real run. If the estimate exceeds **10 minutes**, require explicit confirmation or a narrowed scope.
4. **Speedups, with verification.** Infection: `--threads=max`. Stryker: `--incremental` and default `concurrency`. Pest: `--covered-only` plus its cache — but **not `--parallel` until it is proven on this project**. Pest workers are fresh `php` processes that do not inherit `-d` ini flags, and mutants that time out are scored as killed. Measured on one class: serial `60.00%` (4 survivors) versus parallel `100.00%` (9 time-outs). Adopt `--parallel` only after it reproduces the serial score on a single class.
5. **Narrow first.** Offer a single-class or single-directory run to validate the loop before going wide.

Completion criterion: A runtime estimate is reported and, if over budget, explicitly approved.

### 6) Run

PHP, Pest:

```sh
# covers()/mutates() present in the suite
vendor/bin/pest --mutate --covered-only

# no covers() anywhere, or WordPress `class-*.php` filenames
php -d pcov.directory=includes vendor/bin/pest --mutate --path=includes --covered-only
```

If the run reports `0 Mutations for 0 Files created`, treat it as a setup failure and work
through the troubleshooting table — never report it as a passing result.

PHP, Infection:

```sh
vendor/bin/infection --threads=max --show-mutations
```

JavaScript:

```sh
npx stryker run --incremental
```

Exact configuration, including the `@wordpress/scripts` Jest wiring, is in
[php-setup.md](references/php-setup.md) and [stryker-setup.md](references/stryker-setup.md).

**Verify the harness before trusting the score.** Every failure mode this skill has hit in
the field produced a clean-looking run rather than an error: 0 mutants created, 0.0%
coverage, a silent exit, or a perfect 100% built entirely from time-outs. A score is only
evidence if the harness is demonstrably applying mutants. Before reporting, confirm all
three:

1. **Mutants were created.** A count of 0 is a setup failure, never a pass.
2. **At least one mutant was killed.** If a well-covered file with real assertions kills
   nothing, suspect harness interference — Brain Monkey/Patchwork, a wrong coverage
   directory, workers that lost their ini flags — before concluding the tests are weak.
3. **Kills are kills, not time-outs.** Read the time-out count. A high score that is mostly
   time-outs is a false pass; re-run serially and compare.

If any check fails, work through the troubleshooting table and re-run. Report the
diagnosis, not the number.

PHP and JS are **independent phases**. A project with only PHP tests still gets a full PHP
run, and vice versa. Never fail the whole skill because one side is absent.

Completion criterion: Each applicable phase either produced a report or was skipped with a stated reason, and the three harness checks above passed for every reported score.

### 7) Rank survivors

A flat list sorted by filename is noise. Report survivors in these tiers, in this order:

1. **Security-control survivors** — the mutated line or its enclosing statement touches
   `current_user_can`, `wp_verify_nonce`, `check_admin_referer`, `check_ajax_referer`,
   `is_user_logged_in`, `permission_callback`, `sanitize_*`, `wp_kses*`, `esc_*`,
   `$wpdb->prepare`, or a capability string.
2. **Data-integrity survivors** — `update_option`, `*_post_meta`, `wp_insert_post`,
   `set_transient`, `delete_*`, serialization.
3. **Hook-wiring survivors** — mutated priority or `accepted_args` on `add_action` / `add_filter`.
4. **Everything else** — grouped by file.

Detection is a grep over the mutated line and its enclosing statement. Deterministic and
explainable, not magic.

Tier 1 always prints first with its own count (`3 security-control survivors`) and appears
in the summary alongside the two scores. A survived mutant that flips
`if ( ! current_user_can( 'manage_options' ) )` to always-false proves nothing tests the
unauthorized path. That is the highest-value output this skill produces — for a broader
review, hand off to `pre-launch-security-audit`.

Tier 1 is not an automatic build failure; gating is step 9.

Completion criterion: Survivors are tiered and Tier 1 is reported first with a count.

### 8) Triage, with gates

For each survivor, in tier order:

1. Show the mutant diff and its location.
2. Propose a specific assertion that would kill it.
3. **Hard gate:** write nothing until the user confirms.
4. Re-run narrowed to that mutant to prove it is now killed — Pest `--mutate --id=<id>`,
   Stryker via a mutation range (`"src/app.js:12-18"`).

Mutant kind → the assertion that kills it, with WordPress examples:
[triage-playbook.md](references/triage-playbook.md).

**Guardrail 1 — no change-detector tests.** The failure mode when told "kill this mutant" is
to assert whatever the code currently returns. That kills the mutant and tests nothing. A
proposed assertion must express *intended* behaviour traceable to a requirement, plugin
documentation, or an existing test's intent. If intent cannot be established, report the
survivor as **needs human judgement** instead of inventing an assertion.

**Guardrail 2 — equivalent mutants are a legitimate outcome.** Some survivors are
semantically identical to the original and can never be killed. Chasing 100% is a trap.
Suppress them explicitly:

| Engine | Suppression |
| --- | --- |
| Pest | `// @pest-mutate-ignore` (or the docblock form) |
| Infection | `@infection-ignore-all` |
| Stryker | `// Stryker disable next-line all: <reason>` |

Every suppression carries a written reason. An unexplained suppression is
indistinguishable from cheating the score.

Never loop autonomously until a threshold is met.

Completion criterion: Each triaged survivor is killed, suppressed with a reason, or flagged for human judgement.

### 9) Ratchet the threshold

Do not impose an arbitrary target. An 80% goal handed to a plugin scoring 34% gets the tool
deleted. Instead, propose pinning the threshold at the score just measured, rounded down:

| Engine | Setting |
| --- | --- |
| Pest | `--min=60` |
| Infection | `--min-msi=60 --min-covered-msi=75` |
| Stryker | `"thresholds": { "break": 60 }` |

The score can then only go up. Writing this into config, a Composer/npm script, or CI is
**opt-in and confirmed** — never automatic.

Completion criterion: A ratchet value is proposed, and written only if confirmed.

### 10) Report

Final summary, in this shape:

```txt
PHP (pest, isolated suite, 19 classes in scope)
  Mutation score:       61.4%
  Covered-code score:   78.2%
  Killed 132 · Survived 61 · Not covered 22
  Security-control survivors: 3

JavaScript (stryker + vitest, 14 files in scope)
  Mutation score:       74.0%
  Covered-code score:   74.0%
  Killed 88 · Survived 31 · Not covered 0
  Security-control survivors: 0

Skipped: tests/Integration/* (integration suite, out of scope by default)
Suppressed: 2 equivalent mutants (reasons in source comments)
Proposed ratchet: --min=60 (not written)
```

List what was skipped and why. List every suppression. Report blockers with the exact
failing command and its error summary.

Completion criterion: Both scores, the tier-1 count, skips, and suppressions are all reported.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Zero mutants generated (Pest) | No `covers()` / `mutates()` in test files | Add `covers(Foo::class)`, or scope with `--path=<source dir>`. The run exits cleanly having done nothing, so it is easily mistaken for a pass. |
| Infection exits 0 with no summary and no log, or reports every covered mutant escaped at MSI 0% | Brain Monkey activates Patchwork; Infection's mutants never take effect | Switch to Pest `--mutate`. Do not report the 0% — it is not a test-quality signal. See [php-setup.md](references/php-setup.md). |
| Stryker emits thousands of `ParseError` warnings from `vendor/` | Sandbox copies Composer's `vendor/`; `disableTypeChecks` tries to parse PHPCS HTML fixtures | Add `"ignorePatterns": ["vendor", "build", "languages", ".git"]`. This key is not set by default. |
| Zero mutants with `--everything`, but `--path=` works | Filenames do not match class names, so Composer resolves them via `classmap`, not PSR-4 | Use `--path=includes`. Standard for WordPress `class-*.php` naming. |
| Zero mutants only when `--parallel` is on | Workers are new `php` processes and do not inherit `-d` ini flags, so they collect no coverage and `--covered-only` discards everything | Drop `--parallel`, or pass the ini through `PHP_INI_SCAN_DIR`, which *is* inherited. |
| Coverage is 0.0% for every file, but tests pass | PCOV auto-picked the wrong `pcov.directory` — often an asset folder like `lib/` | `php -i \| grep -i '^pcov.directory'`, then `php -d pcov.directory=includes …`. `ini_set()` cannot change it; it is `PHP_INI_SYSTEM`. |
| `Mutation testing requires code coverage to be enabled` | No coverage driver | Install PCOV, or set `xdebug.mode=coverage`. Restart the PHP process afterwards. |
| Every mutant survives | Tests are not asserting, or the suite is not actually running the code | Verify the baseline suite passes *and* fails when you break something by hand. |
| Every mutant times out | Suite is too slow, a mutant caused an infinite loop, or `--parallel` is oversubscribing the CPU | Raise `timeoutMS` / narrow scope / drop `--parallel`. Timeouts count as killed, so a wall of them inflates the score into a false pass. |
| Run never finishes | Integration suite in scope | Re-scope to the isolated suite (step 4). |
| Stryker: `No tests found` | `mutate` glob and test locations disagree | Check `mutate` and `testFiles`; run `--dryRunOnly` to isolate. |
| Score drops after unrelated refactor | New code added without tests | Expected. That is the ratchet working. |
