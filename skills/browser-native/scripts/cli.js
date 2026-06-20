#!/usr/bin/env node

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { scan } from "./scanner.js";
import { formatTable } from "./formatters/table.js";
import { formatMarkdown } from "./formatters/markdown.js";
import { formatJson } from "./formatters/json.js";

const HELP = `
browser-native — find npm deps replaceable by modern browser/runtime built-in APIs

Usage:
  browser-native [dir]            Scan directory (defaults to current directory)
  browser-native --json           Output as JSON
  browser-native --md             Output as Markdown with before/after code examples
  browser-native --out <file>     Write output to a file instead of stdout
  browser-native --help           Show this help message

Options:
  [dir]          Target directory to scan (default: .)
  --json         Output JSON instead of the terminal table
  --md           Output Markdown report with code examples
  --out <file>   Write output to a file (works with --json and --md)
  --help, -h     Show this help message

Examples:
  browser-native                  Scan current project
  browser-native ../my-app        Scan a different project
  browser-native --md             Print markdown report to stdout
  browser-native --md --out report.md   Save markdown report to file
  browser-native --json | jq .summary   Pipe JSON to jq
`.trim();

function parseArgs(argv) {
  const args = {
    dir: ".",
    json: false,
    md: false,
    out: null,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
    } else if (arg === "--json") {
      args.json = true;
    } else if (arg === "--md") {
      args.md = true;
    } else if (arg === "--out") {
      args.out = argv[++i];
      if (!args.out) {
        console.error("Error: --out requires a file path argument");
        process.exit(1);
      }
    } else if (!arg.startsWith("-")) {
      args.dir = arg;
    } else {
      console.error(`Unknown option: ${arg}\nRun browser-native --help for usage.`);
      process.exit(1);
    }
  }

  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(HELP);
    process.exit(0);
  }

  const targetDir = resolve(args.dir);

  let scanResult;
  try {
    scanResult = scan(targetDir);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  const { results, totalDeps, packageJsons } = scanResult;

  // Choose formatter
  let output;
  if (args.json) {
    output = formatJson(results, totalDeps, packageJsons);
  } else if (args.md) {
    output = formatMarkdown(results, totalDeps, packageJsons);
  } else {
    output = formatTable(results, totalDeps, packageJsons);
  }

  // Output
  if (args.out) {
    const outPath = resolve(args.out);
    writeFileSync(outPath, output, "utf-8");
    console.log(`Report written to ${outPath}`);
  } else {
    process.stdout.write(output);
    if (!output.endsWith("\n")) process.stdout.write("\n");
  }

  // Exit code: 0 if no replaceable deps, 1 if there are (useful in CI)
  process.exit(results.length > 0 ? 1 : 0);
}

main();
