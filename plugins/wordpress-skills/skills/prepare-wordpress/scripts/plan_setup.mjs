import { execSync } from "node:child_process";
import { detectProjectState } from "./detect_project.mjs";

const ALL_PHASES = ["plugin", "readme", "init", "skills", "composer", "config", "vitest", "eslint", "i18n", "instructions", "cleanup"];

const SKILL_SOURCE = "https://github.com/WordPress/agent-skills";
const ESSENTIAL_SKILLS = ["wp-plugin-development", "wp-wpcli-and-ops"];
const OPTIONAL_SKILLS = ["wp-block-development", "wp-performance", "wordpress-router"];

function parseArgs(argv) {
    const opts = {
        dryRun: true,
        phases: new Set(ALL_PHASES),
        json: false,
    };

    for (const arg of argv) {
        if (arg === "--dry-run") {
            opts.dryRun = true;
            continue;
        }
        if (arg === "--apply") {
            opts.dryRun = false;
            continue;
        }
        if (arg === "--json") {
            opts.json = true;
            continue;
        }
        if (arg.startsWith("--only=")) {
            const only = arg.slice("--only=".length).split(",").map((s) => s.trim()).filter(Boolean);
            opts.phases = new Set(only);
            continue;
        }
        if (arg.startsWith("--skip=")) {
            const skip = arg.slice("--skip=".length).split(",").map((s) => s.trim()).filter(Boolean);
            for (const phase of skip) opts.phases.delete(phase);
            continue;
        }
    }

    const invalid = [...opts.phases].filter((phase) => !ALL_PHASES.includes(phase));
    if (invalid.length > 0) {
        throw new Error(`Unknown phase(s): ${invalid.join(", ")}. Valid phases: ${ALL_PHASES.join(", ")}`);
    }

    return opts;
}

function buildPlan(state, phases) {
    const items = [];
    const essentialMissing = ESSENTIAL_SKILLS.filter((name) => !state.skills[name]);
    const optionalMissing = OPTIONAL_SKILLS.filter((name) => !state.skills[name]);
    const missingComposer = Object.values(state.composer).some((installed) => !installed);

    const add = (phase, title, commands = [], notes = []) => {
        items.push({
            phase,
            title,
            selected: phases.has(phase),
            commands,
            notes,
        });
    };

    add(
        "plugin",
        state.pluginFile ? "Plugin bootstrap exists" : "Create plugin bootstrap file",
        [],
        state.pluginFile
            ? [`Detected ${state.pluginFile}.`]
            : ["Manual: create <plugin-slug>.php from references/plugin-bootstrap.md with user-provided metadata."],
    );

    add(
        "readme",
        state.readmeTxt ? "readme.txt exists" : "Create readme.txt (optional)",
        [],
        state.readmeTxt ? [] : ["Manual: create readme.txt only if user opts in."],
    );

    const initCommands = [];
    const initNotes = [];
    if (!state.packageJson) initCommands.push("npm init -y");
    if (!state.composerJson) initNotes.push("Manual: create composer.json as a JSON file with name, description, type, license fields. Do not use composer init with user-provided strings.");
    if (!state.git) initCommands.push("git init");
    if (state.git && !state.gitRemoteOrigin) initNotes.push("Manual: ask user for git remote URL, then run git remote add origin <remote-url>.");
    add("init", initCommands.length > 0 ? "Initialize project files" : "Init phase already satisfied", initCommands, initNotes);

    const skillCommands = essentialMissing.map((name) => `npx skills add ${SKILL_SOURCE} --skill ${name}`);
    const skillNotes = [];
    if (optionalMissing.length > 0) {
        skillNotes.push(`Optional (install only if relevant): ${optionalMissing.map((name) => `npx skills add ${SKILL_SOURCE} --skill ${name}`).join("  |  ")}`);
    }
    add("skills", skillCommands.length > 0 || skillNotes.length > 0 ? "Install agent skills" : "All agent skills already present", skillCommands, skillNotes);

    const composerCommands = [];
    const composerNotes = [];
    if (missingComposer) {
        composerCommands.push("composer require --dev phpunit/phpunit brain/monkey wp-coding-standards/wpcs dealerdirect/phpcodesniffer-composer-installer pestphp/pest");
    }
    if (!state.composerScripts.test || !state.composerScripts.lint || !state.composerScripts.check) {
        composerNotes.push("Manual: merge composer scripts test/lint/check into composer.json without overwriting existing scripts.");
    }
    if (!state.phpcsXml) composerNotes.push("Manual: create phpcs.xml from references/linting-setup.md.");
    if (!state.phpunitConfig) composerNotes.push("Manual: create phpunit.xml.dist, tests/bootstrap.php, and tests/TestCase.php from references/php-testing.md.");
    add("composer", composerCommands.length > 0 || composerNotes.length > 0 ? "Configure Composer tooling" : "Composer phase already satisfied", composerCommands, composerNotes);

    const configNotes = [];
    if (!state.editorconfig) configNotes.push("Manual: create .editorconfig from references/config-files.md.");
    if (!state.gitignore) configNotes.push("Manual: create .gitignore from references/config-files.md.");
    if (state.gitignore) configNotes.push("Manual: merge missing .gitignore entries from references/config-files.md.");
    add("config", configNotes.length > 0 ? "Configure repo files" : "Config phase already satisfied", [], configNotes);

    const vitestCommands = [];
    const vitestNotes = [];
    if (!state.vitest.config || !state.vitest.devDep) vitestCommands.push("npm install --save-dev vitest jsdom");
    if (!state.vitest.config) vitestNotes.push("Manual: create vitest.config.js from references/vitest-setup.md.");
    if (!state.vitest.setupFile) vitestNotes.push("Manual: create tests/setup.js from references/vitest-setup.md.");
      if (!state.vitest.testScript) {
          vitestNotes.push("Manual: merge test:js script into package.json without overwriting existing scripts.");
      }
    add("vitest", vitestCommands.length > 0 || vitestNotes.length > 0 ? "Configure Vitest" : "Vitest phase already satisfied", vitestCommands, vitestNotes);

    const eslintCommands = [];
    const eslintNotes = [];
    if (!state.eslint.config || !state.eslint.devDep) eslintCommands.push("npm install --save-dev eslint @wordpress/eslint-plugin");
    if (!state.eslint.config) eslintNotes.push("Manual: create .eslintrc.json and .eslintignore from references/linting-setup.md.");
    if (!state.eslint.script) eslintNotes.push("Manual: merge lint:js script into package.json without overwriting existing scripts.");
    add("eslint", eslintCommands.length > 0 || eslintNotes.length > 0 ? "Configure ESLint" : "ESLint phase already satisfied", eslintCommands, eslintNotes);

    const i18nNotes = [];
    if (!state.i18n.mapJson) i18nNotes.push("Manual: create i18n-map.json (or empty {} placeholder) from references/i18n-setup.md.");
    if (!state.i18n.languagesDir) i18nNotes.push("Manual: create languages/ directory.");
    if (!state.i18n.npmScripts) i18nNotes.push("Manual: merge i18n npm scripts using the selected text domain.");
    add("i18n", i18nNotes.length > 0 ? "Configure i18n scaffolding" : "i18n phase already satisfied", [], i18nNotes);

    const instructionsCommands = [];
    const instructionsNotes = [];
    if (!state.instructionsFile) {
        instructionsCommands.push("mkdir -p .github/instructions && curl -fsSL https://raw.githubusercontent.com/github/awesome-copilot/main/instructions/wordpress.instructions.md -o .github/instructions/wordpress.instructions.md");
        instructionsNotes.push("If offline, create .github/instructions/wordpress.instructions.md manually from references/copilot-instructions.md.");
    }
    add("instructions", instructionsCommands.length > 0 ? "Download WordPress Copilot coding instructions" : "Copilot instructions already present", instructionsCommands, instructionsNotes);

    add(
        "cleanup",
        state.yarnLock ? "Remove stray yarn.lock" : "Cleanup already satisfied",
        state.yarnLock ? ["rm -f yarn.lock"] : [],
        [],
    );

    return items;
}

function printPlan(plan, dryRun) {
    console.log("=== Setup Plan ===");
    console.log(`Mode: ${dryRun ? "dry-run (no commands executed)" : "apply (safe commands only)"}`);

    for (const item of plan) {
        if (!item.selected) {
            console.log(`\n⏭  [${item.phase}] skipped by feature flags`);
            continue;
        }

        console.log(`\n📌 [${item.phase}] ${item.title}`);

        if (item.commands.length === 0 && item.notes.length === 0) {
            console.log("   Nothing to do.");
            continue;
        }

        for (const command of item.commands) {
            console.log(`   cmd: ${command}`);
        }
        for (const note of item.notes) {
            console.log(`   note: ${note}`);
        }
    }

    console.log("");
}

function printPlanJson(plan, opts) {
    const payload = {
        mode: opts.dryRun ? "dry-run" : "apply",
        phases: [...opts.phases],
        items: plan,
    };
    console.log(JSON.stringify(payload, null, 2));
}

function applyPlan(plan) {
    const results = [];

    for (const item of plan) {
        if (!item.selected) {
            results.push({
                phase: item.phase,
                skipped: true,
                success: true,
                commands: [],
            });
            continue;
        }

        const phaseResult = {
            phase: item.phase,
            skipped: false,
            success: true,
            commands: [],
        };

        for (const command of item.commands) {
            phaseResult.commands.push({
                command,
                success: true,
            });

            try {
                console.log(`→ ${command}`);
                execSync(command, { stdio: "inherit" });
            } catch (error) {
                phaseResult.success = false;
                phaseResult.commands[phaseResult.commands.length - 1].success = false;
                phaseResult.commands[phaseResult.commands.length - 1].error = String(error.message || error);
                results.push(phaseResult);
                return {
                    success: false,
                    results,
                };
            }
        }

        results.push(phaseResult);
    }

    return {
        success: true,
        results,
    };
}

function main() {
    const opts = parseArgs(process.argv.slice(2));
    const state = detectProjectState(process.cwd());
    const plan = buildPlan(state, opts.phases);

    if (opts.json && opts.dryRun) {
        printPlanJson(plan, opts);
        return;
    }

    if (!opts.json) {
        printPlan(plan, opts.dryRun);
    }

    if (!opts.dryRun) {
        const applyResult = applyPlan(plan);

        if (opts.json) {
            console.log(
                JSON.stringify(
                    {
                        mode: "apply",
                        phases: [...opts.phases],
                        items: plan,
                        apply: applyResult,
                    },
                    null,
                    2,
                ),
            );
        }

        if (!applyResult.success) {
            process.exitCode = 1;
        }
    }
}

main();
