---
name: document-architecture
description: Create, improve, or audit repository architecture and concept documentation. Use when asked to document a codebase's architecture, domain model, component boundaries, data or control flows, invariants, failure behavior, change locations, or architectural decisions; create architecture.md, system-context, component, glossary, or ADR documents; make a repository easier for developers or AI coding agents to understand; or reconcile stale architecture documentation with code.
---

# Document Architecture

Produce an evidence-backed map of a software system that lets an unfamiliar developer or coding agent locate responsibilities, trace behavior, and change the system without violating its constraints.

## Workflow

### 1. Establish scope

Determine whether the request is to:

- document the current system;
- explain one subsystem or flow;
- audit and update existing documentation; or
- describe a proposed/target architecture.

Label current and proposed states explicitly. Never present aspiration as implemented behavior.

### 2. Inspect repository guidance

Read applicable `AGENTS.md` files and repository documentation first. Then inspect:

- root manifests, build configuration, and entry points;
- top-level source and test structure;
- public interfaces and dependency wiring;
- schemas, migrations, queues, events, and external integrations;
- representative tests for important behavior;
- existing diagrams and architecture decision records.

Prefer targeted search over reading every file. Follow one or two representative execution paths end to end. Treat code, configuration, schemas, and tests as evidence; call out unresolved contradictions.

### 3. Build the system map

Identify:

- system purpose and explicit non-goals;
- external actors and systems;
- major components and their responsibilities;
- public interfaces and dependency direction;
- trust, process, transaction, and persistence boundaries;
- core domain terms and lifecycle states;
- important data/control flows, including failures and retries;
- invariants and where code/tests enforce them;
- common changes and the files they require;
- non-obvious decisions that need an ADR.

Use exact repository-relative paths and symbol names. Do not infer guarantees that the code does not demonstrate.

### 4. Choose the smallest useful document set

For a small repository, prefer:

```text
docs/architecture.md
docs/glossary.md          # only if domain vocabulary is substantial
docs/decisions/           # only for durable, non-obvious decisions
```

For a larger repository, prefer:

```text
docs/architecture/
├── README.md
├── system-context.md
├── components.md
├── data-flow.md
├── domain-model.md
├── invariants.md
└── decisions/
```

Do not create files merely to match this layout. Split documents only when distinct audiences or change rates justify it.

Read [references/templates.md](references/templates.md) when drafting new documents or ADRs.

### 5. Write from overview to evidence

Make the first page answer:

1. What does the system do?
2. What are its major parts?
3. Where is each part implemented?
4. How does a representative request or job flow through it?
5. What boundaries and invariants must changes preserve?
6. Where should common changes be made?

Use:

- tables for component-to-path mappings;
- numbered lists for flows;
- Mermaid only when relationships are materially clearer visually;
- links to detailed documents rather than repeating content;
- short examples to disambiguate domain terms.

Include failure behavior, idempotency, concurrency, retries, ownership, and transaction boundaries when relevant. These are architecture, not implementation trivia.

### 6. Verify every material claim

For each component, flow, or invariant:

- confirm the referenced path and symbol exist;
- distinguish observed behavior from interpretation;
- link invariants to enforcement code and tests where possible;
- check commands and examples if they are included;
- remove stale or speculative claims.

If evidence is incomplete, write `Unknown` or a clearly marked open question instead of guessing.

### 7. Hand off

Summarize file-by-file changes. Note:

- important architecture findings;
- discrepancies between documentation and implementation;
- unverified assumptions or open questions;
- a minimal documentation review or test command.

## Quality rules

- Document responsibilities and constraints, not every file.
- Use one term for one domain concept; define overloaded terms.
- Prefer stable architectural facts over transient line-level details.
- Record prohibited dependencies and invalid transitions when meaningful.
- Keep diagrams paired with explanatory text.
- Keep current-state documentation close to the code and update it in the same change.
- Use ADRs for decisions and rationale; keep the overview focused on current behavior.

## Completion test

The documentation should let an unfamiliar reader answer without repository-wide searching:

- Where does a given responsibility belong?
- How does an important operation travel from entry point to side effect?
- Which state transitions or dependencies are allowed?
- What must remain true after a change?
- Which files and tests should change for a common feature?
- Why does a non-obvious architectural mechanism exist?
