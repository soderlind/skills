#!/usr/bin/env node
/**
 * Builds the Agent Skills discovery index and archives described by
 * https://github.com/cloudflare/agent-skills-discovery-rfc (v0.2.0).
 *
 * Usage:
 *   node scripts/build-agent-skills-index.mjs            # write index + archives
 *   node scripts/build-agent-skills-index.mjs --check    # fail if committed output is stale
 *   node scripts/build-agent-skills-index.mjs --base-url https://example.com
 */

import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const SCHEMA = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';
const DEFAULT_BASE_URL = 'https://soderlind.no';
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const repoRoot = path.resolve(import.meta.dirname, '..');
const skillsDir = path.join(repoRoot, 'skills');
const outDir = path.join(repoRoot, '.well-known', 'agent-skills');
const indexPath = path.join(outDir, 'index.json');

const args = process.argv.slice(2);
const check = args.includes('--check');
const baseUrlArg = args.indexOf('--base-url');
const baseUrl = (baseUrlArg === -1 ? DEFAULT_BASE_URL : args[baseUrlArg + 1]).replace(/\/+$/, '');

function fail(message) {
	console.error(`error: ${message}`);
	process.exit(1);
}

function parseFrontmatter(source, file) {
	if (!source.startsWith('---\n')) fail(`${file} has no YAML frontmatter`);
	const end = source.indexOf('\n---', 3);
	if (end === -1) fail(`${file} has an unterminated frontmatter block`);
	const fields = {};
	for (const line of source.slice(4, end).split('\n')) {
		const match = /^([a-z_]+):\s*(.*)$/.exec(line);
		if (!match) continue;
		fields[match[1]] = match[2].trim().replace(/^"(.*)"$/s, '$1');
	}
	return fields;
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

function tarHeader(name, size, mode) {
	const header = Buffer.alloc(512);
	if (Buffer.byteLength(name) > 100) fail(`path too long for ustar header: ${name}`);
	header.write(name, 0, 100, 'utf8');
	header.write(mode.toString(8).padStart(7, '0') + '\0', 100, 8, 'ascii');
	header.write('0000000\0', 108, 8, 'ascii'); // uid
	header.write('0000000\0', 116, 8, 'ascii'); // gid
	header.write(size.toString(8).padStart(11, '0') + '\0', 124, 12, 'ascii');
	header.write('00000000000\0', 136, 12, 'ascii'); // mtime 0, for reproducible archives
	header.write('        ', 148, 8, 'ascii'); // checksum placeholder
	header.write('0', 156, 1, 'ascii'); // regular file
	header.write('ustar\0', 257, 6, 'ascii');
	header.write('00', 263, 2, 'ascii');
	let checksum = 0;
	for (const byte of header) checksum += byte;
	header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'ascii');
	return header;
}

function buildArchive(dir) {
	const chunks = [];
	for (const rel of listFiles(dir)) {
		const abs = path.join(dir, rel);
		const body = fs.readFileSync(abs);
		const mode = fs.statSync(abs).mode & 0o111 ? 0o755 : 0o644;
		chunks.push(tarHeader(rel, body.length, mode), body);
		const padding = (512 - (body.length % 512)) % 512;
		if (padding) chunks.push(Buffer.alloc(padding));
	}
	chunks.push(Buffer.alloc(1024)); // two empty blocks terminate the archive
	return gzipSync(Buffer.concat(chunks), { level: 9 });
}

const digest = (buffer) => `sha256:${createHash('sha256').update(buffer).digest('hex')}`;

const skillNames = fs
	.readdirSync(skillsDir, { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => entry.name)
	.sort();

const skills = [];
const artifacts = new Map();

for (const dirName of skillNames) {
	const dir = path.join(skillsDir, dirName);
	const skillMd = path.join(dir, 'SKILL.md');
	if (!fs.existsSync(skillMd)) fail(`skills/${dirName} has no SKILL.md`);

	const source = fs.readFileSync(skillMd, 'utf8');
	const { name, description } = parseFrontmatter(source, `skills/${dirName}/SKILL.md`);
	if (!name || !description) fail(`skills/${dirName}/SKILL.md needs both name and description`);
	if (name !== dirName) fail(`skills/${dirName}/SKILL.md declares name "${name}"`);
	if (name.length > 64 || !NAME_PATTERN.test(name)) fail(`"${name}" is not a valid skill name`);
	if (description.length > 1024) fail(`${name} description exceeds 1024 characters`);

	const hasResources = listFiles(dir).some((rel) => rel !== 'SKILL.md');
	const artifact = hasResources ? `${name}.tar.gz` : `${name}/SKILL.md`;
	const content = hasResources ? buildArchive(dir) : fs.readFileSync(skillMd);
	artifacts.set(artifact, content);
	skills.push({
		name,
		type: hasResources ? 'archive' : 'skill-md',
		description,
		url: `${baseUrl}/.well-known/agent-skills/${artifact}`,
		digest: digest(content),
	});
}

const index = `${JSON.stringify({ $schema: SCHEMA, skills }, null, 2)}\n`;

if (check) {
	const stale = [];
	if (!fs.existsSync(indexPath) || fs.readFileSync(indexPath, 'utf8') !== index) stale.push('index.json');
	for (const [file, content] of artifacts) {
		const abs = path.join(outDir, file);
		if (!fs.existsSync(abs) || !fs.readFileSync(abs).equals(content)) stale.push(file);
	}
	const expected = new Set([...artifacts.keys(), 'index.json']);
	for (const file of fs.existsSync(outDir) ? listFiles(outDir) : []) {
		if (!expected.has(file)) stale.push(`${file} (orphaned)`);
	}
	if (stale.length) fail(`discovery output is out of date: ${stale.join(', ')}\nrun: node scripts/build-agent-skills-index.mjs`);
	console.log(`discovery index is up to date (${skills.length} skills)`);
	process.exit(0);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
for (const [file, content] of artifacts) {
	const abs = path.join(outDir, file);
	fs.mkdirSync(path.dirname(abs), { recursive: true });
	fs.writeFileSync(abs, content);
}
fs.writeFileSync(indexPath, index);

console.log(`wrote .well-known/agent-skills/index.json (${skills.length} skills)`);
