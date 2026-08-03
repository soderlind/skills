---
name: pre-launch-security-audit
description: "Run an evidence-backed, stack-agnostic security and abuse-resistance review before an application launch. Use when reviewing an MVP, SaaS product, AI application, public website, API, or mobile backend that handles user data, authentication, public forms, databases, file uploads, webhooks, or paid third-party services; when asked for a launch-security checklist, OWASP review, secrets audit, database authorization review, authentication failure-case test, rate-limit or cost-abuse review, or final security gate."
compatibility: "Any stack or language. Uses whatever secret, dependency, static-analysis, and cloud-configuration scanners the project already has; active testing is limited to systems the user owns or authorizes."
version: "1.0.0"
---

# Pre-launch Security Audit

Establish a practical launch baseline without presenting a quick review as a penetration test, legal opinion, or compliance certification.

## Determinism checklist

Before declaring this skill run complete:

1. Scope fixed: inputs and target files are explicit.
2. Read-first: inspect current state before edits.
3. Plan-first: preview actions before writes when tooling supports it.
4. Confirm-before-write: get user confirmation before destructive or broad writes.
5. One step, one done-test: each step has a checkable completion criterion.
6. Verify outcomes: run the smallest available validation commands.
7. Report skips: list what was skipped and why.
8. Stop on blockers: capture exact failing command and error summary.

## Set scope

1. Identify entry points, trust boundaries, identities, privileged operations, sensitive data, paid resources, deployment environments, and third-party services.
2. Inspect the repository and configuration before making claims. Distinguish confirmed findings from unverified assumptions.
3. Ask only for information that cannot be inferred safely, such as the production architecture or authorization to test a live system.
4. Keep active testing within systems the user owns or has explicitly authorized. Prefer local, staging, and non-destructive tests.
5. Treat health, financial, biometric, children's, government, and similarly regulated data as requiring specialist review.

## Run the audit

Use [references/checklist.md](references/checklist.md) as the control set. Adapt controls to the stack; do not prescribe a named vendor when an equivalent control already exists.

### 1. Map exposure

Trace browser/mobile code, server routes, database access, object storage, background jobs, webhooks, logs, analytics, and external APIs. Record which code runs in an untrusted client and which credentials or permissions each component receives.

### 2. Inspect implementation

Search for:

- secrets, credentials, private endpoints, sensitive logging, and over-broad API responses;
- missing object- and function-level authorization;
- database policies, tenancy boundaries, unsafe queries, and privileged server clients;
- server-side input validation, output encoding, upload constraints, and generic production errors;
- authentication enumeration, reset/verification replay, session handling, and brute-force controls;
- rate limits, quotas, spend caps, timeouts, concurrency bounds, pagination, and payload limits;
- CORS, CSRF defenses, security headers, dependency risk, debug settings, and source-map exposure;
- bot resistance on public forms and signature/replay protection on webhooks.

Client-side validation, hidden UI controls, public identifiers, CORS, and CAPTCHA are not substitutes for server-side authorization.

### 3. Test failure cases

Create focused tests for malformed and oversized input, cross-user and cross-tenant access, repeated login/reset/verification attempts, duplicate submissions, expired or replayed tokens, direct API calls that bypass the UI, webhook replay, and expensive endpoint abuse. Do not claim a control works merely because configuration exists.

### 4. Use scanners as corroboration

Run available secret, dependency, static-analysis, framework, and cloud-configuration scanners when practical. Verify findings against code and runtime behavior. Do not dismiss an unscanned area as safe or treat a clean scan as proof of security.

### 5. Review privacy and licensing

Inventory collected data, purposes, processors, storage regions, retention, deletion paths, and user-facing disclosures. Identify third-party or generated code whose license or provenance needs review. State that applicable privacy, consumer, accessibility, sector, and intellectual-property obligations depend on jurisdiction and facts; recommend qualified counsel for legal conclusions.

## Report

Lead with a launch recommendation:

- **Block launch**: confirmed critical/high risk or unknown exposure that could reasonably cause unauthorized access, secret compromise, material cost abuse, or regulated-data harm.
- **Conditional launch**: bounded medium risks have owners, deadlines, monitoring, and rollback controls.
- **Baseline met**: tested launch controls pass, with residual risks and review limits stated.

For every finding include:

1. severity and confidence;
2. affected asset and exact evidence (`file:line`, route, configuration, or reproducible test);
3. plausible impact and attack path;
4. smallest effective remediation;
5. verification step.

Separate **confirmed findings**, **needs verification**, and **defense-in-depth improvements**. Never invent file locations, scanner results, legal requirements, or successful tests.

If asked to fix findings, make small changes in risk order, preserve project style, add regression tests, and rerun the relevant checks.

## Completion gate

Do not conclude until:

- critical and high findings are fixed or explicitly accepted by the authorized owner;
- suspected secret exposure has been checked and exposed secrets have been revoked or rotated;
- authorization is tested with at least two identities where user-scoped data exists;
- production errors and logs avoid sensitive disclosure;
- costly and public endpoints have enforceable abuse bounds;
- privacy/data-flow unknowns and residual risks are recorded;
- verification commands and any tests not run are listed.
