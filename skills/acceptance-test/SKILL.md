---
name: acceptance-test
description: "Learns an application from its code and docs, grills the user to agree on acceptance criteria, then writes and runs Playwright acceptance tests that trace back to each criterion. Use when the user wants acceptance, end-to-end, or user-journey tests, asks to verify a feature works from the user's point of view, or mentions Playwright."
compatibility: "Web applications reachable in a browser. Requires Node.js 18+ and @playwright/test (installed on demand). Works best with the grilling skill installed; falls back to built-in interview rules."
version: "1.0.0"
---

# Acceptance Test

The result is a passing (or honestly failing) Playwright suite in which every test maps to an acceptance
criterion the user has approved. Criteria come from the user, not from the code. The code only
shows what exists, not what should exist.

## Workflow

Copy this checklist and tick each phase off:

```
- [ ] 1. Learn: behavior inventory built from code + docs
- [ ] 2. Grill: criteria agreed, user confirmed shared understanding
- [ ] 3. Record: tests/acceptance/CRITERIA.md written
- [ ] 4. Set up: Playwright installed, app starts via webServer
- [ ] 5. Write: one test per criterion, IDs in titles
- [ ] 6. Run + triage: every failure classified
- [ ] 7. Report: criterion → result table
```

### 1. Learn (facts only, no user questions)

Read before asking anything. Use a sub-agent for large repos.

- **Docs:** README, `docs/`, CHANGELOG, specs, ADRs, issues linked from the task, `readme.txt`.
- **Entry points:** routes and pages, forms, API handlers that the UI calls, CLI or admin screens.
- **Run story:** `package.json` scripts, `composer.json`, Docker or `wp-env` config, `.env.example`, ports.
- **Auth and data:** login flow, roles, seed or fixture scripts, external services that need stubs.
- **Existing tests:** `playwright.config.*`, `tests/`, `e2e/`. Extend them rather than starting a parallel suite.

Produce a **behavior inventory**: a list of user-visible journeys, each with its evidence (`file:line` or doc section).
Mark anything the docs promise that the code does not implement, and anything the code does that the docs never mention.

### 2. Grill (decisions are the user's)

Run a `/grilling` session if that skill is installed. Otherwise follow its rules: ask in **rounds**.
Each round is the **frontier**, meaning every question whose prerequisites are already settled.
Number each question, give your recommended answer on a `➡️` line, and word it so "yes" accepts the recommendation.
Never answer a decision yourself. Look up facts yourself.

Design tree to cover (seed recommendations from the inventory):

1. **Scope:** which journeys are in, which are explicitly out, and which behavior inventory gaps count as bugs.
2. **Actors:** anonymous user, logged-in roles, admin. For each, list the credentials or a setup route.
3. **Criteria per journey:** Given / When / Then, including the main unhappy paths (validation, permission denied, empty state).
4. **Observable outcome:** what proves success (visible text, URL, persisted data after reload, email/API call stubbed).
5. **Environment:** start command, base URL, seed/reset strategy, network stubs, browsers, viewports.
6. **Policy:** where tests live, retries, whether failures caused by app bugs block the run.

Stop when the frontier is empty **and** the user confirms shared understanding. Do not write tests before that.

### 3. Record

Write `tests/acceptance/CRITERIA.md` (or the existing test dir). Give each criterion a stable ID such as `AC-01`,
and include its Given/When/Then, actor, and evidence. This file is the contract. Update it if the user changes their mind.

### 4. Set up

If Playwright is missing, install it with `npm i -D @playwright/test` and then run `npx playwright install --with-deps chromium`.
Add or extend `playwright.config.ts` with `webServer` so `npx playwright test` boots the app itself.
See [references/playwright.md](references/playwright.md) for config, auth and data patterns.

### 5. Write

- One `test.describe` per journey, one `test('AC-01 …')` per criterion.
- Locate elements by role, label, or text. Use `getByTestId` only as a last resort, and never use CSS or XPath for behavior.
- Use web-first assertions (`await expect(locator).toBeVisible()`). Never use `waitForTimeout`.
- Each test sets up its own state. Do not depend on test order or on data left by another test.
- Assert the outcome the user agreed on. Avoid assertions about implementation details.

### 6. Run + triage

```sh
npx playwright test tests/acceptance --reporter=list
```

Classify every failure before changing anything:

| Cause | Action |
| --- | --- |
| Test bug (bad locator, missing setup) | Fix the test and rerun |
| Environment (server down, port, missing seed) | Fix the setup and rerun |
| **App bug** (behavior contradicts an agreed criterion) | **Do not** weaken the assertion or patch the app. Mark it `test.fail()` with a note only if the user agrees, and report it |
| Criterion ambiguous | Return to grilling for that branch |

Rerun each fixed test with `--repeat-each=3` to catch flakiness. Use the trace viewer (`npx playwright show-trace`) for evidence.

### 7. Report

Show a table of `ID | criterion | result | evidence (trace/screenshot path)`. List the app bugs found and the criteria
left untested, with the reason for each. Do not commit unless asked.
