import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

export function detectProjectState(targetRoot = process.cwd()) {
    const repoRoot = targetRoot;

    function exists(relPath) {
        try {
            fs.statSync(path.join(repoRoot, relPath));
            return true;
        } catch {
            return false;
        }
    }

    function composerHasPackage(pkg) {
        try {
            const composer = JSON.parse(fs.readFileSync(path.join(repoRoot, "composer.json"), "utf8"));
            const devDeps = composer["require-dev"] || {};
            const deps = composer["require"] || {};
            return pkg in devDeps || pkg in deps;
        } catch {
            return false;
        }
    }

    function composerHasScript(name) {
        try {
            const composer = JSON.parse(fs.readFileSync(path.join(repoRoot, "composer.json"), "utf8"));
            return name in (composer.scripts || {});
        } catch {
            return false;
        }
    }

    function packageJsonHasScript(name) {
        try {
            const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
            return name in (pkg.scripts || {});
        } catch {
            return false;
        }
    }

    function packageJsonHasDevDep(dep) {
        try {
            const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
            return dep in (pkg.devDependencies || {}) || dep in (pkg.dependencies || {});
        } catch {
            return false;
        }
    }

    function skillExists(name) {
        const locations = [
            path.join(os.homedir(), ".copilot", "skills", name, "SKILL.md"),
            path.join(os.homedir(), ".agents", "skills", name, "SKILL.md"),
        ];
        return locations.some((p) => {
            try {
                fs.statSync(p);
                return true;
            } catch {
                return false;
            }
        });
    }

    function findPluginFile() {
        // Scan root for a PHP file with a "Plugin Name:" header.
        try {
            const entries = fs.readdirSync(repoRoot, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isFile() || !entry.name.endsWith(".php")) continue;
                const content = fs.readFileSync(path.join(repoRoot, entry.name), "utf8").slice(0, 8192);
                if (/Plugin\s+Name\s*:/i.test(content)) return entry.name;
            }
        } catch {}
        return null;
    }

    const pluginFile = findPluginFile();
    const pluginSlug = path.basename(repoRoot);

    function getGitRemoteOrigin() {
        if (!exists(".git")) return null;
        try {
            const config = fs.readFileSync(path.join(repoRoot, ".git", "config"), "utf8");
            const match = config.match(/\[remote "origin"\][^[]*url\s*=\s*(.+)/);
            return match ? match[1].trim() : null;
        } catch {
            return null;
        }
    }

    return {
        pluginSlug,
        pluginFile, // null if no plugin file found, filename if found
        readmeTxt: exists("readme.txt"),
        yarnLock: exists("yarn.lock"),
        git: exists(".git"),
        gitRemoteOrigin: getGitRemoteOrigin(),
        packageJson: exists("package.json"),
        composerJson: exists("composer.json"),

        // Skills
        skills: {
            "wp-plugin-development": skillExists("wp-plugin-development"),
            "wp-block-development": skillExists("wp-block-development"),
            "wordpress-router": skillExists("wordpress-router"),
            "wp-performance": skillExists("wp-performance"),
            "wp-wpcli-and-ops": skillExists("wp-wpcli-and-ops"),
            "wordpress-pro": skillExists("wordpress-pro"),
        },

        // Composer packages
        composer: {
            phpunit: composerHasPackage("phpunit/phpunit"),
            wpcs: composerHasPackage("wp-coding-standards/wpcs"),
            phpcsInstaller: composerHasPackage("dealerdirect/phpcodesniffer-composer-installer"),
            pest: composerHasPackage("pestphp/pest"),
        },

        // Composer scripts
        composerScripts: {
            test: composerHasScript("test"),
            lint: composerHasScript("lint"),
            check: composerHasScript("check"),
        },

        // Config files
        editorconfig: exists(".editorconfig"),
        gitignore: exists(".gitignore"),

        // Vitest
        vitest: {
            config: exists("vitest.config.js") || exists("vitest.config.ts") || exists("vitest.config.mjs"),
            setupFile: exists("tests/setup.js"),
            devDep: packageJsonHasDevDep("vitest"),
        },

        // i18n
        i18n: {
            mapJson: exists("i18n-map.json"),
            languagesDir: exists("languages"),
            npmScripts: packageJsonHasScript("i18n"),
        },
    };
}

export function buildDetectionSummary(state, repoRoot = process.cwd()) {
    const lines = [];
    lines.push("");
    lines.push("=== Project Detection Summary ===");
    lines.push(`Root: ${repoRoot}`);
    lines.push(`Plugin slug: ${state.pluginSlug}`);
    lines.push("");

    if (state.pluginFile) lines.push(`⏭  Plugin file found: ${state.pluginFile}`);
    else lines.push(`📦 No plugin file — will create ${state.pluginSlug}.php`);

    if (state.readmeTxt) lines.push("⏭  readme.txt exists");
    else lines.push("📦 No readme.txt — will ask if you want one");

    if (!state.git) lines.push("⚠  No git repo — will run git init");
    if (state.git && state.gitRemoteOrigin) lines.push(`⏭  Git remote origin: ${state.gitRemoteOrigin}`);
    else if (state.git && !state.gitRemoteOrigin) lines.push("📦 No git remote origin — will ask for URL");
    if (!state.packageJson) lines.push("⚠  No package.json — will run npm init -y");
    if (!state.composerJson) lines.push("⚠  No composer.json — will run composer init");

    // Skills
    const missingSkills = Object.entries(state.skills).filter(([, v]) => !v).map(([k]) => k);
    const installedSkills = Object.entries(state.skills).filter(([, v]) => v).map(([k]) => k);
    if (missingSkills.length > 0) lines.push(`\n📦 Skills to install: ${missingSkills.join(", ")}`);
    if (installedSkills.length > 0) lines.push(`⏭  Skills already present: ${installedSkills.join(", ")}`);

    // Composer
    const missingComposer = Object.entries(state.composer).filter(([, v]) => !v).map(([k]) => k);
    if (missingComposer.length > 0) lines.push(`\n📦 Composer packages to install: ${missingComposer.join(", ")}`);
    else lines.push("\n⏭  All Composer dev packages present");

    // Composer scripts
    const missingComposerScripts = Object.entries(state.composerScripts).filter(([, v]) => !v).map(([k]) => k);
    if (missingComposerScripts.length > 0) lines.push(`📦 Composer scripts to add: ${missingComposerScripts.join(", ")}`);

    // Config files
    if (!state.editorconfig) lines.push("📦 .editorconfig — will create");
    else lines.push("⏭  .editorconfig exists");

    if (!state.gitignore) lines.push("📦 .gitignore — will create");
    else lines.push("🔀 .gitignore — will merge missing entries");

    // Vitest
    if (!state.vitest.config) lines.push("\n📦 Vitest — will install and configure");
    else lines.push("\n⏭  Vitest already configured");

    // i18n
    if (!state.i18n.mapJson || !state.i18n.npmScripts) lines.push("📦 i18n — will scaffold");
    else lines.push("⏭  i18n already configured");

    lines.push("");
    return lines.join("\n");
}

function runCli() {
    const state = detectProjectState(process.cwd());
    console.log(JSON.stringify(state, null, 2));
    console.log(buildDetectionSummary(state, process.cwd()));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    runCli();
}
