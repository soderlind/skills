import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { after, test } from "node:test";
import { pathToFileURL } from "node:url";

const workspace = process.cwd();
const requireFromWorkspace = createRequire(path.join(workspace, "package.json"));
const examplesPath = requireFromWorkspace.resolve("@coldtea/pr-lens-schema/examples");
const { minimalGraph, postmarkRefactorGraph } = await import(pathToFileURL(examplesPath).href);
const root = await mkdtemp(path.join(workspace, ".illustrate-design-test-"));
const renderer = path.join(root, "render.mjs");
await copyFile(new URL("./render.mjs", import.meta.url), renderer);

after(async () => {
  await rm(root, { recursive: true, force: true });
});

async function fixture(name, graph) {
  const directory = path.join(root, name);
  await mkdir(directory);
  const graphPath = path.join(directory, "graph.json");
  await writeFile(graphPath, JSON.stringify(graph));
  return { graphPath, outputDirectory: path.join(directory, "out") };
}

function run({ graphPath, outputDirectory }) {
  const result = spawnSync(process.execPath, [renderer, graphPath, outputDirectory], {
    cwd: workspace,
    encoding: "utf8",
  });
  if (result.error) throw result.error;
  return result;
}

test("renders every nested architecture and sequence view in both themes", async () => {
  const graph = structuredClone(postmarkRefactorGraph);
  for (const node of graph.nodes) node.badges = ["DRAFT"];
  const input = await fixture("complete", graph);
  const result = run(input);
  assert.equal(result.status, 0, result.stderr);

  const files = (await readdir(input.outputDirectory)).sort();
  assert.deepEqual(files, [
    "new-batch-path-dark.svg",
    "new-batch-path-light.svg",
    "overview-dark.svg",
    "overview-light.svg",
    "retired-path-dark.svg",
    "retired-path-light.svg",
    "send-pipeline-view-dark.svg",
    "send-pipeline-view-light.svg",
  ]);
  for (const file of files) {
    const svg = await readFile(path.join(input.outputDirectory, file), "utf8");
    assert.match(svg, /^<svg /);
    assert.match(svg, />DRAFT<\/text>/);
    assert.doesNotMatch(svg, /<script\b/);
  }
  const flow = await readFile(path.join(input.outputDirectory, "send-pipeline-view-light.svg"), "utf8");
  const firstStep = flow.indexOf(">enqueue broadcast job</text>");
  const secondStep = flow.indexOf(">onWrite trigger</text>", firstStep + 1);
  assert.ok(firstStep >= 0 && secondStep > firstStep);
});

test("reports broken references without creating output", async () => {
  const graph = structuredClone(postmarkRefactorGraph);
  graph.nodes[0].lane = "missing-lane";
  const input = await fixture("invalid", graph);
  const result = run(input);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /validation failed/i);
  assert.match(result.stderr, /missing-lane/);
  await assert.rejects(readdir(input.outputDirectory), { code: "ENOENT" });
});

test("renders a draft target snapshot without change badges", async () => {
  const graph = structuredClone(postmarkRefactorGraph);
  graph.title = "DRAFT: Target design";
  graph.summary = "A proposed design, not an implementation claim.";
  graph.provenance.base = { sha: graph.provenance.head.sha };
  delete graph.provenance.pullRequest;
  delete graph.walkthrough;
  for (const lane of graph.lanes) {
    if (lane.delta) lane.delta = "unchanged";
  }
  for (const node of graph.nodes) {
    node.delta = "unchanged";
    node.badges = ["DRAFT"];
  }
  for (const edge of graph.edges) edge.delta = "unchanged";
  for (const flow of graph.flows) {
    flow.delta = "unchanged";
    for (const message of flow.messages) message.delta = "unchanged";
  }
  graph.views = [
    { id: "draft-overview", title: "DRAFT: Target overview", lens: "architecture", scope: { kind: "all" } },
    {
      id: "draft-scenario",
      title: "DRAFT: Target scenario",
      lens: "data-flow",
      scope: { kind: "selection", flows: [graph.flows[0].id] },
    },
  ];
  const input = await fixture("snapshot", graph);
  const result = run(input);
  assert.equal(result.status, 0, result.stderr);
  const files = (await readdir(input.outputDirectory)).sort();
  assert.deepEqual(files, [
    "draft-overview-dark.svg",
    "draft-overview-light.svg",
    "draft-scenario-dark.svg",
    "draft-scenario-light.svg",
  ]);
  for (const file of files) {
    const svg = await readFile(path.join(input.outputDirectory, file), "utf8");
    assert.match(svg, />DRAFT<\/text>/);
    assert.doesNotMatch(svg, />(NEW|CHANGED|REMOVED)<\/text>/);
  }
});

test("requires explicit views", async () => {
  const input = await fixture("no-views", minimalGraph);
  const result = run(input);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /at least one architecture or data-flow view/i);
  await assert.rejects(readdir(input.outputDirectory), { code: "ENOENT" });
});

test("reports an unrenderable flow before writing any files", async () => {
  const graph = structuredClone(minimalGraph);
  graph.lenses.push("data-flow");
  graph.views = [
    { id: "overview", title: "Overview", lens: "architecture", scope: { kind: "all" } },
    { id: "empty-flow", title: "Empty flow", lens: "data-flow", scope: { kind: "all" } },
  ];
  const input = await fixture("empty-flow", graph);
  const result = run(input);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /flow/i);
  await assert.rejects(readdir(input.outputDirectory), { code: "ENOENT" });
});

test("uses safe filenames for view IDs containing path separators", async () => {
  const graph = structuredClone(minimalGraph);
  graph.views = [{ id: "a/../../elsewhere", title: "Overview", lens: "architecture", scope: { kind: "all" } }];
  const input = await fixture("safe-path", graph);
  const result = run(input);
  assert.equal(result.status, 0, result.stderr);
  const files = await readdir(input.outputDirectory);
  assert.equal(files.length, 2);
  assert.ok(files.every((file) => !file.includes("/") && file.endsWith(".svg")));
});

test("rejects filenames that collide on case-insensitive filesystems", async () => {
  const graph = structuredClone(minimalGraph);
  graph.views = [
    { id: "same", title: "One", lens: "architecture", scope: { kind: "all" } },
    { id: "SAME", title: "Two", lens: "architecture", scope: { kind: "all" } },
  ];
  const input = await fixture("collision", graph);
  const result = run(input);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /conflicting output filename/i);
  await assert.rejects(readdir(input.outputDirectory), { code: "ENOENT" });
});

test("refuses to overwrite existing output", async () => {
  const input = await fixture("existing", postmarkRefactorGraph);
  await mkdir(input.outputDirectory);
  const existing = path.join(input.outputDirectory, "overview-light.svg");
  await writeFile(existing, "keep this file");
  const result = run(input);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /refusing to overwrite/i);
  assert.equal(await readFile(existing, "utf8"), "keep this file");
  assert.deepEqual(await readdir(input.outputDirectory), ["overview-light.svg"]);
});
