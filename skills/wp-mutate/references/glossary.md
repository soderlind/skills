# Mutation Testing Glossary

Canonical vocabulary for `wp-mutate`. Engines disagree on terminology; translate at the
report boundary and always print the canonical word.

## Engine translation table

| Canonical | Pest | Infection | Stryker |
| --- | --- | --- | --- |
| **Killed** | tested | killed | killed |
| **Survived** | untested | escaped | survived |
| **Not covered** | uncovered | not covered | NoCoverage |
| **Timed out** | — | timed out | timeout |
| **Errored** | — | errored | runtime error |
| **Suppressed** | ignored (`@pest-mutate-ignore`) | ignored (`@infection-ignore-all`) | ignored (`// Stryker disable`) |

The trap worth repeating: Pest's **untested** means "the test ran the line and did not
notice the change". It does *not* mean "no test exists" — that is Pest's **uncovered**.
Reading Pest output with Infection's vocabulary in your head inverts the diagnosis.

## Terms

**Mutant** — one generated change to a single location in source. A mutation *operator*
(or *mutator*) is the rule that generated it, e.g. `ConditionalBoundary`, `ReturnValue`.

**Killed** — at least one test failed when the mutant was active. The desired outcome. By
convention, timeouts and runtime errors count as killed: the suite noticed *something*.

**Survived** — the mutant was on a line that tests executed, and the whole suite still
passed. This is the actionable signal, and the only reason to run mutation testing. It
means the code path is exercised but its behaviour is not asserted.

**Not covered** — no test executes the line, so the mutant was never even attempted. This
is a coverage gap, not a test-quality gap. Fix it by writing a test, not by strengthening
an assertion. Reporting these mixed in with survivors sends people to the wrong work.

**Equivalent mutant** — a mutant that is semantically identical to the original, so no test
can ever kill it. Example: mutating `$i++` to `++$i` where the value is unused. Equivalent
mutants put a hard ceiling below 100% on every real codebase. Detecting them is
undecidable in general, so they are a human judgement call, recorded as a suppression with
a written reason.

**Mutation score** — killed / all mutants. Not-covered mutants count against you.

**Covered-code score** — killed / mutants on covered lines only. Infection calls this
*Covered Code MSI*; Pest approximates it with `--covered-only`; Stryker calls it *mutation
score based on covered code*.

Report both, always. A suite covering 20% of the codebase can post an excellent
covered-code score while the mutation score sits in the teens. Either number alone is a
half-truth.

**MSI** — Mutation Score Indicator. Infection's name for the mutation score.

**Ratchet** — pinning the minimum threshold at the currently measured score so it can only
improve. Preferred over an aspirational fixed target, which tends to get disabled.

**Change-detector test** — a test that asserts whatever the implementation currently does
rather than what it should do. It kills mutants and provides no value, breaking on every
legitimate refactor. The main hazard when generating tests to raise a mutation score.
