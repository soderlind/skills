# Architecture documentation templates

Use only the sections supported by the repository and the task. Replace every placeholder; do not leave invented examples in final documentation.

## Architecture overview

```markdown
# Architecture

## Purpose

<One paragraph describing the system's responsibility and users.>

## Scope

Included:

- <responsibility>

Not included:

- <explicit non-goal>

## Major components

| Component | Responsibility | Implementation | Depends on |
|---|---|---|---|
| `<name>` | <one clear responsibility> | `<path>` | `<interface/component>` |

## Representative flow

1. `<entry point>` receives <input>.
2. `<symbol>` validates or transforms it.
3. `<symbol>` applies domain rules.
4. `<symbol>` performs the side effect.

## Boundaries and constraints

- <dependency direction or prohibited dependency>
- <trust, transaction, process, or persistence boundary>
- <retry, idempotency, or concurrency requirement>

## Where to make changes

| Change | Primary location | Also update |
|---|---|---|
| <common change> | `<path/symbol>` | `<tests/docs/schema>` |

## Further reading

- [Domain model](domain-model.md)
- [Important flow](data-flow.md)
- [Decisions](decisions/)
```

## Component

```markdown
## <Component name>

Location: `<path>`

Responsibilities:

- <owned behavior>

Public interface:

- `<symbol>`

Depends on:

- `<abstraction or component>`

Must not depend on:

- `<forbidden layer or concrete implementation>`

State and persistence:

- <owned data and transaction boundary>

Failure behavior:

- <error classification, propagation, retry, or recovery>

Tests:

- `<test path>`
```

## Domain model

```markdown
# Domain model

## Terms

### <Term>

<Precise definition and distinction from similar terms.>

Implemented by: `<path or symbol>`

## Lifecycle

| State | Meaning | Allowed next states |
|---|---|---|
| `<state>` | <meaning> | `<state>`, `<state>` |

Invalid transitions are rejected by `<symbol>` and covered by `<test>`.
```

## Flow

```markdown
# <Flow name>

Trigger: <request, event, schedule, or command>

1. `<entry point>` receives <input>.
2. <validation/authentication step>.
3. <domain operation>.
4. <persistence or external side effect>.
5. <result, event, or response>.

## Failure behavior

| Failure | Behavior | Retry owner |
|---|---|---|
| <condition> | <return, rollback, compensate, or continue> | <caller/system/none> |

## Boundaries

- Transaction: <start/end>
- Idempotency key: <source and enforcement>
- Concurrency control: <lock/version/lease/none>
- Trust boundary: <where untrusted data becomes validated>
```

## Invariants

```markdown
# Invariants

## <Invariant name>

Rule: <statement that must always remain true>

Enforced by:

- `<schema constraint or code symbol>`
- `<validation or transaction>`

Verified by:

- `<test path>`

Changes affecting this invariant:

- `<path, component, or operation>`
```

## Architecture decision record

Use an ADR only for a durable choice whose alternatives and rationale matter to future changes.

```markdown
# ADR NNNN: <Decision title>

Status: Proposed | Accepted | Superseded by ADR-NNNN
Date: YYYY-MM-DD

## Context

<Forces, constraints, and problem.>

## Decision

<Chosen approach stated directly.>

## Alternatives considered

- <alternative and why it was not selected>

## Consequences

Positive:

- <benefit>

Negative:

- <cost, risk, or operational obligation>

## Relevant implementation

- `<path or symbol>`
```
