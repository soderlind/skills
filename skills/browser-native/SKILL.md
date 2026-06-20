---
name: browser-native
description: "Scan JavaScript dependencies for packages replaceable by browser/runtime native APIs. Use for dependency-modernization audits, or when another skill needs a native-replacement report with confidence and examples."
compatibility: "Node.js 18+. Filesystem-based — reads package.json. No network or browser access required."
---

# Browser-Native Dependency Scanner

## When to use

Use this skill when the user:

- asks for a dependency modernization audit focused on native API replacements.
- wants to remove polyfills/utility packages and reduce bundle/runtime overhead.
- asks if a specific package has a browser-native alternative.

## Determinism checklist

Apply [DETERMINISM-CHECKLIST.md](../DETERMINISM-CHECKLIST.md) for this skill run.

## Inputs required

- A target directory (or the current working directory) that contains a `package.json`.
- Optionally: desired output format (terminal table, markdown report, or JSON).

## Procedure

### 1) Run the scanner script

```bash
node skills/browser-native/scripts/cli.js [target-dir]
```

Default output is a colored terminal table showing each replaceable dependency, its category, the native API replacement, and a confidence level (full or partial).

#### Output formats

```bash
# Terminal table (default)
node skills/browser-native/scripts/cli.js [dir]

# Markdown with before/after code examples
node skills/browser-native/scripts/cli.js [dir] --md

# JSON for parsing
node skills/browser-native/scripts/cli.js [dir] --json

# Save to file
node skills/browser-native/scripts/cli.js [dir] --md --out report.md
```

Completion criterion: Scanner output is produced in the requested format (`table`, `--md`, or `--json`) for the intended target directory.

### 2) Review the results

The scanner checks `dependencies` and `devDependencies` against an internal database of **100+ npm packages** that have native browser/runtime equivalents.

Use this quick category map while reviewing:

| Category | Example packages | Native replacement |
|---|---|---|
| HTTP | axios, node-fetch | `fetch()` |
| URL / Query | query-string, qs | `URL`, `URLSearchParams` |
| Object / Array utils | lodash.* helpers | `structuredClone()`, `Object.*`, array methods |
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

### 4) Present findings to the user

When showing results:
1. Lead with the summary count (e.g., "14 of 42 dependencies can be replaced")
2. Group by confidence: list full replacements first (easy wins), then partial
3. For each flagged package, show the before/after code snippet
4. Note any caveats from the `notes` field  
5. If asked for a migration plan, prioritize:
   - Polyfills first (safest to remove — they just provide what's already built-in)
   - Full confidence replacements next
   - Partial replacements last (require careful review)

Completion criterion: Final response includes summary count, confidence-grouped findings, and explicit next migration priorities.

### 5) Monorepo support

The scanner automatically checks `packages/`, `apps/`, `libs/`, and `modules/` subdirectories for additional `package.json` files.

Completion criterion: Report indicates all scanned package manifests or clearly states the single-project scope.

## Verification

After presenting recommendations, the user can verify by:
1. Removing the flagged package from `package.json`
2. Replacing imports with the native API (using the "after" code example)
3. Running the project's test suite
4. Checking browser compatibility against their targets

## Failure modes

- **No package.json found** — the script will print an error. Ask the user for the correct project directory.
- **Zero replaceable deps** — this is a good result! The project is already modern.
- **Package in database but used for edge-case features** — confidence "partial" covers this. Always check the `notes` field and recommend reviewing actual usage before removing.
