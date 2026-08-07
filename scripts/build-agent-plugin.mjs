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
			version: '1.1.0',
			description: 'WordPress development, testing, and release skills.',
			author: { name: 'Per Soderlind', url: 'https://soderlind.no' },
			homepage: 'https://github.com/soderlind/wordpress-agent-plugin',
			repository: 'https://github.com/soderlind/skills',
			license: 'MIT',
			keywords: ['wordpress', 'wp-cli', 'testing', 'release'],
		},
		// Newest first. Each entry becomes a section in CHANGELOG.md.
		changelog: [
			{
				version: '1.1.0',
				date: '2026-08-08',
				added: [
					'prepare-wordpress: unit tests mock WordPress with Brain Monkey (brain/monkey); added references/php-testing.md and PHPUnit test scaffolding (phpunit.xml.dist, tests/bootstrap.php, tests/TestCase.php).',
					'prepare-wordpress: ESLint (@wordpress/eslint-plugin) and a committed phpcs.xml ruleset via a new linting-setup.md reference.',
					'prepare-wordpress: new instructions phase downloads the github/awesome-copilot WordPress coding instructions.',
				],
				changed: [
					'prepare-wordpress: Composer and npm dependencies install the latest compatible releases (unpinned).',
					'prepare-wordpress: composer.json is written as a file instead of via composer init with user-provided strings.',
				],
			},
			{
				version: '1.0.0',
				date: '2026-08-07',
				added: [
					'Initial release bundling the prepare-wordpress, wp-bump, wp-cli-local, wp-mutate, and wp-pcp-local skills as an Agent Plugin.',
				],
			},
		],
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

function skillDescription(skill) {
	const source = fs.readFileSync(path.join(skillsDir, skill, 'SKILL.md'), 'utf8');
	if (!source.startsWith('---\n')) fail(`skills/${skill}/SKILL.md has no frontmatter`);
	const end = source.indexOf('\n---', 3);
	if (end === -1) fail(`skills/${skill}/SKILL.md has an unterminated frontmatter block`);
	for (const line of source.slice(4, end).split('\n')) {
		const match = /^description:\s*(.*)$/.exec(line);
		if (match) return match[1].trim().replace(/^"(.*)"$/s, '$1').replace(/^'(.*)'$/s, '$1');
	}
	fail(`skills/${skill}/SKILL.md has no description`);
}

const CHANGE_SECTIONS = [
	['added', 'Added'],
	['changed', 'Changed'],
	['deprecated', 'Deprecated'],
	['removed', 'Removed'],
	['fixed', 'Fixed'],
	['security', 'Security'],
];

function renderChangelog(manifest, changelog) {
	if (!changelog || changelog.length === 0) return null;
	if (changelog[0].version !== manifest.version) {
		fail(`changelog top entry (${changelog[0].version}) does not match manifest version (${manifest.version})`);
	}
	const body = changelog
		.map((entry) => {
			const heading = `## [${entry.version}]${entry.date ? ` - ${entry.date}` : ''}`;
			const sections = CHANGE_SECTIONS.filter(([key]) => entry[key]?.length).map(
				([key, title]) => `### ${title}\n\n${entry[key].map((line) => `- ${line}`).join('\n')}`
			);
			return [heading, ...sections].join('\n\n');
		})
		.join('\n\n');
	return `# Changelog

All notable changes to \`${manifest.name}\` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

${body}
`;
}

function renderReadme(manifest, skills, distRepo) {
	const installRepo = distRepo ?? manifest.repository;
	const rows = skills
		.map(({ name, description }) => `| [\`${name}\`](skills/${name}/SKILL.md) | ${description.replace(/\|/g, '\\|')} |`)
		.join('\n');
	return `# ${manifest.name}

${manifest.description}

An [Agent Plugin](https://agent-plugins.org) (spec v1.0.0) bundling ${skills.length} skills:

| Skill | Description |
| ----- | ----------- |
${rows}

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
\`scripts/\` and \`references/\`. Open a skill's \`SKILL.md\` (linked above) for its
full instructions. See the Agent Skills specification at
https://agentskills.io/specification.

---

This plugin is generated from [${manifest.repository}](${manifest.repository}) by
\`scripts/build-agent-plugin.mjs\` and mirrored here. Do not edit files directly.
`;
}

// (relative path within plugin root) -> file contents
function collectPlugin({ grouping, manifest, distRepo, changelog }) {
	if (!NAME_PATTERN.test(manifest.name) || manifest.name.length > 64) {
		fail(`"${manifest.name}" is not a valid plugin name`);
	}
	const group = groupings.find((g) => g.title === grouping);
	if (!group) fail(`skills.sh.json has no grouping titled "${grouping}"`);

	const files = new Map();
	files.set('plugin.json', `${JSON.stringify({ $schema: PLUGIN_SCHEMA, ...manifest }, null, 2)}\n`);
	const skills = group.skills.map((name) => ({ name, description: skillDescription(name) }));
	files.set('README.md', renderReadme(manifest, skills, distRepo));
	const changelogMd = renderChangelog(manifest, changelog);
	if (changelogMd) files.set('CHANGELOG.md', changelogMd);

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
