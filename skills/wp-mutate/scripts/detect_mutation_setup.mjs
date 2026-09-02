import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const EXCLUDED_DIRS = new Set([
	"vendor",
	"node_modules",
	"build",
	"dist",
	"tests",
	"test",
	".git",
	".github",
	"languages",
	"assets",
	"bin",
]);

const SOURCE_DIR_CANDIDATES = ["src", "includes", "inc", "lib", "app", "classes"];
const TEST_DIR_CANDIDATES = ["tests", "test", "Tests"];
const BUILD_DIRS = new Set(["node_modules", "vendor", "build", "dist", ".git", "languages"]);

function readJson(filePath) {
	try {
		return JSON.parse(fs.readFileSync(filePath, "utf8"));
	} catch {
		return null;
	}
}

function exists(root, relPath) {
	try {
		fs.statSync(path.join(root, relPath));
		return true;
	} catch {
		return false;
	}
}

function firstExisting(root, candidates) {
	return candidates.find((candidate) => exists(root, candidate)) || null;
}

/** Collect files with the given extensions, skipping excluded directories. */
function walkFiles(root, dir, extensions, depth = 0, excluded = EXCLUDED_DIRS) {
	if (depth > 8) return [];
	const found = [];
	let entries;
	try {
		entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true });
	} catch {
		return found;
	}
	for (const entry of entries) {
		const rel = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (excluded.has(entry.name) || entry.name.startsWith(".")) continue;
			found.push(...walkFiles(root, rel, extensions, depth + 1, excluded));
		} else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
			found.push(rel);
		}
	}
	return found;
}

function readHead(root, relPath, bytes = 65536) {
	try {
		return fs.readFileSync(path.join(root, relPath), "utf8").slice(0, bytes);
	} catch {
		return "";
	}
}

/** Exact installed version from composer.lock, else the composer.json constraint. */
function composerPackageVersion(root, pkg) {
	const lock = readJson(path.join(root, "composer.lock"));
	if (lock) {
		const all = [...(lock.packages || []), ...(lock["packages-dev"] || [])];
		const hit = all.find((entry) => entry.name === pkg);
		if (hit?.version) return { version: String(hit.version).replace(/^v/, ""), source: "composer.lock" };
	}
	const composer = readJson(path.join(root, "composer.json"));
	if (composer) {
		const constraint = composer["require-dev"]?.[pkg] || composer.require?.[pkg];
		if (constraint) return { version: String(constraint), source: "composer.json" };
	}
	return null;
}

function majorVersion(versionString) {
	const match = String(versionString).match(/(\d+)/);
	return match ? Number(match[1]) : null;
}

/**
 * Xdebug in `debug` mode only still yields zero mutants, so the mode is
 * checked, not just the extension.
 */
function detectCoverageDriver() {
	const probe = [
		'$x = extension_loaded("xdebug") ? 1 : 0;',
		'$p = extension_loaded("pcov") ? 1 : 0;',
		'$m = (string) ini_get("xdebug.mode");',
		'$d = (string) ini_get("pcov.directory");',
		'echo $x . "|" . $p . "|" . $m . "|" . PHP_VERSION . "|" . $d;',
	].join(" ");
	try {
		const out = execFileSync("php", ["-r", probe], { encoding: "utf8", timeout: 10000 }).trim();
		const [xdebug, pcov, xdebugMode, phpVersion, pcovDirectory] = out.split("|");
		const xdebugCoverage = xdebug === "1" && /coverage/.test(xdebugMode || "");
		let driver = "none";
		if (pcov === "1") driver = "pcov";
		else if (xdebugCoverage) driver = "xdebug";
		return {
			driver,
			phpVersion: phpVersion || null,
			xdebugLoaded: xdebug === "1",
			xdebugMode: xdebugMode || null,
			pcovLoaded: pcov === "1",
			pcovDirectory: pcovDirectory || null,
			phpAvailable: true,
		};
	} catch {
		return {
			driver: "none",
			phpVersion: null,
			xdebugLoaded: false,
			xdebugMode: null,
			pcovLoaded: false,
			pcovDirectory: null,
			phpAvailable: false,
		};
	}
}

/**
 * Integration suites bootstrap WordPress and a database; mutating against them
 * costs seconds per mutant, so they are classified separately.
 */
function classifySuite(root, testDir) {
	if (!testDir) return { suiteType: "none", integrationFiles: [], isolatedFiles: [] };
	const files = walkFiles(root, testDir, [".php"]);
	const integrationFiles = [];
	const isolatedFiles = [];
	for (const file of files) {
		const content = readHead(root, file);
		if (/WP_UnitTestCase|WP_Ajax_UnitTestCase|wp-phpunit|_tests_dir|WP_TESTS_DIR|WP_UnitTestCase_Base/.test(content)) {
			integrationFiles.push(file);
		} else if (/Brain\\Monkey|Brain\\\\Monkey|WP_Mock|Mockery|PHPUnit\\Framework\\TestCase|\b(it|test|describe)\s*\(/.test(content)) {
			isolatedFiles.push(file);
		}
	}
	let suiteType = "none";
	if (integrationFiles.length > 0 && isolatedFiles.length > 0) suiteType = "mixed";
	else if (integrationFiles.length > 0) suiteType = "integration";
	else if (isolatedFiles.length > 0) suiteType = "isolated";
	else if (files.length > 0) suiteType = "unknown";
	return { suiteType, integrationFiles, isolatedFiles };
}

/** Pest scopes mutations by class, so class-free files are unreachable for it. */
function analyseSourceFiles(root) {
	// A candidate dir only counts as PHP source if it actually holds PHP.
	const sourceDirs = [];
	let files = [];
	for (const dir of SOURCE_DIR_CANDIDATES) {
		if (!exists(root, dir)) continue;
		const dirFiles = walkFiles(root, dir, [".php"]);
		if (dirFiles.length === 0) continue;
		sourceDirs.push(dir);
		files.push(...dirFiles);
	}

	if (sourceDirs.length === 0) {
		try {
			files = fs
				.readdirSync(root, { withFileTypes: true })
				.filter((entry) => entry.isFile() && entry.name.endsWith(".php"))
				.map((entry) => entry.name)
				.filter((name) => !/Plugin\s+Name\s*:/i.test(readHead(root, name, 8192)));
		} catch {
			files = [];
		}
	}

	const procedural = [];
	for (const file of files) {
		const base = path.basename(file);
		if (base === "uninstall.php") continue;
		const content = readHead(root, file);
		if (!/^\s*(final\s+|abstract\s+|readonly\s+)*(class|trait|enum|interface)\s+\w+/m.test(content)) {
			procedural.push(file);
		}
	}

	const total = files.length;
	return {
		sourceDirs: sourceDirs.length > 0 ? sourceDirs : ["."],
		sourceFiles: total,
		proceduralFiles: procedural.length,
		proceduralRatio: total > 0 ? Number((procedural.length / total).toFixed(2)) : 0,
		proceduralExamples: procedural.slice(0, 10),
	};
}

function detectPhp(root) {
	const composer = readJson(path.join(root, "composer.json"));
	const pest = composerPackageVersion(root, "pestphp/pest");
	const phpunit = composerPackageVersion(root, "phpunit/phpunit");
	const infection = composerPackageVersion(root, "infection/infection");
	const brainMonkey = composerPackageVersion(root, "brain/monkey");
	const pestMajor = pest ? majorVersion(pest.version) : null;
	const pestSupportsMutation = pestMajor !== null && pestMajor >= 3;

	let engine = "none";
	if (pestSupportsMutation) engine = "pest";
	else if (infection) engine = "infection";
	else if (pest || phpunit) engine = "infection";

	const testDir = firstExisting(root, TEST_DIR_CANDIDATES);
	const suite = classifySuite(root, testDir);
	const source = analyseSourceFiles(root);

	const existingConfig = [
		"infection.json5",
		"infection.json",
		"phpunit.xml",
		"phpunit.xml.dist",
		"tests/Pest.php",
		"Pest.php",
	].filter((file) => exists(root, file));

	return {
		engine,
		engineReason:
			engine === "pest"
				? "pestphp/pest >= 3 supports native mutation testing"
				: engine === "infection" && (pest || phpunit)
					? "no Pest 3+ present; Infection runs against the existing PHPUnit/Pest suite"
					: "no PHP test suite detected",
		pestVersion: pest?.version || null,
		pestVersionSource: pest?.source || null,
		pestSupportsMutation,
		phpunitVersion: phpunit?.version || null,
		infectionInstalled: Boolean(infection),
		infectionVersion: infection?.version || null,
		composerScripts: Object.keys(composer?.scripts || {}),
		testDir,
		...suite,
		integrationFileCount: suite.integrationFiles.length,
		isolatedFileCount: suite.isolatedFiles.length,
		...source,
		brainMonkey: Boolean(brainMonkey),
		existingConfig,
		...detectCoverageDriver(),
	};
}

function isJsTestFile(file) {
	return /\.(test|spec)\.[jt]sx?$/.test(file) || file.split(path.sep).includes("__tests__");
}

function detectJs(root) {
	const pkg = readJson(path.join(root, "package.json"));
	if (!pkg) return { runner: "none", reason: "no package.json", existingConfig: [], scripts: [] };

	const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
	const has = (name) => name in deps;

	const vitestConfig = ["vitest.config.js", "vitest.config.ts", "vitest.config.mjs", "vite.config.js", "vite.config.ts"].filter(
		(file) => exists(root, file),
	);
	const jestConfig = ["jest.config.js", "jest.config.cjs", "jest.config.mjs", "jest.config.json"].filter((file) =>
		exists(root, file),
	);
	const strykerConfig = [
		"stryker.config.json",
		"stryker.config.js",
		"stryker.config.mjs",
		"stryker.conf.json",
		".stryker.conf.json",
	].filter((file) => exists(root, file));

	const wpScripts = has("@wordpress/scripts");
	const usesJest = has("jest") || Boolean(pkg.jest) || jestConfig.length > 0 || wpScripts;
	const usesVitest = has("vitest") || vitestConfig.length > 0;
	const usesMocha = has("mocha") || exists(root, ".mocharc.json") || exists(root, ".mocharc.yml");
	const usesKarma = has("karma") || exists(root, "karma.conf.js");

	// @wordpress/scripts is usually present just to build assets, so a declared
	// runner means nothing without test files to run.
	const testFiles = walkFiles(root, ".", [".js", ".jsx", ".ts", ".tsx"], 0, BUILD_DIRS).filter(isJsTestFile);

	let runner = "none";
	let reason = "no JavaScript test runner detected";
	if (testFiles.length === 0) {
		reason =
			usesVitest || usesJest
				? "a JS test runner is declared but no test files exist"
				: "no JavaScript tests found";
	} else if (usesVitest) {
		runner = "vitest";
		reason = "vitest detected";
	} else if (usesJest) {
		runner = "jest";
		reason = wpScripts ? "@wordpress/scripts (Jest) detected" : "jest detected";
	} else if (usesMocha || usesKarma) {
		runner = "unsupported";
		reason = "only mocha/karma detected; no coverage analysis without a supported runner";
	}

	// WordPress plugins rarely keep JS at src/: admin/src, blocks/, assets/src are all common.
	const jsSourceFiles = walkFiles(root, ".", [".js", ".jsx", ".ts", ".tsx"], 0, BUILD_DIRS).filter((file) => {
		if (isJsTestFile(file)) return false;
		const segments = file.split(path.sep);
		if (segments.some((segment) => TEST_DIR_CANDIDATES.includes(segment))) return false;
		return segments.includes("src") || ["lib", "blocks", "assets", "admin"].includes(segments[0]);
	});
	const jsSourceDirs = [
		...new Set(
			jsSourceFiles.map((file) => {
				const segments = file.split(path.sep);
				const srcIndex = segments.indexOf("src");
				return srcIndex === -1 ? segments[0] : segments.slice(0, srcIndex + 1).join(path.sep);
			}),
		),
	];

	return {
		runner,
		reason,
		wpScripts,
		strykerInstalled: has("@stryker-mutator/core"),
		strykerRunnerInstalled: has("@stryker-mutator/vitest-runner") || has("@stryker-mutator/jest-runner"),
		existingConfig: [...vitestConfig, ...jestConfig, ...strykerConfig],
		scripts: Object.keys(pkg.scripts || {}),
		testFiles: testFiles.length,
		sourceDirs: jsSourceDirs,
		sourceFiles: jsSourceFiles.length,
	};
}

export function detectMutationSetup(targetRoot = process.cwd()) {
	return {
		root: targetRoot,
		php: detectPhp(targetRoot),
		js: detectJs(targetRoot),
	};
}

export function buildSummary(state) {
	const lines = [];
	const { php, js } = state;

	lines.push("");
	lines.push("=== Mutation Testing Detection ===");
	lines.push(`Root: ${state.root}`);
	lines.push("");

	lines.push("PHP");
	if (php.engine === "none") {
		lines.push("  ⛔ No PHP test suite — run wp-prepare first, or skip the PHP phase.");
	} else {
		lines.push(`  Engine: ${php.engine} (${php.engineReason})`);
		if (php.pestVersion) lines.push(`  Pest: ${php.pestVersion} (from ${php.pestVersionSource})`);
		if (php.phpunitVersion) lines.push(`  PHPUnit: ${php.phpunitVersion}`);
		lines.push(`  Suite type: ${php.suiteType} (${php.isolatedFileCount} isolated, ${php.integrationFileCount} integration)`);
		if (php.suiteType === "integration") {
			lines.push("  ⛔ Integration-only suite — out of scope by default. Opt in explicitly and narrow the target.");
		} else if (php.suiteType === "mixed") {
			lines.push("  ⚠  Mixed suite — mutate only code covered by the isolated tests.");
		}
		lines.push(`  Source: ${php.sourceFiles} PHP files in ${php.sourceDirs.join(", ")}`);
		if (php.engine === "pest" && php.proceduralFiles > 0) {
			const pct = Math.round(php.proceduralRatio * 100);
			lines.push(
				`  ⚠  ${php.proceduralFiles} of ${php.sourceFiles} in-scope PHP files (${pct}%) declare no class and cannot be mutated by Pest.`,
			);
		}
		if (php.engine === "infection" && php.brainMonkey) {
			lines.push("  ⛔ brain/monkey is installed and Infection is the selected engine.");
			lines.push("     Brain Monkey activates Patchwork, and Infection's mutants then never take effect:");
			lines.push("     every mutant is reported as escaped, or the run aborts with exit 0 and no summary.");
			lines.push("     Verify with a canary before trusting any score. See references/php-setup.md.");
		}
		if (!php.phpAvailable) {
			lines.push("  ⛔ php not found on PATH — cannot verify the coverage driver.");
		} else if (php.driver === "none") {
			lines.push(
				`  ⛔ No coverage driver. Xdebug loaded: ${php.xdebugLoaded}, xdebug.mode: ${php.xdebugMode || "unset"}, PCOV: ${php.pcovLoaded}.`,
			);
			lines.push("     Fix: install PCOV, or set xdebug.mode=coverage. Without it the run reports zero mutants.");
		} else {
			lines.push(`  Coverage driver: ${php.driver}`);
			if (php.driver === "pcov" && php.sourceDirs.length > 0) {
				const target = php.sourceDirs[0];
				const runner = php.engine === "pest" ? "vendor/bin/pest" : "vendor/bin/infection";
				if (!php.pcovDirectory) {
					// ini_get() returns "" when pcov.directory is unset: PCOV then auto-detects it at
					// runtime and regularly picks an asset folder (lib/, assets/) over the PHP source,
					// which silently yields 0.0% coverage and zero mutants. Always set it explicitly.
					lines.push("  ⚠  pcov.directory is unset, so PCOV will auto-detect it and may pick an asset folder.");
					lines.push(`     Always run with: php -d pcov.directory=${target} ${runner} …`);
					lines.push("     Confirm the resolved value with: php -i | grep -i '^pcov.directory'");
				} else {
					const covered = php.sourceDirs.some((dir) => {
						const abs = path.resolve(state.root, dir);
						return abs === php.pcovDirectory || abs.startsWith(`${php.pcovDirectory}${path.sep}`);
					});
					if (!covered) {
						lines.push(`  ⚠  pcov.directory is ${php.pcovDirectory}, which does not contain ${php.sourceDirs.join(", ")}.`);
						lines.push(`     Coverage will report 0.0% and the run will create zero mutants. Fix: php -d pcov.directory=${target} …`);
					}
				}
			}
		}
		if (php.existingConfig.length > 0) lines.push(`  Existing config: ${php.existingConfig.join(", ")}`);
	}

	lines.push("");
	lines.push("JavaScript");
	if (js.runner === "none") {
		lines.push(`  ⏭  Skipping JS phase (${js.reason}).`);
	} else if (js.runner === "unsupported") {
		lines.push(`  ⛔ ${js.reason}. Report and stop; do not fall back to the command runner.`);
	} else {
		lines.push(`  Runner: ${js.runner} (${js.reason})`);
		lines.push(`  Stryker installed: core=${js.strykerInstalled}, runner=${js.strykerRunnerInstalled}`);
		lines.push(
			`  Source: ${js.sourceFiles} JS files${js.sourceDirs.length > 0 ? ` in ${js.sourceDirs.join(", ")}` : ""} (${js.testFiles} test files)`,
		);
		if (js.existingConfig.length > 0) lines.push(`  Existing config: ${js.existingConfig.join(", ")}`);
	}

	lines.push("");
	return lines.join("\n");
}

function runCli() {
	const state = detectMutationSetup(process.cwd());
	console.log(JSON.stringify(state, null, 2));
	console.log(buildSummary(state));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	runCli();
}
