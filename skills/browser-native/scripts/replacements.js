/**
 * Database of npm packages that can be replaced with modern browser/runtime built-in APIs.
 *
 * Each entry:
 *   category   – grouping label
 *   browserApi – name of the native API replacement
 *   minBrowser – minimum browser/Node.js versions required
 *   confidence – "full" (drop-in safe) or "partial" (covers most cases)
 *   notes      – optional caveats
 *   before     – code example using the npm package
 *   after      – equivalent code using the native API
 */

/** @typedef {{ category: string, browserApi: string, minBrowser: { chrome: number, firefox: number, safari: number, edge: number, node: number }, confidence: "full"|"partial", notes?: string, before: string, after: string }} Replacement */

/** @type {Record<string, Replacement>} */
const replacements = {

  // ───────────────────────── HTTP / Fetch ─────────────────────────

  "axios": {
    category: "HTTP",
    browserApi: "fetch()",
    minBrowser: { chrome: 42, firefox: 39, safari: 10.1, edge: 14, node: 18 },
    confidence: "partial",
    notes: "fetch does not reject on HTTP error status. Interceptors / automatic JSON transform need manual handling.",
    before: `const axios = require('axios');\nconst { data } = await axios.get('/api/items', {\n  headers: { Authorization: 'Bearer token' }\n});`,
    after: `const res = await fetch('/api/items', {\n  headers: { Authorization: 'Bearer token' }\n});\nif (!res.ok) throw new Error(res.statusText);\nconst data = await res.json();`
  },

  "node-fetch": {
    category: "HTTP",
    browserApi: "fetch()",
    minBrowser: { chrome: 42, firefox: 39, safari: 10.1, edge: 14, node: 18 },
    confidence: "full",
    notes: "Node.js 18+ ships global fetch. No longer needed.",
    before: `const fetch = require('node-fetch');\nconst res = await fetch('https://api.example.com/data');\nconst json = await res.json();`,
    after: `const res = await fetch('https://api.example.com/data');\nconst json = await res.json();`
  },

  "request": {
    category: "HTTP",
    browserApi: "fetch()",
    minBrowser: { chrome: 42, firefox: 39, safari: 10.1, edge: 14, node: 18 },
    confidence: "partial",
    notes: "Package is deprecated. fetch covers most use cases; streaming differs.",
    before: `const request = require('request');\nrequest('https://api.example.com', (err, res, body) => {\n  console.log(body);\n});`,
    after: `const res = await fetch('https://api.example.com');\nconst body = await res.text();\nconsole.log(body);`
  },

  "got": {
    category: "HTTP",
    browserApi: "fetch()",
    minBrowser: { chrome: 42, firefox: 39, safari: 10.1, edge: 14, node: 18 },
    confidence: "partial",
    notes: "got has retries, hooks, pagination built-in. fetch needs manual retry logic.",
    before: `import got from 'got';\nconst data = await got('https://api.example.com').json();`,
    after: `const res = await fetch('https://api.example.com');\nconst data = await res.json();`
  },

  "superagent": {
    category: "HTTP",
    browserApi: "fetch()",
    minBrowser: { chrome: 42, firefox: 39, safari: 10.1, edge: 14, node: 18 },
    confidence: "partial",
    notes: "superagent's chaining API has no direct equivalent; rewrite to fetch options.",
    before: `const superagent = require('superagent');\nconst res = await superagent.get('/api').set('Accept', 'application/json');`,
    after: `const res = await fetch('/api', {\n  headers: { Accept: 'application/json' }\n});\nconst data = await res.json();`
  },

  "isomorphic-fetch": {
    category: "HTTP",
    browserApi: "fetch()",
    minBrowser: { chrome: 42, firefox: 39, safari: 10.1, edge: 14, node: 18 },
    confidence: "full",
    notes: "Polyfill — no longer needed in modern browsers and Node.js 18+.",
    before: `require('isomorphic-fetch');\nconst res = await fetch('/api');`,
    after: `const res = await fetch('/api');`
  },

  "cross-fetch": {
    category: "HTTP",
    browserApi: "fetch()",
    minBrowser: { chrome: 42, firefox: 39, safari: 10.1, edge: 14, node: 18 },
    confidence: "full",
    notes: "Polyfill — no longer needed in modern browsers and Node.js 18+.",
    before: `import fetch from 'cross-fetch';\nconst res = await fetch('/api');`,
    after: `const res = await fetch('/api');`
  },

  "whatwg-fetch": {
    category: "HTTP",
    browserApi: "fetch()",
    minBrowser: { chrome: 42, firefox: 39, safari: 10.1, edge: 14, node: 18 },
    confidence: "full",
    notes: "Polyfill — no longer needed in any modern browser.",
    before: `import 'whatwg-fetch';\nconst res = await fetch('/api');`,
    after: `const res = await fetch('/api');`
  },

  "unfetch": {
    category: "HTTP",
    browserApi: "fetch()",
    minBrowser: { chrome: 42, firefox: 39, safari: 10.1, edge: 14, node: 18 },
    confidence: "full",
    notes: "Polyfill — no longer needed in modern browsers and Node.js 18+.",
    before: `import fetch from 'unfetch';\nconst res = await fetch('/api');`,
    after: `const res = await fetch('/api');`
  },

  "needle": {
    category: "HTTP",
    browserApi: "fetch()",
    minBrowser: { chrome: 42, firefox: 39, safari: 10.1, edge: 14, node: 18 },
    confidence: "partial",
    notes: "needle has streaming/multipart helpers; fetch covers simple requests.",
    before: `const needle = require('needle');\nconst resp = await needle('get', 'https://api.example.com');`,
    after: `const res = await fetch('https://api.example.com');\nconst data = await res.json();`
  },

  // ───────────────────────── URL / Query String ─────────────────────────

  "query-string": {
    category: "URL / Query String",
    browserApi: "URLSearchParams",
    minBrowser: { chrome: 49, firefox: 44, safari: 10.1, edge: 17, node: 10 },
    confidence: "partial",
    notes: "URLSearchParams does not support nested objects or array bracket syntax.",
    before: `import queryString from 'query-string';\nconst parsed = queryString.parse('?foo=bar&name=John');\nconst str = queryString.stringify({ foo: 'bar' });`,
    after: `const params = new URLSearchParams('?foo=bar&name=John');\nconst parsed = Object.fromEntries(params);\nconst str = new URLSearchParams({ foo: 'bar' }).toString();`
  },

  "qs": {
    category: "URL / Query String",
    browserApi: "URLSearchParams",
    minBrowser: { chrome: 49, firefox: 44, safari: 10.1, edge: 17, node: 10 },
    confidence: "partial",
    notes: "URLSearchParams does not support nested objects like qs does. Only a replacement for flat key-value pairs.",
    before: `const qs = require('qs');\nconst parsed = qs.parse('foo=bar&name=John');\nconst str = qs.stringify({ foo: 'bar' });`,
    after: `const params = new URLSearchParams('foo=bar&name=John');\nconst parsed = Object.fromEntries(params);\nconst str = new URLSearchParams({ foo: 'bar' }).toString();`
  },

  "url-parse": {
    category: "URL / Query String",
    browserApi: "URL",
    minBrowser: { chrome: 32, firefox: 19, safari: 7, edge: 12, node: 10 },
    confidence: "full",
    before: `const parse = require('url-parse');\nconst url = parse('https://example.com:8080/path?q=1');\nconsole.log(url.hostname, url.query);`,
    after: `const url = new URL('https://example.com:8080/path?q=1');\nconsole.log(url.hostname, url.searchParams.get('q'));`
  },

  "querystring": {
    category: "URL / Query String",
    browserApi: "URLSearchParams",
    minBrowser: { chrome: 49, firefox: 44, safari: 10.1, edge: 17, node: 10 },
    confidence: "full",
    notes: "Node.js legacy module. URLSearchParams is the modern replacement.",
    before: `const querystring = require('querystring');\nconst parsed = querystring.parse('foo=bar&baz=qux');`,
    after: `const parsed = Object.fromEntries(new URLSearchParams('foo=bar&baz=qux'));`
  },

  "url-search-params-polyfill": {
    category: "URL / Query String",
    browserApi: "URLSearchParams",
    minBrowser: { chrome: 49, firefox: 44, safari: 10.1, edge: 17, node: 10 },
    confidence: "full",
    notes: "Polyfill — URLSearchParams is natively available in modern browsers and Node.js.",
    before: `import 'url-search-params-polyfill';\nconst params = new URLSearchParams('foo=bar');`,
    after: `const params = new URLSearchParams('foo=bar');`
  },

  // ───────────────────────── Deep Clone / Object Utilities ─────────────────────────

  "lodash.clonedeep": {
    category: "Object Utilities",
    browserApi: "structuredClone()",
    minBrowser: { chrome: 98, firefox: 94, safari: 15.4, edge: 98, node: 17 },
    confidence: "full",
    notes: "structuredClone does not clone functions or DOM nodes. Handles circular refs.",
    before: `const cloneDeep = require('lodash.clonedeep');\nconst copy = cloneDeep(original);`,
    after: `const copy = structuredClone(original);`
  },

  "clone-deep": {
    category: "Object Utilities",
    browserApi: "structuredClone()",
    minBrowser: { chrome: 98, firefox: 94, safari: 15.4, edge: 98, node: 17 },
    confidence: "full",
    before: `const cloneDeep = require('clone-deep');\nconst copy = cloneDeep(obj);`,
    after: `const copy = structuredClone(obj);`
  },

  "rfdc": {
    category: "Object Utilities",
    browserApi: "structuredClone()",
    minBrowser: { chrome: 98, firefox: 94, safari: 15.4, edge: 98, node: 17 },
    confidence: "full",
    notes: "rfdc is faster for hot paths; structuredClone is built-in and handles circular refs.",
    before: `const clone = require('rfdc')();\nconst copy = clone(obj);`,
    after: `const copy = structuredClone(obj);`
  },

  "lodash.assign": {
    category: "Object Utilities",
    browserApi: "Object.assign() / spread",
    minBrowser: { chrome: 45, firefox: 34, safari: 9, edge: 12, node: 4 },
    confidence: "full",
    before: `const assign = require('lodash.assign');\nconst result = assign({}, obj1, obj2);`,
    after: `const result = Object.assign({}, obj1, obj2);\n// or: const result = { ...obj1, ...obj2 };`
  },

  "object-assign": {
    category: "Object Utilities",
    browserApi: "Object.assign()",
    minBrowser: { chrome: 45, firefox: 34, safari: 9, edge: 12, node: 4 },
    confidence: "full",
    notes: "Polyfill — Object.assign is available in all modern environments.",
    before: `const assign = require('object-assign');\nconst result = assign({}, obj1, obj2);`,
    after: `const result = Object.assign({}, obj1, obj2);`
  },

  "object.assign": {
    category: "Object Utilities",
    browserApi: "Object.assign()",
    minBrowser: { chrome: 45, firefox: 34, safari: 9, edge: 12, node: 4 },
    confidence: "full",
    notes: "Polyfill — Object.assign is available in all modern environments.",
    before: `const assign = require('object.assign');\nconst result = assign({}, obj1, obj2);`,
    after: `const result = Object.assign({}, obj1, obj2);`
  },

  "lodash.keys": {
    category: "Object Utilities",
    browserApi: "Object.keys()",
    minBrowser: { chrome: 5, firefox: 4, safari: 5, edge: 12, node: 0.10 },
    confidence: "full",
    before: `const keys = require('lodash.keys');\nconst k = keys(obj);`,
    after: `const k = Object.keys(obj);`
  },

  "object-keys": {
    category: "Object Utilities",
    browserApi: "Object.keys()",
    minBrowser: { chrome: 5, firefox: 4, safari: 5, edge: 12, node: 0.10 },
    confidence: "full",
    notes: "Polyfill — Object.keys is natively available.",
    before: `const keys = require('object-keys');\nconst k = keys(obj);`,
    after: `const k = Object.keys(obj);`
  },

  "lodash.values": {
    category: "Object Utilities",
    browserApi: "Object.values()",
    minBrowser: { chrome: 54, firefox: 47, safari: 10.1, edge: 14, node: 7 },
    confidence: "full",
    before: `const values = require('lodash.values');\nconst v = values(obj);`,
    after: `const v = Object.values(obj);`
  },

  "object.values": {
    category: "Object Utilities",
    browserApi: "Object.values()",
    minBrowser: { chrome: 54, firefox: 47, safari: 10.1, edge: 14, node: 7 },
    confidence: "full",
    notes: "Polyfill — Object.values is natively available.",
    before: `const values = require('object.values');\nconst v = values(obj);`,
    after: `const v = Object.values(obj);`
  },

  "lodash.entries": {
    category: "Object Utilities",
    browserApi: "Object.entries()",
    minBrowser: { chrome: 54, firefox: 47, safari: 10.1, edge: 14, node: 7 },
    confidence: "full",
    before: `const entries = require('lodash.entries');\nconst e = entries(obj);`,
    after: `const e = Object.entries(obj);`
  },

  "object.entries": {
    category: "Object Utilities",
    browserApi: "Object.entries()",
    minBrowser: { chrome: 54, firefox: 47, safari: 10.1, edge: 14, node: 7 },
    confidence: "full",
    notes: "Polyfill — Object.entries is natively available.",
    before: `const entries = require('object.entries');\nentries({ a: 1, b: 2 });`,
    after: `Object.entries({ a: 1, b: 2 });`
  },

  "object.fromentries": {
    category: "Object Utilities",
    browserApi: "Object.fromEntries()",
    minBrowser: { chrome: 73, firefox: 63, safari: 12.1, edge: 79, node: 12 },
    confidence: "full",
    before: `const fromEntries = require('object.fromentries');\nfromEntries([['a', 1], ['b', 2]]);`,
    after: `Object.fromEntries([['a', 1], ['b', 2]]);`
  },

  "fromentries": {
    category: "Object Utilities",
    browserApi: "Object.fromEntries()",
    minBrowser: { chrome: 73, firefox: 63, safari: 12.1, edge: 79, node: 12 },
    confidence: "full",
    before: `const fromEntries = require('fromentries');\nfromEntries([['a', 1]]);`,
    after: `Object.fromEntries([['a', 1]]);`
  },

  "has": {
    category: "Object Utilities",
    browserApi: "Object.hasOwn()",
    minBrowser: { chrome: 93, firefox: 92, safari: 15.4, edge: 93, node: 16.9 },
    confidence: "full",
    before: `const has = require('has');\nhas(obj, 'key');`,
    after: `Object.hasOwn(obj, 'key');`
  },

  "has-own": {
    category: "Object Utilities",
    browserApi: "Object.hasOwn()",
    minBrowser: { chrome: 93, firefox: 92, safari: 15.4, edge: 93, node: 16.9 },
    confidence: "full",
    before: `const hasOwn = require('has-own');\nhasOwn(obj, 'key');`,
    after: `Object.hasOwn(obj, 'key');`
  },

  "object.hasown": {
    category: "Object Utilities",
    browserApi: "Object.hasOwn()",
    minBrowser: { chrome: 93, firefox: 92, safari: 15.4, edge: 93, node: 16.9 },
    confidence: "full",
    notes: "Polyfill — Object.hasOwn is natively available in modern environments.",
    before: `const hasOwn = require('object.hasown');\nhasOwn(obj, 'key');`,
    after: `Object.hasOwn(obj, 'key');`
  },

  "lodash.get": {
    category: "Object Utilities",
    browserApi: "Optional chaining + nullish coalescing",
    minBrowser: { chrome: 80, firefox: 74, safari: 13.1, edge: 80, node: 14 },
    confidence: "partial",
    notes: "Works well for fixed property paths. String path parsing, array index strings, and keys containing dots need manual rewrites.",
    before: `const get = require('lodash.get');\nconst city = get(user, 'profile.address.city', 'Unknown');`,
    after: `const city = user?.profile?.address?.city ?? 'Unknown';`
  },

  "dlv": {
    category: "Object Utilities",
    browserApi: "Optional chaining + nullish coalescing",
    minBrowser: { chrome: 80, firefox: 74, safari: 13.1, edge: 80, node: 14 },
    confidence: "partial",
    notes: "Works well for fixed property paths. String path parsing and dynamic path traversal still need custom logic.",
    before: `import dlv from 'dlv';\nconst city = dlv(user, 'profile.address.city', 'Unknown');`,
    after: `const city = user?.profile?.address?.city ?? 'Unknown';`
  },

  // ───────────────────────── Array Utilities ─────────────────────────

  "lodash.flatten": {
    category: "Array Utilities",
    browserApi: "Array.prototype.flat()",
    minBrowser: { chrome: 69, firefox: 62, safari: 12, edge: 79, node: 11 },
    confidence: "full",
    before: `const flatten = require('lodash.flatten');\nflatten([1, [2, [3]]]);  // [1, 2, [3]]`,
    after: `[1, [2, [3]]].flat();        // [1, 2, [3]]\n[1, [2, [3]]].flat(Infinity); // [1, 2, 3]`
  },

  "array-flatten": {
    category: "Array Utilities",
    browserApi: "Array.prototype.flat()",
    minBrowser: { chrome: 69, firefox: 62, safari: 12, edge: 79, node: 11 },
    confidence: "full",
    before: `const flatten = require('array-flatten');\nflatten([1, [2, [3]]]);`,
    after: `[1, [2, [3]]].flat(Infinity);`
  },

  "lodash.find": {
    category: "Array Utilities",
    browserApi: "Array.prototype.find()",
    minBrowser: { chrome: 45, firefox: 25, safari: 7.1, edge: 12, node: 4 },
    confidence: "full",
    before: `const find = require('lodash.find');\nfind(users, u => u.age > 30);`,
    after: `users.find(u => u.age > 30);`
  },

  "lodash.findindex": {
    category: "Array Utilities",
    browserApi: "Array.prototype.findIndex()",
    minBrowser: { chrome: 45, firefox: 25, safari: 7.1, edge: 12, node: 4 },
    confidence: "full",
    before: `const findIndex = require('lodash.findindex');\nfindIndex(users, u => u.age > 30);`,
    after: `users.findIndex(u => u.age > 30);`
  },

  "lodash.includes": {
    category: "Array Utilities",
    browserApi: "Array.prototype.includes()",
    minBrowser: { chrome: 47, firefox: 43, safari: 9, edge: 14, node: 6 },
    confidence: "full",
    before: `const includes = require('lodash.includes');\nincludes([1, 2, 3], 2);`,
    after: `[1, 2, 3].includes(2);`
  },

  "array-includes": {
    category: "Array Utilities",
    browserApi: "Array.prototype.includes()",
    minBrowser: { chrome: 47, firefox: 43, safari: 9, edge: 14, node: 6 },
    confidence: "full",
    before: `const includes = require('array-includes');\nincludes([1, 2, 3], 2);`,
    after: `[1, 2, 3].includes(2);`
  },

  "lodash.foreach": {
    category: "Array Utilities",
    browserApi: "Array.prototype.forEach()",
    minBrowser: { chrome: 1, firefox: 1.5, safari: 3, edge: 12, node: 0.10 },
    confidence: "full",
    before: `const forEach = require('lodash.foreach');\nforEach(items, item => console.log(item));`,
    after: `items.forEach(item => console.log(item));`
  },

  "lodash.map": {
    category: "Array Utilities",
    browserApi: "Array.prototype.map()",
    minBrowser: { chrome: 1, firefox: 1.5, safari: 3, edge: 12, node: 0.10 },
    confidence: "full",
    before: `const map = require('lodash.map');\nmap(items, item => item.name);`,
    after: `items.map(item => item.name);`
  },

  "lodash.filter": {
    category: "Array Utilities",
    browserApi: "Array.prototype.filter()",
    minBrowser: { chrome: 1, firefox: 1.5, safari: 3, edge: 12, node: 0.10 },
    confidence: "full",
    before: `const filter = require('lodash.filter');\nfilter(items, item => item.active);`,
    after: `items.filter(item => item.active);`
  },

  "lodash.reduce": {
    category: "Array Utilities",
    browserApi: "Array.prototype.reduce()",
    minBrowser: { chrome: 1, firefox: 3, safari: 3, edge: 12, node: 0.10 },
    confidence: "full",
    before: `const reduce = require('lodash.reduce');\nreduce([1, 2, 3], (sum, n) => sum + n, 0);`,
    after: `[1, 2, 3].reduce((sum, n) => sum + n, 0);`
  },

  "lodash.every": {
    category: "Array Utilities",
    browserApi: "Array.prototype.every()",
    minBrowser: { chrome: 1, firefox: 1.5, safari: 3, edge: 12, node: 0.10 },
    confidence: "full",
    before: `const every = require('lodash.every');\nevery([2, 4, 6], n => n % 2 === 0);`,
    after: `[2, 4, 6].every(n => n % 2 === 0);`
  },

  "lodash.some": {
    category: "Array Utilities",
    browserApi: "Array.prototype.some()",
    minBrowser: { chrome: 1, firefox: 1.5, safari: 3, edge: 12, node: 0.10 },
    confidence: "full",
    before: `const some = require('lodash.some');\nsome([1, 2, 3], n => n > 2);`,
    after: `[1, 2, 3].some(n => n > 2);`
  },

  "lodash.uniq": {
    category: "Array Utilities",
    browserApi: "[...new Set()]",
    minBrowser: { chrome: 38, firefox: 13, safari: 7.1, edge: 12, node: 4 },
    confidence: "full",
    before: `const uniq = require('lodash.uniq');\nuniq([1, 2, 2, 3]);  // [1, 2, 3]`,
    after: `[...new Set([1, 2, 2, 3])];  // [1, 2, 3]`
  },

  "lodash.compact": {
    category: "Array Utilities",
    browserApi: "Array.prototype.filter(Boolean)",
    minBrowser: { chrome: 1, firefox: 1.5, safari: 3, edge: 12, node: 0.10 },
    confidence: "full",
    before: `const compact = require('lodash.compact');\ncompact([0, 1, false, 2, '', 3]);  // [1, 2, 3]`,
    after: `[0, 1, false, 2, '', 3].filter(Boolean);  // [1, 2, 3]`
  },

  "array.prototype.flat": {
    category: "Array Utilities",
    browserApi: "Array.prototype.flat()",
    minBrowser: { chrome: 69, firefox: 62, safari: 12, edge: 79, node: 11 },
    confidence: "full",
    notes: "Polyfill — flat() is natively available.",
    before: `require('array.prototype.flat/auto');\n[1, [2, [3]]].flat();`,
    after: `[1, [2, [3]]].flat();`
  },

  "array.prototype.flatmap": {
    category: "Array Utilities",
    browserApi: "Array.prototype.flatMap()",
    minBrowser: { chrome: 69, firefox: 62, safari: 12, edge: 79, node: 11 },
    confidence: "full",
    notes: "Polyfill — flatMap() is natively available.",
    before: `require('array.prototype.flatmap/auto');\n[[1, 2], [3]].flatMap(x => x);`,
    after: `[[1, 2], [3]].flatMap(x => x);`
  },

  "array.from": {
    category: "Array Utilities",
    browserApi: "Array.from()",
    minBrowser: { chrome: 45, firefox: 32, safari: 9, edge: 12, node: 4 },
    confidence: "full",
    before: `const arrayFrom = require('array.from');\narrayFrom(new Set([1, 2, 3]));`,
    after: `Array.from(new Set([1, 2, 3]));`
  },

  "array-from": {
    category: "Array Utilities",
    browserApi: "Array.from()",
    minBrowser: { chrome: 45, firefox: 32, safari: 9, edge: 12, node: 4 },
    confidence: "full",
    before: `const from = require('array-from');\nfrom(nodeList);`,
    after: `Array.from(nodeList);`
  },

  "array.prototype.find": {
    category: "Array Utilities",
    browserApi: "Array.prototype.find()",
    minBrowser: { chrome: 45, firefox: 25, safari: 7.1, edge: 12, node: 4 },
    confidence: "full",
    notes: "Polyfill — find() is natively available.",
    before: `require('array.prototype.find/auto');\n[1, 2, 3].find(x => x > 1);`,
    after: `[1, 2, 3].find(x => x > 1);`
  },

  "array.prototype.findindex": {
    category: "Array Utilities",
    browserApi: "Array.prototype.findIndex()",
    minBrowser: { chrome: 45, firefox: 25, safari: 7.1, edge: 12, node: 4 },
    confidence: "full",
    before: `require('array.prototype.findindex/auto');\n[1, 2, 3].findIndex(x => x > 1);`,
    after: `[1, 2, 3].findIndex(x => x > 1);`
  },

  "array.prototype.at": {
    category: "Array Utilities",
    browserApi: "Array.prototype.at()",
    minBrowser: { chrome: 92, firefox: 90, safari: 15.4, edge: 92, node: 16.6 },
    confidence: "full",
    before: `require('array.prototype.at/auto');\n[1, 2, 3].at(-1);  // 3`,
    after: `[1, 2, 3].at(-1);  // 3`
  },

  // ───────────────────────── UUID / Random ─────────────────────────

  "uuid": {
    category: "UUID / Random",
    browserApi: "crypto.randomUUID()",
    minBrowser: { chrome: 92, firefox: 95, safari: 15.4, edge: 92, node: 16.7 },
    confidence: "partial",
    notes: "crypto.randomUUID() generates v4 UUIDs only. If you use uuid/v1, v3, or v5 you still need the package.",
    before: `import { v4 as uuidv4 } from 'uuid';\nconst id = uuidv4();`,
    after: `const id = crypto.randomUUID();`
  },

  "nanoid": {
    category: "UUID / Random",
    browserApi: "crypto.randomUUID()",
    minBrowser: { chrome: 92, firefox: 95, safari: 15.4, edge: 92, node: 16.7 },
    confidence: "partial",
    notes: "nanoid generates shorter IDs with custom alphabets. crypto.randomUUID() produces standard v4 UUIDs.",
    before: `import { nanoid } from 'nanoid';\nconst id = nanoid();`,
    after: `const id = crypto.randomUUID();`
  },

  "shortid": {
    category: "UUID / Random",
    browserApi: "crypto.randomUUID()",
    minBrowser: { chrome: 92, firefox: 95, safari: 15.4, edge: 92, node: 16.7 },
    confidence: "partial",
    notes: "shortid is deprecated. crypto.randomUUID() is longer but cryptographically secure.",
    before: `const shortid = require('shortid');\nconst id = shortid.generate();`,
    after: `const id = crypto.randomUUID();`
  },

  "cuid": {
    category: "UUID / Random",
    browserApi: "crypto.randomUUID()",
    minBrowser: { chrome: 92, firefox: 95, safari: 15.4, edge: 92, node: 16.7 },
    confidence: "partial",
    notes: "cuid generates collision-resistant IDs for distributed systems. crypto.randomUUID() is a simpler alternative.",
    before: `const cuid = require('cuid');\nconst id = cuid();`,
    after: `const id = crypto.randomUUID();`
  },

  // ───────────────────────── Date / Time ─────────────────────────

  "moment": {
    category: "Date / Time",
    browserApi: "Intl.DateTimeFormat / Date",
    minBrowser: { chrome: 24, firefox: 29, safari: 10, edge: 12, node: 13 },
    confidence: "partial",
    notes: "Intl replaces formatting/localization. Complex date math (add/subtract/diff) still needs a library like date-fns or Temporal (stage 3).",
    before: `const moment = require('moment');\nmoment().format('MMMM Do YYYY, h:mm a');\nmoment().fromNow();`,
    after: `new Intl.DateTimeFormat('en-US', {\n  year: 'numeric', month: 'long',\n  day: 'numeric', hour: 'numeric', minute: 'numeric'\n}).format(new Date());\n\n// Relative time\nnew Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-3, 'day');`
  },

  "moment-timezone": {
    category: "Date / Time",
    browserApi: "Intl.DateTimeFormat (timeZone option)",
    minBrowser: { chrome: 24, firefox: 52, safari: 14.1, edge: 14, node: 13 },
    confidence: "partial",
    notes: "Intl supports IANA timezones natively. Complex timezone math may still need a library.",
    before: `const moment = require('moment-timezone');\nmoment().tz('America/New_York').format('h:mm a z');`,
    after: `new Intl.DateTimeFormat('en-US', {\n  timeZone: 'America/New_York',\n  hour: 'numeric', minute: 'numeric', timeZoneName: 'short'\n}).format(new Date());`
  },

  // ───────────────────────── Promises ─────────────────────────

  "bluebird": {
    category: "Promises",
    browserApi: "Promise",
    minBrowser: { chrome: 32, firefox: 29, safari: 7.1, edge: 12, node: 0.12 },
    confidence: "partial",
    notes: "Native Promise covers most cases. Bluebird's promisify, map(concurrency), and cancel are not built-in.",
    before: `const Promise = require('bluebird');\nconst readFile = Promise.promisify(fs.readFile);\nawait Promise.map(items, fn, { concurrency: 5 });`,
    after: `import { readFile } from 'fs/promises';\nawait readFile('file.txt');\n// For concurrency control, use a small helper or Promise.allSettled`
  },

  "q": {
    category: "Promises",
    browserApi: "Promise",
    minBrowser: { chrome: 32, firefox: 29, safari: 7.1, edge: 12, node: 0.12 },
    confidence: "partial",
    notes: "Q is obsolete, but Q.defer-style workflows need a small helper when migrating to native Promise.",
    before: `const Q = require('q');\nconst deferred = Q.defer();\ndeferred.resolve(value);`,
    after: `function deferred() {\n  let resolve;\n  let reject;\n  const promise = new Promise((res, rej) => {\n    resolve = res;\n    reject = rej;\n  });\n  return { promise, resolve, reject };\n}\n\nconst d = deferred();\nd.resolve(value);`
  },

  "rsvp": {
    category: "Promises",
    browserApi: "Promise",
    minBrowser: { chrome: 32, firefox: 29, safari: 7.1, edge: 12, node: 0.12 },
    confidence: "full",
    before: `const RSVP = require('rsvp');\nconst promise = new RSVP.Promise((resolve) => resolve(42));`,
    after: `const promise = new Promise((resolve) => resolve(42));`
  },

  "es6-promise": {
    category: "Promises",
    browserApi: "Promise",
    minBrowser: { chrome: 32, firefox: 29, safari: 7.1, edge: 12, node: 0.12 },
    confidence: "full",
    notes: "Polyfill — Promise is available everywhere.",
    before: `require('es6-promise').polyfill();\nPromise.resolve(42);`,
    after: `Promise.resolve(42);`
  },

  "promise-polyfill": {
    category: "Promises",
    browserApi: "Promise",
    minBrowser: { chrome: 32, firefox: 29, safari: 7.1, edge: 12, node: 0.12 },
    confidence: "full",
    notes: "Polyfill — Promise is available everywhere.",
    before: `const Promise = require('promise-polyfill');\nPromise.resolve(42);`,
    after: `Promise.resolve(42);`
  },

  "promise.allsettled": {
    category: "Promises",
    browserApi: "Promise.allSettled()",
    minBrowser: { chrome: 76, firefox: 71, safari: 13, edge: 79, node: 12.9 },
    confidence: "full",
    notes: "Polyfill — Promise.allSettled is natively available in modern environments.",
    before: `require('promise.allsettled/auto');\nconst results = await Promise.allSettled(promises);`,
    after: `const results = await Promise.allSettled(promises);`
  },

  // ───────────────────────── Events ─────────────────────────

  "eventemitter3": {
    category: "Events",
    browserApi: "EventTarget + CustomEvent",
    minBrowser: { chrome: 4, firefox: 6, safari: 3.1, edge: 12, node: 15 },
    confidence: "partial",
    notes: "EventTarget is slightly more verbose. Node.js 15+ has EventTarget. eventemitter3 API is simpler for non-DOM use.",
    before: `import EventEmitter from 'eventemitter3';\nconst ee = new EventEmitter();\nee.on('data', handler);\nee.emit('data', payload);`,
    after: `const et = new EventTarget();\net.addEventListener('data', (e) => handler(e.detail));\net.dispatchEvent(new CustomEvent('data', { detail: payload }));`
  },

  "mitt": {
    category: "Events",
    browserApi: "EventTarget + CustomEvent",
    minBrowser: { chrome: 4, firefox: 6, safari: 3.1, edge: 12, node: 15 },
    confidence: "partial",
    notes: "EventTarget covers simple pub/sub. mitt's wildcard handlers and tiny ergonomic API need manual wrappers.",
    before: `import mitt from 'mitt';\nconst emitter = mitt();\nemitter.on('data', handler);\nemitter.emit('data', payload);`,
    after: `const target = new EventTarget();\ntarget.addEventListener('data', (e) => handler(e.detail));\ntarget.dispatchEvent(new CustomEvent('data', { detail: payload }));`
  },

  // ───────────────────────── String Utilities ─────────────────────────

  "left-pad": {
    category: "String Utilities",
    browserApi: "String.prototype.padStart()",
    minBrowser: { chrome: 57, firefox: 48, safari: 10, edge: 15, node: 8 },
    confidence: "full",
    before: `const leftPad = require('left-pad');\nleftPad('5', 3, '0');  // '005'`,
    after: `'5'.padStart(3, '0');  // '005'`
  },

  "string.prototype.padstart": {
    category: "String Utilities",
    browserApi: "String.prototype.padStart()",
    minBrowser: { chrome: 57, firefox: 48, safari: 10, edge: 15, node: 8 },
    confidence: "full",
    before: `require('string.prototype.padstart/auto');\n'5'.padStart(3, '0');`,
    after: `'5'.padStart(3, '0');`
  },

  "string.prototype.padend": {
    category: "String Utilities",
    browserApi: "String.prototype.padEnd()",
    minBrowser: { chrome: 57, firefox: 48, safari: 10, edge: 15, node: 8 },
    confidence: "full",
    before: `require('string.prototype.padend/auto');\n'5'.padEnd(3, '0');`,
    after: `'5'.padEnd(3, '0');`
  },

  "string.prototype.trimstart": {
    category: "String Utilities",
    browserApi: "String.prototype.trimStart()",
    minBrowser: { chrome: 66, firefox: 61, safari: 12, edge: 79, node: 10 },
    confidence: "full",
    before: `require('string.prototype.trimstart/auto');\n'  hello'.trimStart();`,
    after: `'  hello'.trimStart();`
  },

  "string.prototype.trimend": {
    category: "String Utilities",
    browserApi: "String.prototype.trimEnd()",
    minBrowser: { chrome: 66, firefox: 61, safari: 12, edge: 79, node: 10 },
    confidence: "full",
    before: `require('string.prototype.trimend/auto');\n'hello  '.trimEnd();`,
    after: `'hello  '.trimEnd();`
  },

  "string.prototype.startswith": {
    category: "String Utilities",
    browserApi: "String.prototype.startsWith()",
    minBrowser: { chrome: 41, firefox: 17, safari: 9, edge: 12, node: 4 },
    confidence: "full",
    before: `require('string.prototype.startswith/auto');\n'hello'.startsWith('he');`,
    after: `'hello'.startsWith('he');`
  },

  "string.prototype.endswith": {
    category: "String Utilities",
    browserApi: "String.prototype.endsWith()",
    minBrowser: { chrome: 41, firefox: 17, safari: 9, edge: 12, node: 4 },
    confidence: "full",
    before: `require('string.prototype.endswith/auto');\n'hello'.endsWith('lo');`,
    after: `'hello'.endsWith('lo');`
  },

  "string.prototype.includes": {
    category: "String Utilities",
    browserApi: "String.prototype.includes()",
    minBrowser: { chrome: 41, firefox: 40, safari: 9, edge: 12, node: 4 },
    confidence: "full",
    before: `require('string.prototype.includes/auto');\n'hello world'.includes('world');`,
    after: `'hello world'.includes('world');`
  },

  "string.prototype.repeat": {
    category: "String Utilities",
    browserApi: "String.prototype.repeat()",
    minBrowser: { chrome: 41, firefox: 24, safari: 9, edge: 12, node: 4 },
    confidence: "full",
    before: `require('string.prototype.repeat/auto');\n'ha'.repeat(3);  // 'hahaha'`,
    after: `'ha'.repeat(3);  // 'hahaha'`
  },

  "string.prototype.matchall": {
    category: "String Utilities",
    browserApi: "String.prototype.matchAll()",
    minBrowser: { chrome: 73, firefox: 67, safari: 13, edge: 79, node: 12 },
    confidence: "full",
    notes: "Polyfill — matchAll() is natively available.",
    before: `require('string.prototype.matchall/auto');\nconst matches = [...'a1b2'.matchAll(/\\d/g)];`,
    after: `const matches = [...'a1b2'.matchAll(/\\d/g)];`
  },

  "repeat-string": {
    category: "String Utilities",
    browserApi: "String.prototype.repeat()",
    minBrowser: { chrome: 41, firefox: 24, safari: 9, edge: 12, node: 4 },
    confidence: "full",
    before: `const repeat = require('repeat-string');\nrepeat('ha', 3);`,
    after: `'ha'.repeat(3);`
  },

  "string.prototype.at": {
    category: "String Utilities",
    browserApi: "String.prototype.at()",
    minBrowser: { chrome: 92, firefox: 90, safari: 15.4, edge: 92, node: 16.6 },
    confidence: "full",
    before: `require('string.prototype.at/auto');\n'hello'.at(-1);  // 'o'`,
    after: `'hello'.at(-1);  // 'o'`
  },

  // ───────────────────────── Type Checking ─────────────────────────

  "is-number": {
    category: "Type Checking",
    browserApi: "typeof + Number.isFinite()",
    minBrowser: { chrome: 19, firefox: 16, safari: 9, edge: 12, node: 0.10 },
    confidence: "full",
    before: `const isNumber = require('is-number');\nisNumber('42');  // true`,
    after: `function isNumber(v) {\n  if (typeof v === 'number') return v - v === 0;\n  if (typeof v === 'string' && v.trim() !== '') return Number.isFinite(+v);\n  return false;\n}`
  },

  "is-string": {
    category: "Type Checking",
    browserApi: "typeof",
    minBrowser: { chrome: 1, firefox: 1, safari: 1, edge: 12, node: 0.10 },
    confidence: "full",
    before: `const isString = require('is-string');\nisString('hello');`,
    after: `typeof value === 'string';`
  },

  "isarray": {
    category: "Type Checking",
    browserApi: "Array.isArray()",
    minBrowser: { chrome: 5, firefox: 4, safari: 5, edge: 12, node: 0.10 },
    confidence: "full",
    before: `const isArray = require('isarray');\nisArray([1, 2, 3]);`,
    after: `Array.isArray([1, 2, 3]);`
  },

  "is-plain-object": {
    category: "Type Checking",
    browserApi: "Object.prototype.toString",
    minBrowser: { chrome: 1, firefox: 1, safari: 1, edge: 12, node: 0.10 },
    confidence: "full",
    before: `const isPlainObject = require('is-plain-object');\nisPlainObject({ a: 1 });`,
    after: `function isPlainObject(v) {\n  return Object.prototype.toString.call(v) === '[object Object]'\n    && (v.constructor === Object || v.constructor === undefined);\n}`
  },

  "is-promise": {
    category: "Type Checking",
    browserApi: "instanceof / duck-typing",
    minBrowser: { chrome: 32, firefox: 29, safari: 7.1, edge: 12, node: 0.12 },
    confidence: "full",
    before: `const isPromise = require('is-promise');\nisPromise(someValue);`,
    after: `function isPromise(v) {\n  return !!v && typeof v.then === 'function';\n}`
  },

  // ───────────────────────── Encoding ─────────────────────────

  "base-64": {
    category: "Encoding",
    browserApi: "btoa() / atob()",
    minBrowser: { chrome: 4, firefox: 1, safari: 3, edge: 12, node: 16 },
    confidence: "partial",
    notes: "btoa/atob work with ASCII only. For Unicode text or Buffer-style workflows, use a UTF-8 helper or Buffer in Node.js.",
    before: `const base64 = require('base-64');\nconst encoded = base64.encode('hello');\nconst decoded = base64.decode(encoded);`,
    after: `const encoded = btoa('hello');\nconst decoded = atob(encoded);`
  },

  "js-base64": {
    category: "Encoding",
    browserApi: "btoa() / atob()",
    minBrowser: { chrome: 4, firefox: 1, safari: 3, edge: 12, node: 16 },
    confidence: "partial",
    notes: "Use with ASCII payloads only. Unicode-safe encoding needs a UTF-8 helper or Buffer in Node.js.",
    before: `const { Base64 } = require('js-base64');\nBase64.encode('hello');`,
    after: `btoa('hello');`
  },

  // ───────────────────────── AbortController ─────────────────────────

  "abort-controller": {
    category: "Polyfills",
    browserApi: "AbortController",
    minBrowser: { chrome: 66, firefox: 57, safari: 12.1, edge: 16, node: 15 },
    confidence: "full",
    notes: "Polyfill — AbortController is globally available.",
    before: `const AbortController = require('abort-controller');\nconst ctrl = new AbortController();\nfetch(url, { signal: ctrl.signal });`,
    after: `const ctrl = new AbortController();\nfetch(url, { signal: ctrl.signal });`
  },

  "abortcontroller-polyfill": {
    category: "Polyfills",
    browserApi: "AbortController",
    minBrowser: { chrome: 66, firefox: 57, safari: 12.1, edge: 16, node: 15 },
    confidence: "full",
    before: `require('abortcontroller-polyfill/dist/polyfill-patch-fetch');`,
    after: `// Just remove — AbortController is globally available`
  },

  // ───────────────────────── TextEncoder / TextDecoder ─────────────────────────

  "text-encoding": {
    category: "Polyfills",
    browserApi: "TextEncoder / TextDecoder",
    minBrowser: { chrome: 38, firefox: 18, safari: 10.1, edge: 79, node: 11 },
    confidence: "full",
    before: `const { TextEncoder, TextDecoder } = require('text-encoding');\nconst bytes = new TextEncoder().encode('hello');`,
    after: `const bytes = new TextEncoder().encode('hello');\nconst str = new TextDecoder().decode(bytes);`
  },

  "fastestsmallesttextencoderdecoder": {
    category: "Polyfills",
    browserApi: "TextEncoder / TextDecoder",
    minBrowser: { chrome: 38, firefox: 18, safari: 10.1, edge: 79, node: 11 },
    confidence: "full",
    before: `require('fastestsmallesttextencoderdecoder');\nnew TextEncoder().encode('hello');`,
    after: `new TextEncoder().encode('hello');`
  },

  // ───────────────────────── globalThis ─────────────────────────

  "globalthis": {
    category: "Polyfills",
    browserApi: "globalThis",
    minBrowser: { chrome: 71, firefox: 65, safari: 12.1, edge: 79, node: 12 },
    confidence: "full",
    before: `const globalThis = require('globalthis')();\nglobalThis.myGlobal = 42;`,
    after: `globalThis.myGlobal = 42;`
  },

  // ───────────────────────── Observers ─────────────────────────

  "intersection-observer": {
    category: "Observers",
    browserApi: "IntersectionObserver",
    minBrowser: { chrome: 51, firefox: 55, safari: 12.1, edge: 15, node: Infinity },
    confidence: "full",
    notes: "Browser-only API. Not available in Node.js.",
    before: `require('intersection-observer');\nconst obs = new IntersectionObserver(cb);\nobs.observe(el);`,
    after: `const obs = new IntersectionObserver(cb);\nobs.observe(el);`
  },

  "resize-observer-polyfill": {
    category: "Observers",
    browserApi: "ResizeObserver",
    minBrowser: { chrome: 64, firefox: 69, safari: 13.1, edge: 79, node: Infinity },
    confidence: "full",
    notes: "Browser-only API.",
    before: `import ResizeObserver from 'resize-observer-polyfill';\nconst obs = new ResizeObserver(cb);\nobs.observe(el);`,
    after: `const obs = new ResizeObserver(cb);\nobs.observe(el);`
  },

  // ───────────────────────── Animation ─────────────────────────

  "raf": {
    category: "Polyfills",
    browserApi: "requestAnimationFrame()",
    minBrowser: { chrome: 24, firefox: 23, safari: 6.1, edge: 12, node: Infinity },
    confidence: "full",
    notes: "Browser-only API.",
    before: `const raf = require('raf');\nraf(callback);`,
    after: `requestAnimationFrame(callback);`
  },

  // ───────────────────────── Crypto ─────────────────────────

  "crypto-js": {
    category: "Crypto",
    browserApi: "Web Crypto API (crypto.subtle)",
    minBrowser: { chrome: 37, firefox: 34, safari: 7, edge: 12, node: 15 },
    confidence: "partial",
    notes: "Web Crypto covers hashing (SHA-*), encryption (AES), and HMAC. API is async. MD5 is not available (use SHA-256 instead).",
    before: `const CryptoJS = require('crypto-js');\nconst hash = CryptoJS.SHA256('message').toString();`,
    after: `const msgBuf = new TextEncoder().encode('message');\nconst hashBuf = await crypto.subtle.digest('SHA-256', msgBuf);\nconst hash = [...new Uint8Array(hashBuf)]\n  .map(b => b.toString(16).padStart(2, '0')).join('');`
  },

  // ───────────────────────── Streams ─────────────────────────

  "web-streams-polyfill": {
    category: "Streams",
    browserApi: "ReadableStream / WritableStream / TransformStream",
    minBrowser: { chrome: 52, firefox: 65, safari: 14.1, edge: 79, node: 18 },
    confidence: "full",
    notes: "Native Web Streams are stable in Node.js 18+ and all modern browsers.",
    before: `const { ReadableStream } = require('web-streams-polyfill');\nconst stream = new ReadableStream({ start(ctrl) { ctrl.enqueue('data'); ctrl.close(); } });`,
    after: `const stream = new ReadableStream({\n  start(ctrl) { ctrl.enqueue('data'); ctrl.close(); }\n});`
  },

  // ───────────────────────── FormData ─────────────────────────

  "form-data": {
    category: "FormData",
    browserApi: "FormData",
    minBrowser: { chrome: 7, firefox: 4, safari: 5, edge: 12, node: 18 },
    confidence: "partial",
    notes: "Native FormData works well with fetch, but form-data-specific helpers like getHeaders() and stream-oriented integrations need manual changes.",
    before: `const FormData = require('form-data');\nconst form = new FormData();\nform.append('file', buffer, 'file.txt');`,
    after: `const form = new FormData();\nform.append('file', new Blob([buffer]), 'file.txt');`
  },

  "formdata-polyfill": {
    category: "FormData",
    browserApi: "FormData",
    minBrowser: { chrome: 7, firefox: 4, safari: 5, edge: 12, node: 18 },
    confidence: "full",
    before: `require('formdata-polyfill');\nconst form = new FormData();`,
    after: `const form = new FormData();`
  },

  // ───────────────────────── Symbol / es6 ─────────────────────────

  "es6-symbol": {
    category: "Polyfills",
    browserApi: "Symbol",
    minBrowser: { chrome: 38, firefox: 36, safari: 9, edge: 12, node: 4 },
    confidence: "full",
    before: `const Symbol = require('es6-symbol');\nconst sym = Symbol('desc');`,
    after: `const sym = Symbol('desc');`
  },
};

export default replacements;
