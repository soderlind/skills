# WordPress readme.txt

## Format

The `readme.txt` follows the [WordPress.org plugin readme standard](https://developer.wordpress.org/plugins/wordpress-org/how-your-readme-txt-works/).

```
=== {Plugin Name} ===
Contributors: {author-slug}
Tags:
Requires at least: {Requires at least}
Tested up to: {Tested up to}
Requires PHP: {Requires PHP}
Stable tag: 0.1.0
License: {License}
License URI: https://www.gnu.org/licenses/gpl-2.0.html

{Description}

== Description ==

{Description}

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/{plugin-slug}/`, or install through the WordPress plugins screen.
2. Activate the plugin through the 'Plugins' screen in WordPress.

== Changelog ==

= 0.1.0 =
* Initial release.
```

## Field notes

- **Contributors**: WordPress.org username(s), comma-separated. Derive a slug from the Author name (lowercase, no spaces) or ask the user.
- **Tags**: Up to 5 comma-separated tags. Leave empty for the user to fill in.
- **Stable tag**: Must match the `Version` header in the main plugin file.
- **Tested up to**: The highest WordPress version the plugin has been tested against. Update this with each WP release.

## Detection

Skip creation if `readme.txt` already exists in the project root.
