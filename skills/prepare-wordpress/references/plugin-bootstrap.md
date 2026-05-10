# Plugin Bootstrap (plugin.php)

## Plugin Header

Every WordPress plugin needs a main PHP file with a standard header comment. The file should be named after the plugin slug (folder name).

```php
<?php
/**
 * Plugin Name: {Plugin Name}
 * Plugin URI:  {Plugin URI}
 * Description: {Description}
 * Version:     0.1.0
 * Author:      {Author}
 * Author URI:  {Author URI}
 * License:     {License}
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: {Text Domain}
 * Domain Path: /languages
 * Requires at least: {Requires at least}
 * Tested up to:      {Tested up to}
 * Requires PHP: {Requires PHP}
 */

declare(strict_types=1);

defined( 'ABSPATH' ) || exit;
```

## Detection

To check if a plugin file already exists, scan `.php` files in the project root for a line matching `Plugin Name:` inside a docblock comment. If found, skip creation.

## Conventions

- The filename should match the plugin slug: `my-plugin.php` for a plugin in the `my-plugin/` folder.
- `declare(strict_types=1)` is recommended for modern PHP.
- `defined( 'ABSPATH' ) || exit;` prevents direct file access.
- `Domain Path` should point to `/languages` to match the i18n setup.
- `Text Domain` must match the slug used in i18n scripts and all `__()` / `_e()` calls.
