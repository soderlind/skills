# Determinism Checklist

Use this checklist before declaring a skill run complete.

1. Scope fixed: inputs and target files are explicit.
2. Read-first: inspect current state before edits.
3. Plan-first: preview actions before writes when tooling supports it.
4. Confirm-before-write: get user confirmation before destructive or broad writes.
5. One step, one done-test: each step has a checkable completion criterion.
6. Verify outcomes: run the smallest available validation commands.
7. Report skips: list what was skipped and why.
8. Stop on blockers: capture exact failing command and error summary.
