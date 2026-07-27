# Launch control checklist

Use only applicable controls. Mark each **pass**, **fail**, **not verified**, or **not applicable**, and attach evidence.

## Data and legal review

- Inventory personal, confidential, regulated, and authentication data.
- Document purpose, processor, storage location, retention, deletion, export, backup, and incident contacts.
- Confirm user-facing privacy and terms disclosures match actual behavior.
- Review third-party code, assets, models, datasets, and licenses where provenance is uncertain.
- Escalate jurisdiction-specific legal or compliance conclusions to qualified specialists.

## Secrets and client exposure

- Keep secret credentials out of client bundles, repositories, logs, errors, analytics, build artifacts, and network responses.
- Verify any client-visible key is intentionally publishable and constrained by server-side authorization or provider policy.
- Scan current files and version history when exposure is plausible.
- Revoke or rotate suspected exposed secrets; removing the string from code is insufficient.
- Grant runtime identities and service credentials least privilege.

## Database and storage authorization

- Enforce authorization server-side for every read and mutation.
- Test cross-user, cross-tenant, anonymous, and privileged access.
- Review row/document policies, object-storage rules, default privileges, admin clients, and direct database/API access.
- Avoid relying on guessed identifiers or UI filtering for isolation.
- Limit returned fields and records; paginate and cap queries.

## Input, output, and errors

- Validate type, format, size, range, and business invariants on the trusted side.
- Parameterize database queries and encode output for its context.
- Constrain uploads by type, size, count, storage location, and retrieval behavior.
- Return generic production errors; keep sensitive diagnostic context in protected logs.
- Disable production debug modes and public stack traces.

## Authentication and sessions

- Use generic responses for login, signup, recovery, and verification where enumeration matters.
- Throttle repeated attempts without creating an easy account-lockout denial of service.
- Make reset, verification, invitation, and magic-link tokens scoped, expiring, single-use, and replay-safe.
- Protect session tokens; rotate or invalidate them at appropriate state changes.
- Require recent authentication or stronger assurance for sensitive operations.

## Abuse and cost controls

- Rate-limit public, authentication, search, upload, messaging, export, and paid-API endpoints by suitable identity dimensions.
- Add hard quotas, spend caps, alerts, timeouts, concurrency limits, payload limits, and pagination.
- Prevent unbounded retries, fan-out, recursion, background jobs, and model/token consumption.
- Add bot resistance to abuse-prone public forms while retaining server-side validation and throttling.
- Define monitoring, rollback, and kill-switch procedures.

## Browser and API boundaries

- Restrict CORS to required origins, methods, and headers; remember CORS is a browser policy, not access control.
- Apply CSRF defenses to cookie-authenticated state changes.
- Configure appropriate transport and browser security headers.
- Authenticate webhooks, compare signatures safely, bound timestamp skew, and reject replays.
- Avoid sensitive caching and unintended production source or source-map exposure.

## Dependencies and deployment

- Run available secret, dependency, static-analysis, framework, and cloud-policy scans.
- Triage reachable and relevant findings rather than blindly applying upgrades.
- Confirm production environment separation, least privilege, backups, restoration, logging access, and alert delivery.
- Record tool coverage, scan date, ignored findings, and untested areas.

## Minimum failure-case suite

- Malformed, missing, oversized, duplicate, and unexpected input.
- Direct API use with client checks bypassed.
- Anonymous, wrong-user, wrong-tenant, and downgraded-role access.
- Repeated wrong-password, recovery, verification, and signup attempts.
- Expired, reused, and concurrently submitted tokens.
- Duplicate or replayed webhook and payment events.
- Burst and sustained traffic against the most expensive route.
