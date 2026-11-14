#!/usr/bin/env node

// Measures WCAG 2.2 contrast for the colour pairs PR Lens paints, in both
// themes, using the installed renderer palette plus optional overrides.
//
//   node check-contrast.mjs [--palette overrides.json] [--svg rendered-dir]
//
// --svg reads the faded card opacities from rendered SVGs instead of the
// defaults. Exits 1 when a required pair fails. Pairs that appear only in change
// (diff) diagrams print "warn" instead, because their colours cannot be
// overridden safely. render.mjs imports loadOverrides and applyOverrides from
// this file for its --palette option.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { paletteFor } from "@coldtea/pr-lens-renderer";

const THEMES = ["light", "dark"];
// Keys whose default colour is unique in the SVG (or targeted by element class),
// so a substitution cannot repaint something else.
const OVERRIDABLE = ["foreground", "muted", "edge", "lifeline"];
// Sequence participants outside the flow ("context") and removed nodes in
// change diagrams ("ghost") are drawn faded, text included.
const DEFAULT_OPACITY = { context: 0.82, ghost: 0.55 };

export async function loadOverrides(file) {
  const raw = JSON.parse(await readFile(file, "utf8"));
  const overrides = {};
  for (const [theme, values] of Object.entries(raw)) {
    if (!THEMES.includes(theme)) throw new Error(`Unknown theme "${theme}" in ${file}; use light or dark.`);
    for (const [key, colour] of Object.entries(values)) {
      if (!OVERRIDABLE.includes(key)) {
        throw new Error(`Cannot override "${key}"; supported keys: ${OVERRIDABLE.join(", ")}.`);
      }
      if (!/^#[0-9a-f]{6}$/i.test(colour)) throw new Error(`${theme}.${key} must be a #rrggbb colour.`);
    }
    overrides[theme] = { ...values };
  }
  return overrides;
}

export function applyOverrides(svg, theme, overrides) {
  const base = paletteFor(theme);
  const values = overrides?.[theme] ?? {};
  let out = svg;
  for (const [key, colour] of Object.entries(values)) {
    if (key === "lifeline") continue;
    const clash = Object.entries(base).find(([other, value]) => other !== key && value === base[key]);
    if (clash) throw new Error(`${theme}.${key} shares ${base[key]} with ${clash[0]}; it cannot be overridden safely.`);
    out = out.replaceAll(`"${base[key]}"`, `"${colour}"`);
  }
  // Lifelines can share a colour with card borders, so only lifeline elements change.
  if (values.lifeline) {
    out = out.replace(/(<line class="lifeline"[^>]*?stroke=")[^"]+(")/g, `$1${values.lifeline}$2`);
  }
  return out;
}

const parse = (colour) => {
  if (colour.startsWith("#")) return [1, 3, 5].map((i) => parseInt(colour.slice(i, i + 2), 16)).concat(1);
  const [r, g, b, a = 1] = colour.match(/[\d.]+/g).map(Number);
  return [r, g, b, a];
};
const over = (fg, bg) => {
  const [r, g, b, a] = typeof fg === "string" ? parse(fg) : fg;
  return [r * a + bg[0] * (1 - a), g * a + bg[1] * (1 - a), b * a + bg[2] * (1 - a), 1];
};
const fade = (colour, bg, opacity) => over([colour[0], colour[1], colour[2], opacity], bg);
const luminance = (colour) => {
  const [r, g, b] = colour.slice(0, 3).map((x) => {
    x /= 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

export function contrastPairs(palette, opacity = DEFAULT_OPACITY) {
  const bg = parse(palette.background);
  const card = over(palette.card, bg);
  const lane = over(palette.lane, bg);
  const fg = parse(palette.foreground);
  const muted = parse(palette.muted);
  const faded = fade(card, bg, opacity.context);
  const ghost = fade(card, bg, opacity.ghost);
  return [
    ["text", "foreground on card", fg, card, 4.5],
    ["text", "muted on card", muted, card, 4.5],
    ["text", "muted on chip", muted, over(palette.chip, card), 4.5],
    ["text", "muted on edge-label pill", muted, over(palette.pill, bg), 4.5],
    ["text", "muted on lane", muted, lane, 4.5],
    ["text", "muted on background", muted, bg, 4.5],
    ["text", `foreground on faded context card (${opacity.context})`, fade(fg, bg, opacity.context), faded, 4.5],
    ["text", `muted on faded context card (${opacity.context})`, fade(muted, bg, opacity.context), faded, 4.5],
    ["diff", "added badge text on its fill", parse(palette.addedText), over(palette.addedFill, card), 4.5],
    ["diff", "changed badge text on its fill", parse(palette.modifiedText), over(palette.modifiedFill, card), 4.5],
    ["diff", "removed badge text on its fill", parse(palette.removedText), over(palette.removedFill, card), 4.5],
    ["diff", `foreground on removed (ghost) card (${opacity.ghost})`, fade(fg, bg, opacity.ghost), ghost, 4.5],
    ["diff", `muted on removed (ghost) card (${opacity.ghost})`, fade(muted, bg, opacity.ghost), ghost, 4.5],
    ["graphic", "edge on background", parse(palette.edge), bg, 3],
    ["graphic", "edge on lane", parse(palette.edge), lane, 3],
    ["graphic", "lifeline on background", over(palette.lifeline, bg), bg, 3],
    ["decorative", "card border on background", over(palette.cardBorder, bg), bg, 0],
  ];
}

async function opacityFrom(directory) {
  const found = { context: [], ghost: [] };
  for (const file of (await readdir(directory)).filter((name) => name.endsWith(".svg"))) {
    const svg = await readFile(path.join(directory, file), "utf8");
    for (const match of svg.matchAll(/<g class="cardsh (context|ghost)"[^>]*\bopacity="([\d.]+)"/g)) {
      found[match[1]].push(Number(match[2]));
    }
  }
  return {
    context: found.context.length ? Math.min(...found.context) : DEFAULT_OPACITY.context,
    ghost: found.ghost.length ? Math.min(...found.ghost) : DEFAULT_OPACITY.ghost,
  };
}

async function main(args) {
  const option = (name) => {
    const index = args.indexOf(name);
    if (index === -1) return undefined;
    if (!args[index + 1]) throw new Error(`${name} needs a value.`);
    return args[index + 1];
  };
  const palettePath = option("--palette");
  const svgDirectory = option("--svg");
  const overrides = palettePath ? await loadOverrides(palettePath) : {};
  const opacity = svgDirectory ? await opacityFrom(svgDirectory) : DEFAULT_OPACITY;

  let failed = false;
  let warned = false;
  for (const theme of THEMES) {
    console.log(`\n${theme}`);
    const palette = { ...paletteFor(theme), ...overrides[theme] };
    for (const [kind, name, a, b, min] of contrastPairs(palette, opacity)) {
      const ratio = contrast(a, b);
      const status = min === 0 ? "info" : ratio >= min ? "ok  " : kind === "diff" ? "warn" : "FAIL";
      if (status === "FAIL") failed = true;
      if (status === "warn") warned = true;
      console.log(`${status} ${ratio.toFixed(2).padStart(5)}:1  ${min ? `(min ${min})` : "         "}  ${kind}: ${name}`);
    }
  }
  if (warned) console.log("\nwarn: change-diagram colours below the minimum; report them as a limitation.");
  return failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
