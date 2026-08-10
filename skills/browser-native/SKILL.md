---
name: browser-native
description: "Scan JavaScript dependencies for packages replaceable by browser/runtime native APIs. Use for dependency-modernization audits, or when another skill needs a native-replacement report with confidence, Baseline status, and examples."
compatibility: "Node.js 18+. Filesystem-based — reads package.json. No network or browser access required."
version: "1.2.0"
---

# Browser-Native Dependency Scanner

## When to use

Use this skill when the user:

- asks for a dependency modernization audit focused on native API replacements.
- wants to remove polyfills/utility packages and reduce bundle/runtime overhead.
- asks if a specific package has a browser-native alternative.

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

## Inputs required

- A target directory (or the current working directory) that contains a `package.json`.
- Optionally: desired output format (terminal table, markdown report, or JSON).

## Procedure

### 1) Run the scanner script

```bash
node {{SKILL_DIR}}/scripts/cli.js [target-dir]
```

Default output is a colored terminal table showing each replaceable dependency, its category, the native API replacement, and a confidence level (full or partial).

The scanner exits with code `1` when it finds replaceable dependencies and `0` when it finds none — this is a CI signal, not a failure. Do not report exit code `1` as a broken command.

#### Output formats

```bash
# Terminal table (default)
node {{SKILL_DIR}}/scripts/cli.js [dir]

# Markdown with before/after code examples
node {{SKILL_DIR}}/scripts/cli.js [dir] --md

# JSON for parsing
node {{SKILL_DIR}}/scripts/cli.js [dir] --json

# Save to file
node {{SKILL_DIR}}/scripts/cli.js [dir] --md --out report.md
```

Completion criterion: Scanner output is produced in the requested format (`table`, `--md`, or `--json`) for the intended target directory.

### 2) Review the results

The scanner checks `dependencies` and `devDependencies` against an internal database of **100+ npm packages** that have native browser/runtime equivalents.

Use this quick category map while reviewing:

| Category | Example packages | Native replacement |
| --- | --- | --- |
| HTTP | axios, node-fetch | `fetch()` |
| URL / Query | query-string, qs | `URL`, `URLSearchParams` |
| Object / Array utils | lodash.* helpers | `structuredClone()`, `Object.*`, `Object.groupBy()`, `Set` methods, array methods |
| Internationalization | numeral, pluralize, timeago.js, humanize-duration | `Intl.*` (`NumberFormat`, `PluralRules`, `RelativeTimeFormat`, `DurationFormat`) |
| UI primitives | tippy.js, focus-trap, body-scroll-lock, a11y-dialog | `<dialog>`, Popover API, CSS anchor positioning |
| UUID / Date | uuid, moment | `crypto.randomUUID()`, `Intl.*` |
| Polyfills / APIs | abort-controller, resize-observer-polyfill | Native globals and browser APIs |

For the full package map and migration details, use:

- `references/replacements-guide.md`

Completion criterion: Review identifies which flagged packages are `full` vs `partial`, and captures any package-specific caveats needed for migration.

### 3) Interpret confidence levels

- **Full** — drop-in replacement. The native API covers the same functionality. Safe to remove the package and use the native API directly.
- **Partial** — covers most common use cases, but the package may offer features the native API doesn't. Review your usage before removing.

For detailed reference on each replacement including before/after code and browser support, read:

- `references/replacements-guide.md`

Completion criterion: Every recommendation in the user-facing output includes a confidence label and caveat handling for `partial` replacements.

### 3b) Interpret Baseline status

Some replacements carry a `baseline` tag describing how safe the native API is to adopt across browsers ([webstatus.dev](https://webstatus.dev) / MDN Baseline badges):

- **widely** — in all major engines for 30+ months. Adopt without much thought.
- **newly** — recently in all major engines. Works on up-to-date browsers, but check your audience or add a fallback before shipping to a broad audience.
- **limited** — not yet in all engines. Keep the library or polyfill for now.

Confidence answers *"does the native API do what the library does?"*; Baseline answers *"can my users run it?"*. Treat them as independent — a `full` replacement can still be `newly` available (e.g. `Object.groupBy`), which means safe *functionally* but audience-dependent.

Before recommending a swap, run the article's three questions:

1. **Is it Baseline-safe for my audience?** `widely` is usually yes; for `newly`, check `browserslist`/analytics.
2. **What does the swap actually cost?** A heavier polyfill than the library it replaces is a net loss unless loaded conditionally (e.g. Temporal vs `dayjs`).
3. **Does the platform feature cover my real use case?** Libraries often do more (e.g. `axios` interceptors/retries). Check actual usage before assuming a drop-in.

Completion criterion: `newly`/`limited` recommendations are gated on audience/cost, not presented as free wins.

### 4) Present findings to the user

When showing results:

1. Lead with the summary count (e.g., "14 of 42 dependencies can be replaced")
2. Group by confidence: list full replacements first (easy wins), then partial
3. For each flagged package, show the before/after code snippet
4. Note any caveats from the `notes` field, and surface the `baseline` tag (`widely`/`newly`/`limited`)
5. If asked for a migration plan, prioritize:
   - Polyfills first (safest to remove — they just provide what's already built-in)
   - `widely` + `full` confidence replacements next (easy wins)
   - `newly` replacements behind an audience check or a feature-detect fallback
   - `partial` replacements last (require careful usage review)

For `newly`-available features, recommend shipping behind progressive enhancement rather than a hard swap:

```js
if (typeof Intl.DurationFormat === "function") {
  // use the native API
} else {
  // keep the library, or a simpler fallback
}
```

Completion criterion: Final response includes summary count, confidence- and Baseline-grouped findings, and explicit next migration priorities.

### 5) Monorepo support

The scanner automatically checks `packages/`, `apps/`, `libs/`, and `modules/` subdirectories for additional `package.json` files.

Completion criterion: Report indicates all scanned package manifests or clearly states the single-project scope.

## Verification

After presenting recommendations, the user can verify by:

1. Removing the flagged package from `package.json`
2. Replacing imports with the native API (using the "after" code example)
3. Running the project's test suite
4. Checking browser compatibility against their targets (compare the API's Baseline status on [webstatus.dev](https://webstatus.dev) against their `browserslist`)

## Failure modes

- **No package.json found** — the script will print an error. Ask the user for the correct project directory.
- **Exit code 1 with results** — expected. The scanner exits non-zero when replaceable dependencies exist so it can gate CI. Only exit code `1` *with an error message on stderr* is a real failure.
- **Zero replaceable deps** — this is a good result! The project is already modern.
- **Package in database but used for edge-case features** — confidence "partial" covers this. Always check the `notes` field and recommend reviewing actual usage before removing.
