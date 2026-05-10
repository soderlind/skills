# Config Files

## .editorconfig

WordPress uses 4-space indentation (tabs for PHP in core, but spaces are standard for plugins/themes following modern conventions).

Create `.editorconfig` at the project root:

```ini
root = true

[*]
indent_style = space
indent_size = 4
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

**Skip if `.editorconfig` already exists.** Do not overwrite — the user may have customized it.

## .gitignore

Required entries for a WordPress plugin/theme project:

```
/vendor/
/node_modules/
.DS_Store
.env
.env.local
.env.*.local
```

### Merge strategy

If `.gitignore` already exists:
1. Read the current file.
2. For each required entry, check if it (or an equivalent pattern) is already present.
3. Only append missing entries, separated by a blank line and a comment `# Added by prepare-wordpress`.

If `.gitignore` does not exist, create it with all entries.
