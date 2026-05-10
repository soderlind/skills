# i18n Setup

## i18n-map.json

Maps source JS files to their build output paths. Required by `wp i18n make-json` to correctly associate translation strings with built JS files.

Create `i18n-map.json` with placeholder entries:

```json
{
  "blocks/BLOCK-NAME/save.js": "build/blocks/BLOCK-NAME/index.js"
}
```

The user must replace `BLOCK-NAME` with actual block directory names. Add one entry per block or JS source file that contains translatable strings.

## npm scripts

Merge into `package.json` scripts. Use the **current folder name** (basename of the repo root) as the text domain and .pot filename.

For example, if the project is in `~/Projects/my-plugin`, the slug is `my-plugin`:

```json
{
  "scripts": {
    "i18n": "npm run i18n:make-pot && npm run i18n:update-po && npm run i18n:make-mo && npm run i18n:make-json && npm run i18n:make-php",
    "i18n:make-pot": "wp i18n make-pot . languages/my-plugin.pot --exclude=node_modules,vendor,tests,build --domain=my-plugin",
    "i18n:update-po": "wp i18n update-po languages/my-plugin.pot languages/",
    "i18n:make-mo": "wp i18n make-mo languages/",
    "i18n:make-json": "wp i18n make-json languages/ --no-purge --use-map=i18n-map.json",
    "i18n:make-php": "wp i18n make-php languages/"
  }
}
```

## Directory

```sh
mkdir -p languages
```

Create the `languages/` directory if it does not exist. This is where all generated `.pot`, `.po`, `.mo`, `.json`, and `.php` translation files are stored.

## Prerequisites

These scripts require [WP-CLI](https://wp-cli.org/) with the `i18n-command` package:

```sh
wp package install wp-cli/i18n-command
```

Or if WP-CLI ships with it bundled (v2.5+), it is already available.

## After scaffolding

The user must:
1. Replace `BLOCK-NAME` entries in `i18n-map.json` with real block directory names.
2. Ensure block source files use `__()`, `_e()`, `_n()`, etc. from `@wordpress/i18n`.
