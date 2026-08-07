#!/usr/bin/env node
/**
 * Assembles an Agent Plugin package (https://agent-plugins.org, spec v1.0.0)
 * from skills in this repo. The skill list is read from a grouping in
 * skills.sh.json so skills/ stays the single source of truth.
 *
 * Usage:
 *   node scripts/build-agent-plugin.mjs           # write plugins/<name>/
 *   node scripts/build-agent-plugin.mjs --check    # fail if committed output is stale
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const PLUGIN_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json';
const NAME_PATTERN = /^[a-z0-9]+([.-][a-z0-9]+)*$/;

// Which plugins to build. `grouping` names a title in skills.sh.json.
const PLUGINS = [
	{
		grouping: 'WordPress',
		// Dedicated repo the plugin is mirrored to; its root IS the plugin.
		distRepo: 'https://github.com/soderlind/wordpress-agent-plugin',
		manifest: {
			name: 'wordpress-skills',
			version: '1.0.0',
			description: 'WordPress development, testing, and release skills.',
			author: { name: 'Per Soderlind', url: 'https://soderlind.no' },
			homepage: 'https://github.com/soderlind/wordpress-agent-plugin',
			repository: 'https://github.com/soderlind/skills',
			license: 'MIT',
			keywords: ['wordpress', 'wp-cli', 'testing', 'release'],
		},
	},
];

const repoRoot = path.resolve(import.meta.dirname, '..');
const skillsDir = path.join(repoRoot, 'skills');
const pluginsDir = path.join(repoRoot, 'plugins');
const check = process.argv.slice(2).includes('--check');

function fail(message) {
	console.error(`error: ${message}`);
	process.exit(1);
}

function listFiles(dir, prefix = '') {
	const entries = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
		if (entry.name === '.DS_Store') continue;
		const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
		if (entry.isDirectory()) entries.push(...listFiles(path.join(dir, entry.name), rel));
		else if (entry.isFile()) entries.push(rel);
	}
	return entries;
}

const groupings = JSON.parse(fs.readFileSync(path.join(repoRoot, 'skills.sh.json'), 'utf8')).groupings;

function renderReadme(manifest, skillNames, distRepo) {
	const list = skillNames.map((name) => `- \`${name}\``).join('\n');
	const installRepo = distRepo ?? manifest.repository;
	return `# ${manifest.name}

${manifest.description}

An [Agent Plugin](https://agent-plugins.org) (spec v1.0.0) bundling these skills:

${list}

## Install

The root of [${installRepo}](${installRepo}) is this plugin. Installation is
client-specific; common patterns:

**Clone the plugin (repo root is the plugin root)**

\`\`\`bash
git clone ${installRepo}
\`\`\`

**Copy into a client plugins directory** (path varies by client)

\`\`\`bash
git clone ${installRepo} ~/.agents/plugins/${manifest.name}
\`\`\`

**Or use your client's native install command**, pointing it at the repository
above. Refer to your client's documentation for the exact command and plugins
directory.

## Contents

Each skill lives under \`skills/<name>/\` with its own \`SKILL.md\` and any
\`scripts/\` and \`references/\`. See the Agent Skills specification at
https://agentskills.io/specification.

---

This plugin is generated from [${manifest.repository}](${manifest.repository}) by
\`scripts/build-agent-plugin.mjs\` and mirrored here. Do not edit files directly.
`;
}

// (relative path within plugin root) -> file contents
function collectPlugin({ grouping, manifest, distRepo }) {
	if (!NAME_PATTERN.test(manifest.name) || manifest.name.length > 64) {
		fail(`"${manifest.name}" is not a valid plugin name`);
	}
	const group = groupings.find((g) => g.title === grouping);
	if (!group) fail(`skills.sh.json has no grouping titled "${grouping}"`);

	const files = new Map();
	files.set('plugin.json', `${JSON.stringify({ $schema: PLUGIN_SCHEMA, ...manifest }, null, 2)}\n`);
	files.set('README.md', renderReadme(manifest, group.skills, distRepo));

	for (const skill of group.skills) {
		const dir = path.join(skillsDir, skill);
		if (!fs.existsSync(path.join(dir, 'SKILL.md'))) fail(`skills/${skill} has no SKILL.md`);
		for (const rel of listFiles(dir)) {
			files.set(`skills/${skill}/${rel}`, fs.readFileSync(path.join(dir, rel)));
		}
	}
	return files;
}

let stale = [];
for (const config of PLUGINS) {
	const files = collectPlugin(config);
	const outDir = path.join(pluginsDir, config.manifest.name);

	if (check) {
		for (const [rel, content] of files) {
			const abs = path.join(outDir, rel);
			const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
			if (!fs.existsSync(abs) || !fs.readFileSync(abs).equals(buf)) stale.push(`${config.manifest.name}/${rel}`);
		}
		for (const rel of fs.existsSync(outDir) ? listFiles(outDir) : []) {
			if (!files.has(rel)) stale.push(`${config.manifest.name}/${rel} (orphaned)`);
		}
		continue;
	}

	fs.rmSync(outDir, { recursive: true, force: true });
	for (const [rel, content] of files) {
		const abs = path.join(outDir, rel);
		fs.mkdirSync(path.dirname(abs), { recursive: true });
		fs.writeFileSync(abs, content);
	}
	console.log(`wrote plugins/${config.manifest.name}/ (${files.size} files)`);
}

if (check) {
	if (stale.length) fail(`plugin output is out of date: ${stale.join(', ')}\nrun: node scripts/build-agent-plugin.mjs`);
	console.log('plugin output is up to date');
}
