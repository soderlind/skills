# Triage Playbook

How to turn a surviving mutant into a test that would have caught it.

## The rule that governs every entry below

A survivor tells you *which line* lacks an assertion. It does not tell you what the
assertion should say. Derive that from intended behaviour — a requirement, the plugin's
documentation, an existing test's stated intent, or the function's contract.

If intent cannot be established, report the survivor as **needs human judgement**. Do not
assert whatever the code currently returns. That kills the mutant, tests nothing, and
breaks on the next legitimate refactor.

## Mutant kind → killing assertion

| Mutant kind | What survival proves | Assertion that kills it |
| --- | --- | --- |
| **Return value** (`return $x` → `return null` / `[]` / `0`) | Nothing inspects the return value | Assert on the returned value, not just that no exception was thrown |
| **Conditional boundary** (`>` → `>=`) | No test sits on the boundary | Test at the boundary and one either side |
| **Negation / true-false** (`if ($x)` → `if (true)`) | Only one branch is tested | Test the other branch, especially the rejection path |
| **Method call removal** | The call has no observable effect in tests | Assert the side effect: stored value, emitted action, escaped output |
| **Arithmetic** (`+` → `-`) | The computed value is never checked | Assert the exact computed result, not merely its type |
| **Logical operator** (`&&` → `\|\|`) | Only one combination of operands is tested | Add cases where the operands differ |
| **String literal** | The string is never asserted | Assert the exact key, slug, capability, or option name |
| **Array item removal** | Collection contents are unchecked | Assert membership and length, not just emptiness |
| **Increment / decrement** | Off-by-one is undetectable | Assert exact counts and offsets |
| **Default parameter** | The default is never exercised | Call the function without the argument and assert the result |

## Tier 1 — security-control survivors

These are the reason to run mutation testing on a WordPress plugin at all.

### Capability check

```php
public function save_settings(): void {
    if ( ! current_user_can( 'manage_options' ) ) {
        return;
    }
    update_option( 'acme_settings', $this->sanitize( $_POST['acme'] ?? [] ) );
}
```

A survivor on the condition means no test proves an unauthorized user is blocked. Coverage
was green because the *authorized* test walked the line.

```php
it( 'refuses to save settings without manage_options', function () {
    // subscriber-level user
    $this->settings->save_settings();

    expect( get_option( 'acme_settings' ) )->toBeFalse();
} );
```

Assert the **absence of the side effect**. A test that merely calls the method and expects
no exception kills nothing.

### Nonce verification

```php
if ( ! wp_verify_nonce( $_POST['_wpnonce'] ?? '', 'acme_save' ) ) {
    wp_die( esc_html__( 'Invalid request.', 'acme' ) );
}
```

Kill it with a request carrying a missing, wrong-action, and expired nonce — three cases,
each asserting the rejection.

### Escaping and sanitization

```php
echo '<span>' . esc_html( $label ) . '</span>';
```

A removed `esc_html()` survives whenever the fixture is a boring ASCII string. Use a
payload that renders differently when unescaped:

```php
it( 'escapes the label', function () {
    $output = $this->renderer->render( '<script>alert(1)</script>' );

    expect( $output )->not->toContain( '<script>' );
    expect( $output )->toContain( '&lt;script&gt;' );
} );
```

The same applies to `sanitize_text_field()`, `wp_kses_post()`, and `absint()` — assert the
*transformed* value with input that actually needs transforming.

### Prepared statements

A survivor around `$wpdb->prepare()` usually means the query is asserted as a whole string
rather than by its bound arguments. Assert the arguments, and include a fixture containing
a quote character.

## Tier 2 — data-integrity survivors

- `update_option` / `delete_option` — assert the stored value *and* the exact option name.
  A string-literal mutant on the key survives any test that reads back through the same
  constant.
- `*_post_meta` — assert single vs array retrieval; `get_post_meta()` with the wrong
  `$single` flag hides plenty of mutants.
- `set_transient` — assert the expiry argument, not only the value.
- Serialization — round-trip through the real store, not a mock, or the format mutant
  survives.

## Tier 3 — hook-wiring survivors

```php
add_action( 'init', [ $this, 'register_post_type' ], 20, 1 );
```

Priority and `accepted_args` mutants survive unless the test asserts them:

```php
it( 'registers the post type at priority 20', function () {
    expect( has_action( 'init', [ $this->plugin, 'register_post_type' ] ) )->toBe( 20 );
} );
```

`has_action()` returns the priority, not `true`, when the callback is attached — which is
exactly what makes this assertable. Priority matters whenever the plugin must run before or
after another; if it genuinely does not matter, this is an equivalent mutant, so suppress
it with that reason.

## JavaScript

```js
export function formatPrice( cents, currency = 'USD' ) {
  if ( cents < 0 ) {
    return null;
  }
  return new Intl.NumberFormat( 'en-US', { style: 'currency', currency } ).format( cents / 100 );
}
```

Typical survivors and their fixes:

- `cents < 0` → `cents <= 0`: add a `0` case and assert `'$0.00'`, not `null`.
- `cents / 100` → `cents * 100`: assert the exact formatted string.
- Default `'USD'` removed: call `formatPrice( 1000 )` with no second argument.
- `return null` → `return undefined`: assert `toBeNull()`, not `toBeFalsy()`.

That last one generalises: loose assertions (`toBeTruthy`, `toBeDefined`, `not.toThrow`)
are the single largest source of survivors in any suite.

## Recognising an equivalent mutant

Suppress, with a written reason, when the mutation cannot change observable behaviour:

- The mutated value is discarded (`$i++` → `++$i` on an unused result).
- A defensive guard that no reachable input can trigger.
- A short-circuit reordering where both operands are pure and cheap.
- Log or debug text with no assertable consequence.
- Hook priority where ordering is genuinely irrelevant.

Before suppressing, try once to construct the input that distinguishes the two versions. If
that input exists, it is not equivalent — it is a missing test.

## When to stop

Stop triaging a file when the remaining survivors are all equivalent or all require
production-code redesign to become testable. Record what is left and why. Driving the score
to 100% is not the goal; knowing which untested behaviour you are choosing to accept is.
