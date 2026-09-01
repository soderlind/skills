---
name: wp-ability-auth
description: "Audit or implement authorization for WordPress abilities (wp_register_ability) and REST routes using a two-tier permission model — a coarse capability gate in permission_callback and a per-object meta-capability check inside the execute callback. Use when adding permission_callback logic, reviewing wp_register_ability or register_rest_route authorization, hunting IDOR gaps, centralizing an ability→capability map, enforcing a consistent WP_Error 403 contract, or hardening abilities invoked via MCP/agent or background contexts."
compatibility: "WordPress plugins/themes registering abilities via wp_register_ability or REST routes via register_rest_route; PHP 7.4+."
version: "1.0.0"
---

# WordPress Ability Authorization (Two-Tier)

## When to use

- Adding or reviewing `permission_callback` on `wp_register_ability` / `register_rest_route`.
- Auditing abilities for IDOR (missing per-object authorization).
- Centralizing an ability→capability map, or fixing an inconsistent auth error contract.
- Hardening abilities that may run with no current user (MCP/agent/background contexts).

## The model

**Tier 1 — coarse capability gate (`permission_callback`).**
Runs before execution, when the object id is *not yet known*. Check only *general*
capabilities, classified by the privilege class the ability needs, not the object it touches:

| Ability class | Required capability (tier 1) |
| --- | --- |
| form/content *editing* | narrow custom cap (e.g. `myplugin_edit_forms`) OR `manage_options` |
| *lifecycle* (create / delete / duplicate / import) | `manage_options` |
| *settings* / secrets | `manage_options` |
| *submissions* / user data | `manage_options` |
| *content embedding* (writes posts) | `manage_options` AND `edit_posts` |

Must return `true` or `WP_Error( 'rest_forbidden', …, array( 'status' => 403 ) )`.

**Tier 2 — per-object authorization (inside the execute callback).**
Once the target id is resolved, re-check against THAT object using *singular meta*
capabilities: `current_user_can( 'edit_post', $post_id )`, `create_posts`, etc. This
honors ownership, locking, and post-type rules tier 1 cannot see.

## Non-negotiable rules

1. Both tiers return the SAME contract: `WP_Error` with an HTTP 403 status. Never signal an
   authorization failure as an application-level `array( 'success' => false )`.
2. Every ability touching a specific object MUST have a tier-2 check. Route it through one
   shared gate so it cannot be forgotten:
   `function authorize_post( int $post_id, string $cap = 'edit_post' ): true|WP_Error`
3. PLURAL caps (`edit_posts`) in tier 1; SINGULAR meta-caps (`edit_post`, `$id`) in tier 2.
4. Centralize the ability→capability map in ONE place; do not copy `current_user_can`
   checks across callbacks. Make the map filterable:
   `apply_filters( 'myplugin_ability_cap', $cap, $ability_name )`.
5. Confirm an auth principal exists before checking — MCP/agent or background invocations may
   have no current user (`get_current_user_id()` returns `0`).
6. Prefer per-resource ownership over blanket `manage_options` when real granularity is
   needed ("user owns form Y", not "user is an admin").

## Audit checklist

For each ability, report:

- Missing tier-2 per-object check → flag as potential **IDOR**.
- A tier-2 denial returned as a non-`WP_Error` value.
- Duplicated capability logic that should be centralized.
- An all-or-nothing `manage_options` gate where per-resource access was intended.
- Mismatched singular/plural capability usage between the two tiers.

## Deliverable

For each ability: `name`, tier-1 callback + required caps, tier-2 object check (or
**MISSING**), and a pass/fail verdict per rule above. Propose concrete fixes; make the cheap
refactors (rules 1–4) before larger ownership-model changes.

## Worked examples

See [audit-playbook.md](references/audit-playbook.md) for before/after PHP for each failure
shape — shared 403 gate, centralized filterable capability map, the IDOR fix, non-`WP_Error`
denial, singular/plural mismatch, dual-cap content embedding, per-resource ownership, and the
audit report table format.
