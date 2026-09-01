# Ability Authorization Audit Playbook

Worked examples for the two-tier model in [SKILL.md](../SKILL.md). Use these to
recognize the failure shapes, apply the cheap refactors first (rules 1–4), then
tackle ownership-model changes (rule 6).

The examples use a generic `myplugin_` prefix and `myplugin/...` ability names —
substitute your project's own prefix.

## 1. The shared gates (build these first)

Centralize both the error contract and the per-object check so no callback can
diverge or forget them.

```php
/**
 * Tier-1/tier-2 shared 403 contract. Every denial returns THIS shape.
 */
function myplugin_forbidden( string $message = 'Sorry, you are not allowed to do that.' ): WP_Error {
    return new WP_Error( 'rest_forbidden', $message, array( 'status' => 403 ) );
}

/**
 * Confirm an auth principal exists before any capability check.
 * MCP/agent or background invocations may have no current user.
 */
function myplugin_require_principal(): true|WP_Error {
    return get_current_user_id() > 0 ? true : myplugin_forbidden( 'Authentication required.' );
}

/**
 * Tier-2 per-object gate. Route EVERY object-touching ability through this.
 */
function myplugin_authorize_post( int $post_id, string $cap = 'edit_post' ): true|WP_Error {
    $principal = myplugin_require_principal();
    if ( is_wp_error( $principal ) ) {
        return $principal;
    }
    if ( $post_id <= 0 || ! get_post( $post_id ) ) {
        return myplugin_forbidden( 'Unknown object.' );
    }
    return current_user_can( $cap, $post_id ) ? true : myplugin_forbidden();
}
```

## 2. The centralized, filterable capability map (rule 4)

One source of truth for tier-1 caps, keyed by ability name and filterable.

```php
function myplugin_ability_cap( string $ability_name ): string {
    $map = array(
        'myplugin/edit-form'    => 'myplugin_edit_forms', // narrow custom cap
        'myplugin/create-form'  => 'manage_options',      // lifecycle
        'myplugin/delete-form'  => 'manage_options',      // lifecycle
        'myplugin/get-settings' => 'manage_options',      // settings/secrets
        'myplugin/list-subs'    => 'manage_options',      // submissions/user data
        'myplugin/embed-form'   => 'edit_posts',          // content embedding (+ manage_options below)
    );
    $cap = $map[ $ability_name ] ?? 'manage_options';

    return (string) apply_filters( 'myplugin_ability_cap', $cap, $ability_name );
}

function myplugin_ability_permission( string $ability_name ): callable {
    return static function () use ( $ability_name ): true|WP_Error {
        $principal = myplugin_require_principal();
        if ( is_wp_error( $principal ) ) {
            return $principal;
        }
        $cap = myplugin_ability_cap( $ability_name );
        return current_user_can( $cap ) ? true : myplugin_forbidden();
    };
}
```

## 3. IDOR: tier-1 pass, no tier-2 check

The most common finding. Tier 1 confirms "can edit *some* form"; without tier 2 the
caller edits *any* form by id.

### Before — vulnerable

```php
wp_register_ability(
    'myplugin/edit-form',
    array(
        // Tier 1: coarse cap only — object id not known yet. OK so far.
        'permission_callback' => static fn() => current_user_can( 'myplugin_edit_forms' ),
        'execute_callback'    => static function ( array $input ) {
            $form_id = (int) $input['form_id'];
            // IDOR: no per-object check. Any user with myplugin_edit_forms edits ANY form.
            return myplugin_update_form( $form_id, $input['fields'] );
        },
    )
);
```

### After — tier-2 gate added

```php
wp_register_ability(
    'myplugin/edit-form',
    array(
        'permission_callback' => myplugin_ability_permission( 'myplugin/edit-form' ),
        'execute_callback'    => static function ( array $input ) {
            $form_id = (int) $input['form_id'];

            // Tier 2: re-check against THIS object (ownership, locking, post-type).
            $authorized = myplugin_authorize_post( $form_id, 'edit_post' );
            if ( is_wp_error( $authorized ) ) {
                return $authorized;
            }

            return myplugin_update_form( $form_id, $input['fields'] );
        },
    )
);
```

## 4. Broken auth signal: denial as a non-WP_Error value (rule 1)

A denial returned as an application payload reads as HTTP 200 success to the caller
and to any agent orchestrating the ability.

### Before — wrong contract

```php
'execute_callback' => static function ( array $input ) {
    $form_id = (int) $input['form_id'];
    if ( ! current_user_can( 'edit_post', $form_id ) ) {
        // Wrong: 200 OK with a soft failure. Not an authorization error.
        return array( 'success' => false, 'message' => 'Not allowed' );
    }
    return myplugin_update_form( $form_id, $input['fields'] );
};
```

### After — WP_Error 403

```php
'execute_callback' => static function ( array $input ) {
    $form_id    = (int) $input['form_id'];
    $authorized = myplugin_authorize_post( $form_id, 'edit_post' );
    if ( is_wp_error( $authorized ) ) {
        return $authorized; // WP_Error, status 403.
    }
    return myplugin_update_form( $form_id, $input['fields'] );
};
```

## 5. Singular vs plural mismatch (rule 3)

- Tier 1 (no object): PLURAL, non-meta — `current_user_can( 'edit_posts' )`.
- Tier 2 (object id known): SINGULAR meta-cap — `current_user_can( 'edit_post', $id )`.

Using `edit_posts` in tier 2 skips the meta-cap map (`map_meta_cap`) and never
consults ownership/locking. Using `edit_post` without an id in tier 1 is a
malformed check that WordPress cannot resolve to a real capability.

## 6. Content embedding needs BOTH caps

Embedding writes a post, so tier 1 requires the form privilege AND post-authoring:

```php
'permission_callback' => static function (): true|WP_Error {
    $principal = myplugin_require_principal();
    if ( is_wp_error( $principal ) ) {
        return $principal;
    }
    return ( current_user_can( 'manage_options' ) && current_user_can( 'edit_posts' ) )
        ? true
        : myplugin_forbidden();
},
'execute_callback' => static function ( array $input ) {
    $post_id = (int) $input['post_id'];
    // Tier 2 against the target post with the singular meta-cap.
    $authorized = myplugin_authorize_post( $post_id, 'edit_post' );
    if ( is_wp_error( $authorized ) ) {
        return $authorized;
    }
    return myplugin_embed_form_in_post( $post_id, (int) $input['form_id'] );
},
```

## 7. Per-resource ownership over blanket manage_options (rule 6)

When real granularity is required, replace the category-wide admin gate with an
ownership predicate resolved at tier 2.

```php
function myplugin_user_owns_form( int $user_id, int $form_id ): bool {
    return (int) get_post_field( 'post_author', $form_id ) === $user_id;
}

function myplugin_authorize_form_owner( int $form_id ): true|WP_Error {
    $principal = myplugin_require_principal();
    if ( is_wp_error( $principal ) ) {
        return $principal;
    }
    $uid = get_current_user_id();
    if ( current_user_can( 'manage_options' ) || myplugin_user_owns_form( $uid, $form_id ) ) {
        return true;
    }
    return myplugin_forbidden();
}
```

## 8. Audit report format

Produce one row per ability:

| Ability | Tier-1 callback + caps | Tier-2 object check | Verdict |
| --- | --- | --- | --- |
| `myplugin/edit-form` | `myplugin_ability_permission` → `myplugin_edit_forms` | `myplugin_authorize_post($id,'edit_post')` | PASS |
| `myplugin/delete-form` | closure → `manage_options` | **MISSING** | FAIL — IDOR |
| `myplugin/list-subs` | closure → `array('success'=>false)` | n/a | FAIL — non-`WP_Error` denial |

For each FAIL, name the violated rule (1–6) and the concrete fix. Order fixes:
error-contract and shared gates (1–2) → centralized map (3–4) → ownership (5–6).
