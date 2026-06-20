/**
 * JSON output formatter.
 */

/**
 * @param {import("../scanner.js").ScanResult[]} results
 * @param {number} totalDeps
 * @param {string[]} packageJsons
 * @returns {string}
 */
export function formatJson(results, totalDeps, packageJsons) {
  const full = results.filter((r) => r.replacement.confidence === "full").length;

  const output = {
    summary: {
      scannedFiles: packageJsons.length,
      totalDependencies: totalDeps,
      replaceableCount: results.length,
      fullReplacements: full,
      partialReplacements: results.length - full,
    },
    replaceable: results.map((r) => ({
      package: r.name,
      type: r.type,
      source: r.source,
      category: r.replacement.category,
      browserApi: r.replacement.browserApi,
      confidence: r.replacement.confidence,
      notes: r.replacement.notes ?? null,
      minBrowser: r.replacement.minBrowser,
      before: r.replacement.before,
      after: r.replacement.after,
    })),
  };

  return JSON.stringify(output, null, 2);
}
