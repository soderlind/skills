# StrykerJS Setup

StrykerJS is the only maintained general-purpose JavaScript mutation testing tool with
per-test coverage analysis. There is no alternative worth offering.

## Runner selection

| Detected | Runner | Notes |
| --- | --- | --- |
| `vitest` dependency or `vitest.config.*` | `@stryker-mutator/vitest-runner` | Matches what `wp-prepare` scaffolds. Preferred. |
| `@wordpress/scripts` with `test-unit-js` | `@stryker-mutator/jest-runner` | Jest under the hood. Slower — Jest cannot bail inside Stryker. |
| `jest` dependency directly | `@stryker-mutator/jest-runner` | |
| mocha / karma only | none | Report and stop. The `command` runner has no coverage analysis, so every mutant runs the entire suite. |

## Vitest

```sh
npm install --save-dev @stryker-mutator/core @stryker-mutator/vitest-runner
```

`stryker.config.json`:

```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "testRunner": "vitest",
  "vitest": {
    "configFile": "vitest.config.js",
    "related": true
  },
  "mutate": [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.{test,spec}.{js,jsx,ts,tsx}",
    "!src/**/__tests__/**"
  ],
  "ignorePatterns": ["build", "dist", "vendor", "languages", "node_modules"],
  "reporters": ["clear-text", "progress", "html"],
  "incremental": true,
  "thresholds": { "high": 80, "low": 60, "break": null }
}
```

Notes specific to the Vitest runner:

- `coverageAnalysis` is ignored — the runner always uses `perTest`, which is the fastest mode anyway.
- Stryker forces `singleThread: true` because it runs its own parallel workers. Do not fight this.
- Set `vitest.related: false` if tests do not import source directly (for example, tests that hit a running server).
- Browser mode is not supported.

## Jest via `@wordpress/scripts`

```sh
npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner
```

`@wordpress/scripts` hides its Jest config, so give Stryker an explicit one. `jest.config.js`:

```js
module.exports = {
  preset: '@wordpress/jest-preset-default',
};
```

`stryker.config.json`:

```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "testRunner": "jest",
  "jest": {
    "projectType": "custom",
    "configFile": "jest.config.js",
    "enableFindRelatedTests": true
  },
  "mutate": [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.{test,spec}.{js,jsx,ts,tsx}",
    "!src/**/__tests__/**"
  ],
  "ignorePatterns": ["build", "dist", "vendor", "languages", "node_modules"],
  "reporters": ["clear-text", "progress", "html"],
  "incremental": true,
  "thresholds": { "high": 80, "low": 60, "break": null }
}
```

Jest always runs without bail inside Stryker, so expect it to be slower than Vitest on the
same suite.

## Commands

```sh
# Validate the config without mutating anything
npx stryker run --dryRunOnly

# Standard run
npx stryker run --incremental

# Narrow to one file while validating the loop
npx stryker run --mutate "src/utils/format-price.js"

# Re-check a single survivor by mutation range
npx stryker run --mutate "src/utils/format-price.js:12-18"

# Ratchet
npx stryker run --incremental --concurrency 4
```

npm script:

```json
{
  "scripts": {
    "test:mutate:js": "stryker run --incremental"
  }
}
```

## Suppressing an equivalent mutant

```js
// Stryker disable next-line StringLiteral: i18n text domain, asserted by the linter
const TEXT_DOMAIN = 'acme-plugin';

// Stryker disable all: in-source test suite below
if ( import.meta.vitest ) {
  // ...
}
```

Always include the reason after the colon.

## WordPress-specific notes

- **`ignorePatterns` must exclude `vendor/` — this is not the default.** Stryker copies the
  project into a sandbox, and a WordPress plugin root usually contains Composer's `vendor/`
  next to the JS. Without `ignorePatterns`, Stryker's `disableTypeChecks` preprocessor tries
  to parse every file it finds there, including PHP CodeSniffer's HTML test fixtures, and
  emits thousands of `ParseError` warnings while building a needlessly huge sandbox. Adding
  `"ignorePatterns": ["vendor", "build", "languages", ".git"]` silences it completely —
  verified by re-running with only that key changed.
- **Ignore the build output.** `@wordpress/scripts` writes to `build/`; mutating compiled
  bundles produces meaningless mutants and enormous sandboxes.
- **JS does not live in `src/`.** `admin/src/`, `blocks/`, and `assets/src/` are all common
  in plugins. Point `mutate` at wherever the detector reported the sources, not at `src/`.
- **Block registration entry files are low value.** `src/index.js` files that only call
  `registerBlockType()` mutate into survivors that no unit test can kill, because their
  real behaviour lives in the editor. Point `mutate` at the utility and domain modules.
- **`disableTypeChecks` is on by default** and is what makes TypeScript sources mutable at
  all. Leave it alone unless the sandbox fails to build.
- **Add to `.gitignore`:** `.stryker-tmp/`, `reports/`.
