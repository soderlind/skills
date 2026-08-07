# wordpress-skills

WordPress development, testing, and release skills.

An [Agent Plugin](https://agent-plugins.org) (spec v1.0.0) bundling these skills:

- `prepare-wordpress`
- `wp-bump`
- `wp-cli-local`
- `wp-mutate`
- `wp-pcp-local`

## Install

The root of [https://github.com/soderlind/wordpress-agent-plugin](https://github.com/soderlind/wordpress-agent-plugin) is this plugin. Installation is
client-specific; common patterns:

**Clone the plugin (repo root is the plugin root)**

```bash
git clone https://github.com/soderlind/wordpress-agent-plugin
```

**Copy into a client plugins directory** (path varies by client)

```bash
git clone https://github.com/soderlind/wordpress-agent-plugin ~/.agents/plugins/wordpress-skills
```

**Or use your client's native install command**, pointing it at the repository
above. Refer to your client's documentation for the exact command and plugins
directory.

## Contents

Each skill lives under `skills/<name>/` with its own `SKILL.md` and any
`scripts/` and `references/`. See the Agent Skills specification at
https://agentskills.io/specification.

---

This plugin is generated from [https://github.com/soderlind/skills](https://github.com/soderlind/skills) by
`scripts/build-agent-plugin.mjs` and mirrored here. Do not edit files directly.
