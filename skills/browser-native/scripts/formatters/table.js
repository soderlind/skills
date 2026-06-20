/**
 * ANSI terminal table formatter — zero dependencies.
 */

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RED = "\x1b[31m";
const WHITE = "\x1b[37m";

/**
 * Pad string to a fixed visible width (ignoring ANSI codes).
 * @param {string} str
 * @param {number} width
 * @returns {string}
 */
function pad(str, width) {
  // Strip ANSI to measure visible length
  const visible = str.replace(/\x1b\[[0-9;]*m/g, "");
  const diff = width - visible.length;
  return diff > 0 ? str + " ".repeat(diff) : str;
}

/**
 * Truncate to max width, adding ellipsis.
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

/**
 * Format scan results as an ANSI-colored terminal table.
 * @param {import("../scanner.js").ScanResult[]} results
 * @param {number} totalDeps
 * @param {string[]} packageJsons
 * @returns {string}
 */
export function formatTable(results, totalDeps, packageJsons) {
  if (results.length === 0) {
    return `${GREEN}✓${RESET} No replaceable dependencies found among ${totalDeps} packages.\n`;
  }

  const lines = [];

  // Header
  lines.push("");
  lines.push(
    `${BOLD}${CYAN}browser-native${RESET}  Scanned ${packageJsons.length} package.json file(s), ${totalDeps} total dependencies`
  );
  lines.push("");

  // Column widths
  const colPkg = 28;
  const colCat = 20;
  const colApi = 32;
  const colConf = 10;

  // Table header
  const header = [
    pad(`${BOLD}Package${RESET}`, colPkg + 8), // +8 for ANSI codes
    pad(`${BOLD}Category${RESET}`, colCat + 8),
    pad(`${BOLD}Replace with${RESET}`, colApi + 8),
    pad(`${BOLD}Confidence${RESET}`, colConf + 8),
  ].join("  ");
  lines.push(header);

  const separator =
    "─".repeat(colPkg) +
    "  " +
    "─".repeat(colCat) +
    "  " +
    "─".repeat(colApi) +
    "  " +
    "─".repeat(colConf);
  lines.push(`${DIM}${separator}${RESET}`);

  // Rows
  for (const r of results) {
    const confColor = r.replacement.confidence === "full" ? GREEN : YELLOW;
    const confLabel =
      r.replacement.confidence === "full" ? "✓ full" : "◐ partial";
    const typeLabel = r.type === "devDep" ? `${DIM}(dev)${RESET}` : "";

    const row = [
      pad(`${WHITE}${truncate(r.name, colPkg - 6)}${RESET} ${typeLabel}`, colPkg + 16),
      pad(`${DIM}${truncate(r.replacement.category, colCat)}${RESET}`, colCat + 8),
      pad(
        `${CYAN}${truncate(r.replacement.browserApi, colApi)}${RESET}`,
        colApi + 8
      ),
      `${confColor}${confLabel}${RESET}`,
    ].join("  ");

    lines.push(row);

    if (r.replacement.notes) {
      lines.push(
        `  ${DIM}↳ ${truncate(r.replacement.notes, 90)}${RESET}`
      );
    }
  }

  // Summary
  const full = results.filter((r) => r.replacement.confidence === "full").length;
  const partial = results.length - full;
  lines.push("");
  lines.push(
    `${BOLD}Found ${results.length}${RESET} replaceable dep(s) of ${totalDeps} total ` +
      `(${GREEN}${full} full${RESET}, ${YELLOW}${partial} partial${RESET})`
  );
  lines.push(
    `${DIM}Run with --md for detailed before/after code examples.${RESET}`
  );
  lines.push("");

  return lines.join("\n");
}
