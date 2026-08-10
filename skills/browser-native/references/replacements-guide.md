# Browser-Native Replacements Guide

Quick-reference for every npm package in the scanner database, grouped by category.  
Each entry shows: the native API, minimum browser/Node.js version, confidence, caveats, and before/after code.

## Reading confidence vs. Baseline

Two independent signals decide whether a swap is safe:

- **Confidence** — does the native API *do what the library does*? `full` = drop-in; `partial` = covers common cases, check your usage.
- **Baseline** — can *your users run it*? ([webstatus.dev](https://webstatus.dev) / MDN badges)
  - **🟢 widely** — in all major engines 30+ months. Adopt freely.
  - **🟡 newly** — recently in all major engines. Check `browserslist`/analytics or ship behind a feature check + fallback.
  - **🔴 limited** — not in all engines yet. Keep the library or polyfill.

A `full` + `newly` API (e.g. `Object.groupBy`) is functionally a drop-in but still audience-dependent. Before any swap, ask: (1) Baseline-safe for my audience? (2) Is the polyfill/rewrite cost worth it? (3) Does the native feature cover how I actually use the library?

For `newly` features, prefer progressive enhancement over a hard swap:

```js
if (typeof Intl.DurationFormat === 'function') {
  // native
} else {
  // fallback / keep the library
}
```

---

## HTTP

### axios → `fetch()`
- **Confidence:** partial
- **Min support:** Chrome 42, Firefox 39, Safari 10.1, Edge 14, Node 18
- **Notes:** fetch does not reject on HTTP error status. Interceptors / automatic JSON transform need manual handling.

```js
// Before
const axios = require('axios');
const { data } = await axios.get('/api/items', {
  headers: { Authorization: 'Bearer token' }
});

// After
const res = await fetch('/api/items', {
  headers: { Authorization: 'Bearer token' }
});
if (!res.ok) throw new Error(res.statusText);
const data = await res.json();
```

### node-fetch → `fetch()`
- **Confidence:** full
- **Min support:** Chrome 42, Firefox 39, Safari 10.1, Edge 14, Node 18
- **Notes:** Node.js 18+ ships global fetch. No longer needed.

```js
// Before
const fetch = require('node-fetch');
const res = await fetch('https://api.example.com/data');

// After — just remove the import
const res = await fetch('https://api.example.com/data');
```

### request → `fetch()`
- **Confidence:** partial
- **Notes:** Package is deprecated. fetch covers most use cases; streaming differs.

### got, superagent, needle → `fetch()`
- **Confidence:** partial
- **Notes:** These have retries, hooks, chaining. fetch needs manual helpers for those.

### isomorphic-fetch, cross-fetch, whatwg-fetch, unfetch → `fetch()`
- **Confidence:** full
- **Notes:** Polyfills — just remove.

---

## URL / Query String

### query-string → `URLSearchParams`
- **Confidence:** partial
- **Min support:** Chrome 49, Firefox 44, Safari 10.1, Edge 17, Node 10
- **Notes:** URLSearchParams does not support nested objects or array bracket syntax.

```js
// Before
import queryString from 'query-string';
const parsed = queryString.parse('?foo=bar&name=John');
const str = queryString.stringify({ foo: 'bar' });

// After
const params = new URLSearchParams('?foo=bar&name=John');
const parsed = Object.fromEntries(params);
const str = new URLSearchParams({ foo: 'bar' }).toString();
```

### qs → `URLSearchParams`
- **Confidence:** partial
- **Notes:** URLSearchParams does not support nested objects. Only a replacement for flat key-value pairs.

### url-parse → `URL`
- **Confidence:** full
- **Min support:** Chrome 32, Firefox 19, Safari 7, Edge 12, Node 10

```js
// Before
const parse = require('url-parse');
const url = parse('https://example.com:8080/path?q=1');

// After
const url = new URL('https://example.com:8080/path?q=1');
// url.hostname, url.pathname, url.searchParams.get('q')
```

### querystring, url-search-params-polyfill → `URLSearchParams`
- **Confidence:** full
- **Notes:** Node.js legacy module. URLSearchParams is the modern replacement.

---

## Object Utilities

### lodash.clonedeep, clone-deep, rfdc → `structuredClone()`
- **Confidence:** full
- **Min support:** Chrome 98, Firefox 94, Safari 15.4, Edge 98, Node 17
- **Notes:** structuredClone does not clone functions or DOM nodes. Handles circular refs.

```js
// Before
const cloneDeep = require('lodash.clonedeep');
const copy = cloneDeep(original);

// After
const copy = structuredClone(original);
```

### lodash.assign, object-assign, object.assign → `Object.assign()` / spread
- **Confidence:** full
- **Min support:** Chrome 45, Firefox 34, Safari 9, Edge 12, Node 4

```js
// Before
const assign = require('lodash.assign');
const result = assign({}, obj1, obj2);

// After
const result = { ...obj1, ...obj2 };
```

### lodash.keys, object-keys → `Object.keys()`
### lodash.values, object.values → `Object.values()`
### lodash.entries, object.entries → `Object.entries()`
### object.fromentries, fromentries → `Object.fromEntries()`
### has, has-own, object.hasown → `Object.hasOwn()`

All **full** confidence — direct native equivalents.

### lodash.get, dlv → optional chaining + `??`
- **Confidence:** partial
- **Notes:** Good for fixed property paths. String-path traversal and keys containing dots need manual rewrites.

---

## Array Utilities

### lodash.flatten, array-flatten → `Array.prototype.flat()`
- **Confidence:** full
- **Min support:** Chrome 69, Firefox 62, Safari 12, Edge 79, Node 11

```js
// Before
const flatten = require('lodash.flatten');
flatten([1, [2, [3]]]);

// After
[1, [2, [3]]].flat();         // depth 1
[1, [2, [3]]].flat(Infinity); // all levels
```

### lodash.find → `.find()`
### lodash.findindex → `.findIndex()`
### lodash.includes, array-includes → `.includes()`
### lodash.foreach → `.forEach()`
### lodash.map → `.map()`
### lodash.filter → `.filter()`
### lodash.reduce → `.reduce()`
### lodash.every → `.every()`
### lodash.some → `.some()`

All **full** confidence — these are native array methods available everywhere.

### lodash.uniq → `[...new Set()]`
- **Confidence:** full

```js
// Before
const uniq = require('lodash.uniq');
uniq([1, 2, 2, 3]);

// After
[...new Set([1, 2, 2, 3])];
```

### lodash.compact → `.filter(Boolean)`
- **Confidence:** full

```js
[0, 1, false, 2, '', 3].filter(Boolean); // [1, 2, 3]
```

### lodash.groupby → `Object.groupBy()` / `Map.groupBy()`
- **Confidence:** full · **Baseline:** 🟡 newly (2024)
- **Min support:** Chrome 117, Firefox 119, Safari 17.4, Edge 117, Node 21
- **Notes:** Check your audience or add a fallback. `Object.groupBy` returns a null-prototype object; use `Map.groupBy` for non-string keys.

```js
// Before
const byCat = groupBy(products, p => p.category);

// After
const byCat = Object.groupBy(products, p => p.category);
```

### lodash.union / lodash.intersection / lodash.difference → `Set` methods
- **Confidence:** partial · **Baseline:** 🟡 newly (2024)
- **Min support:** Chrome 122, Firefox 127, Safari 17, Edge 122, Node 22
- **Notes:** Check your audience or add a fallback. Full set: `union`, `intersection`, `difference`, `symmetricDifference`, `isSubsetOf`, `isSupersetOf`, `isDisjointFrom`. Methods return `Set`s — spread back to an array if needed.

```js
// Before
intersection([1, 2, 3], [2, 3, 4]); // [2, 3]

// After
[...new Set([1, 2, 3]).intersection(new Set([2, 3, 4]))]; // [2, 3]
```

### array.prototype.flat, array.prototype.flatmap, array.from, array-from, array.prototype.find, array.prototype.findindex, array.prototype.at
- **Confidence:** full
- **Notes:** Polyfills — these methods are natively available.

---

## UUID / Random

### uuid → `crypto.randomUUID()`
- **Confidence:** partial
- **Min support:** Chrome 92, Firefox 95, Safari 15.4, Edge 92, Node 16.7
- **Notes:** Only generates v4 UUIDs. If you use v1, v3, or v5 you still need the package.

```js
// Before
import { v4 as uuidv4 } from 'uuid';
const id = uuidv4();

// After
const id = crypto.randomUUID();
```

### nanoid, shortid, cuid → `crypto.randomUUID()`
- **Confidence:** partial
- **Notes:** These generate shorter/custom-alphabet IDs. crypto.randomUUID() produces standard v4 UUIDs.

---

## Date / Time

### moment → `Intl.DateTimeFormat` / `Intl.RelativeTimeFormat`
- **Confidence:** partial
- **Notes:** Intl replaces formatting/localization. Complex date math still needs a library.

```js
// Before
moment().format('MMMM Do YYYY, h:mm a');
moment().fromNow();

// After
new Intl.DateTimeFormat('en-US', {
  year: 'numeric', month: 'long',
  day: 'numeric', hour: 'numeric', minute: 'numeric'
}).format(new Date());

new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-3, 'day');
```

### moment-timezone → `Intl.DateTimeFormat` (timeZone option)
- **Confidence:** partial

```js
new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: 'numeric', minute: 'numeric', timeZoneName: 'short'
}).format(new Date());
```

### timeago.js → `Intl.RelativeTimeFormat`
- **Confidence:** partial · **Baseline:** 🟢 widely
- **Notes:** Formats a value + unit; unlike timeago.js it does not pick the unit for you. Add a small helper that finds the largest unit that fits.

```js
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
rtf.format(-1, 'day');  // 'yesterday'
rtf.format(3, 'hour');  // 'in 3 hours'
```

### humanize-duration → `Intl.DurationFormat`
- **Confidence:** partial · **Baseline:** 🟡 newly
- **Min support:** Chrome 129, Firefox 133, Safari 16.4, Node 22
- **Notes:** Landed in all engines March 2025; on track for Widely in 2027. Fine for internal/modern-audience tools; for a broad audience check traffic or guard with a feature check.

```js
const df = new Intl.DurationFormat('en', { style: 'long' });
df.format({ hours: 1, minutes: 30 }); // '1 hour, 30 minutes'
```

---

## Internationalization

### numeral, accounting → `Intl.NumberFormat`
- **Confidence:** partial · **Baseline:** 🟢 widely
- **Notes:** Covers thousands separators, currency, percent, and compact notation. Custom format strings map to option objects.

```js
new Intl.NumberFormat('en-US').format(1234567.89);        // '1,234,567.89'
new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(1234.5); // '$1,234.50'
new Intl.NumberFormat('en', { notation: 'compact' }).format(1200000);   // '1.2M'
```

### pluralize → `Intl.PluralRules`
- **Confidence:** partial · **Baseline:** 🟢 widely
- **Notes:** Selects the plural category (`one`/`other`/…); it does not inflect the word. Map categories to your own word forms.

```js
const pr = new Intl.PluralRules('en');
const forms = { one: 'item', other: 'items' };
forms[pr.select(3)]; // 'items'
```

### list-joining helpers → `Intl.ListFormat`
- **Confidence:** full · **Baseline:** 🟢 widely

```js
const lf = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
lf.format(['Alice', 'Bob', 'Carol']); // 'Alice, Bob, and Carol'
```

---

## UI Primitives

Platform features here are often *more* accessible than hand-rolled solutions.

### a11y-dialog / modal libraries → `<dialog>` element
- **Confidence:** partial · **Baseline:** 🟢 widely
- **Min support:** Chrome 37, Firefox 98, Safari 15.4, Edge 79 (browser-only)
- **Notes:** `showModal()` gives focus trapping, `Escape`-to-close, focus restore, top-layer render, and a `::backdrop`.

```html
<dialog id="confirm"><form method="dialog">
  <button value="cancel">Cancel</button>
  <button value="ok">OK</button>
</form></dialog>
```

```js
const dialog = document.querySelector('#confirm');
dialog.showModal();
dialog.addEventListener('close', () => console.log(dialog.returnValue));
```

### focus-trap → modal `<dialog>.showModal()`
- **Confidence:** partial · **Baseline:** 🟢 widely
- **Notes:** A modal `<dialog>` makes the rest of the page inert and traps focus for you.

### body-scroll-lock → CSS `:has(dialog:modal)`
- **Confidence:** partial · **Baseline:** 🟢 widely
- **Notes:** Use `:modal` (not `[open]`) so scroll only locks once the dialog is actually modal.

```css
body:has(dialog:modal) { overflow: hidden; }
```

### tippy.js → Popover API + CSS anchor positioning
- **Confidence:** partial · **Baseline:** 🟡 newly
- **Notes:** Popover API (Newly, Jan 2025) gives light-dismiss + top layer with no JS; CSS anchor positioning (Newly, Jan 2026) replaces Popper. Keep a fallback for older browsers and advanced `position-try` features.

```html
<button popovertarget="menu" id="btn">Options</button>
<div id="menu" popover>Hello</div>
```

```css
#btn  { anchor-name: --trigger; }
#menu { position-anchor: --trigger; position-area: top; margin: 0; }
```

---

## Keep for now (not Baseline yet)

### Temporal — do **not** drop your date library yet
- **Baseline:** 🔴 limited (Safari has not shipped a stable release as of this writing)
- **Why wait:** the official polyfill (`@js-temporal/polyfill`, ~44 KB gz; a lighter one ~19 KB gz) is far heavier than a lean date library like `dayjs` (~3 KB gz). Swapping today *grows* your bundle unless you load the polyfill conditionally.
- **Revisit when:** Safari ships Temporal in a stable release and it reaches Baseline. Then use it natively and conditionally polyfill older browsers. This is why the scanner does not flag `dayjs`/`date-fns` for a Temporal swap.

## Promises

### bluebird → `Promise`
- **Confidence:** partial — promisify, map(concurrency), cancel are not built-in.

### q → `Promise`
- **Confidence:** partial — `Q.defer()` patterns need a small helper when migrating.

### rsvp, es6-promise, promise-polyfill → `Promise`
- **Confidence:** full — native Promise + async/await replaces these entirely.

### promise.allsettled → `Promise.allSettled()`
- **Confidence:** full — modern runtimes already include it.

---

## Events

### eventemitter3, mitt → `EventTarget` + `CustomEvent`
- **Confidence:** partial — EventTarget is more verbose. Node.js 15+ has EventTarget.

```js
// Before
const ee = new EventEmitter();
ee.on('data', handler);
ee.emit('data', payload);

// After
const et = new EventTarget();
et.addEventListener('data', (e) => handler(e.detail));
et.dispatchEvent(new CustomEvent('data', { detail: payload }));
```

---

## String Utilities

### left-pad → `.padStart()`
- **Confidence:** full

```js
'5'.padStart(3, '0'); // '005'
```

### string.prototype.padstart, string.prototype.padend, string.prototype.trimstart, string.prototype.trimend, string.prototype.startswith, string.prototype.endswith, string.prototype.includes, string.prototype.repeat, string.prototype.at, string.prototype.matchall → native methods
- padStart, padEnd, trimStart, trimEnd, startsWith, endsWith, includes, repeat, at, matchAll
- All **full** confidence — just remove the polyfill.

### repeat-string → `.repeat()`

---

## Type Checking

### is-number → `typeof` + `Number.isFinite()`
### is-string → `typeof`
### isarray → `Array.isArray()`
### is-plain-object → `Object.prototype.toString`
### is-promise → duck-typing (`typeof v.then === 'function'`)

All **full** confidence.

---

## Encoding

### base-64, js-base64 → `btoa()` / `atob()`

- **Confidence:** partial
- **Notes:** btoa/atob work with ASCII only. For Unicode text or Buffer-style workflows, use a UTF-8 helper or Buffer in Node.js.

---

## FormData

### form-data → `FormData`

- **Confidence:** partial
- **Notes:** Native FormData works well with fetch, but form-data-specific helpers like `getHeaders()` and stream-oriented integrations need manual changes.

### formdata-polyfill → `FormData`

- **Confidence:** full
- **Notes:** Polyfill — remove it in modern browsers and Node.js 18+.

---

## Polyfills (remove entirely)

These packages provide functionality that is now globally available:

| Package | Native API | Min Chrome |
| --- | --- | --- |
| abort-controller | `AbortController` | 66 |
| abortcontroller-polyfill | `AbortController` | 66 |
| text-encoding | `TextEncoder` / `TextDecoder` | 38 |
| fastestsmallesttextencoderdecoder | `TextEncoder` / `TextDecoder` | 38 |
| globalthis | `globalThis` | 71 |
| es6-symbol | `Symbol` | 38 |
| es6-promise | `Promise` | 32 |
| intersection-observer | `IntersectionObserver` | 51 |
| resize-observer-polyfill | `ResizeObserver` | 64 |
| raf | `requestAnimationFrame` | 24 |
| web-streams-polyfill | `ReadableStream` | 52 |
| formdata-polyfill | `FormData` | 7 |

---

## Crypto

### crypto-js → `crypto.subtle` (Web Crypto API)

- **Confidence:** partial
- **Notes:** Covers SHA-*, AES, HMAC. API is async. MD5 not available (use SHA-256).

```js
// Before
const CryptoJS = require('crypto-js');
const hash = CryptoJS.SHA256('message').toString();

// After
const buf = new TextEncoder().encode('message');
const hashBuf = await crypto.subtle.digest('SHA-256', buf);
const hash = [...new Uint8Array(hashBuf)]
  .map(b => b.toString(16).padStart(2, '0')).join('');
```

---

## Migration Priority

When migrating, follow this order for safest results:

1. **Polyfills** — zero risk, just remove (abort-controller, es6-promise, globalthis, etc.)
2. **Full confidence replacements** — lodash.* single-method packages, isarray, left-pad, etc.
3. **Partial replacements** — review actual usage first (axios, moment, uuid, bluebird)
