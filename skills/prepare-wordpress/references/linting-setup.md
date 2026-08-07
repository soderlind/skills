# Linting Setup

Two linters: **PHPCS** (WordPress Coding Standards) for PHP and **ESLint**
(`@wordpress/eslint-plugin`) for JavaScript. Do not pin versions — install the
latest compatible releases.

## PHP: phpcs.xml

Committing a `phpcs.xml` ruleset lets the `lint` composer script run as plain
`phpcs` (no `--standard` flag) and excludes build/vendor paths. Requires
`wp-coding-standards/wpcs` and `dealerdirect/phpcodesniffer-composer-installer`
(installed in the Composer phase).

Create `phpcs.xml` at the project root. Skip if it already exists.

```xml
<?xml version="1.0"?>
<ruleset name="Project">
    <description>WordPress Coding Standards for this project.</description>

    <file>.</file>
    <exclude-pattern>vendor/*</exclude-pattern>
    <exclude-pattern>node_modules/*</exclude-pattern>
    <exclude-pattern>build/*</exclude-pattern>

    <arg name="extensions" value="php"/>
    <arg value="ps"/><!-- p = progress, s = show sniff codes -->

    <rule ref="WordPress"/>
</ruleset>
```

Run with `composer lint` (i.e. `phpcs`) and auto-fix with `phpcbf`.

## JavaScript: ESLint

Install:

```sh
npm install --save-dev eslint @wordpress/eslint-plugin
```

Create `.eslintrc.json`:

```json
{
  "root": true,
  "extends": ["plugin:@wordpress/eslint-plugin/recommended"]
}
```

Create `.eslintignore`:

```gitignore
vendor/
node_modules/
build/
```

Merge into `package.json` scripts (do not overwrite existing):

```json
{
  "scripts": {
    "lint:js": "eslint ."
  }
}
```

Run with `npm run lint:js`. Auto-fix with `eslint . --fix`.

## Notes

- Skip PHP or JS linting independently if a config already exists.
- `@wordpress/eslint-plugin/recommended` covers React/JSX and WordPress globals;
  use `.../recommended-with-formatting` if you are not running Prettier.
