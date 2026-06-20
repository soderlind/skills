import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import replacements from "./replacements.js";

/**
 * @typedef {Object} ScanResult
 * @property {string}  name        – npm package name
 * @property {"dep"|"devDep"} type – dependency or devDependency
 * @property {string}  source      – relative path to the package.json
 * @property {import("./replacements.js").Replacement} replacement
 */

/**
 * Discover package.json files — root + well-known workspace directories.
 * @param {string} dir
 * @returns {string[]} absolute paths
 */
export function discoverPackageJsons(dir) {
  const root = resolve(dir);
  const rootPkg = join(root, "package.json");
  /** @type {string[]} */
  const found = [];

  if (!existsSync(rootPkg)) return found;
  found.push(rootPkg);

  const workspaceDirs = ["packages", "apps", "libs", "modules"];
  for (const wsDir of workspaceDirs) {
    const wsPath = join(root, wsDir);
    if (!existsSync(wsPath)) continue;
    try {
      for (const entry of readdirSync(wsPath, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const pkgPath = join(wsPath, entry.name, "package.json");
        if (existsSync(pkgPath)) found.push(pkgPath);
      }
    } catch {
      // permission error — skip
    }
  }

  return found;
}

/**
 * Scan a directory for replaceable dependencies.
 * @param {string} dir – root directory (defaults to cwd)
 * @returns {{ results: ScanResult[], totalDeps: number, packageJsons: string[] }}
 */
export function scan(dir) {
  const root = resolve(dir);
  const packageJsons = discoverPackageJsons(root);

  if (packageJsons.length === 0) {
    throw new Error(`No package.json found in ${root}`);
  }

  /** @type {ScanResult[]} */
  const results = [];
  const seen = new Set();
  let totalDeps = 0;

  for (const pkgPath of packageJsons) {
    const source = relative(root, pkgPath) || "package.json";
    const content = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const deps = content.dependencies ?? {};
    const devDeps = content.devDependencies ?? {};

    for (const name of Object.keys(deps)) {
      totalDeps++;
      const key = `${source}:${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const match = replacements[name];
      if (match) results.push({ name, type: "dep", source, replacement: match });
    }

    for (const name of Object.keys(devDeps)) {
      totalDeps++;
      const key = `${source}:${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const match = replacements[name];
      if (match) results.push({ name, type: "devDep", source, replacement: match });
    }
  }

  results.sort((a, b) => {
    if (a.replacement.confidence !== b.replacement.confidence) {
      return a.replacement.confidence === "full" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return { results, totalDeps, packageJsons };
}
