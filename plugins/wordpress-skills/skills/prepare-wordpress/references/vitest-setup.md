# Vitest Setup

## Installation

```sh
npm install --save-dev vitest jsdom
```

## vitest.config.js

Create at project root:

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
  },
});
```

## tests/setup.js

Create `tests/setup.js`:

```js
import { beforeEach } from 'vitest';
```

This is a minimal setup file. The user can add global test setup logic (mocks, DOM cleanup, etc.) here later.

## package.json script

Merge into `package.json` scripts (do not overwrite existing):

```json
{
  "scripts": {
    "test:js": "vitest run"
  }
}
```

## Notes

- `jsdom` is required as a peer dependency for browser-like DOM testing.
- `globals: true` allows using `describe`, `it`, `expect` without imports.
- Skip this entire phase if `vitest.config.js` (or `.ts`/`.mjs` variant) already exists.
