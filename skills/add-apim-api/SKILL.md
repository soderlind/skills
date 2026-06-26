---
name: add-apim-api
description: Scaffold a new API in Azure API Management. Use when user asks to add, create, or expose a new API through APIM, or needs to wire up a backend service to the gateway.
version: "1.1.0"
---

# Add APIM API

Scaffold a new API in Azure API Management with Bicep infrastructure.

## Steps

### 1. Gather requirements

Collect from user or infer from context:

- **API name** — display name and kebab-case identifier (e.g., `speeches-api`)
- **Backend URL** — the upstream service endpoint
- **Path prefix** — gateway path (e.g., `/speeches`)
- **Access** — open (no subscription) or protected (subscription key required)
- **Operations** — method, URL template, parameters per operation

If protected, determine whether backend needs an API key from Key Vault.

**Done when:** all five fields known.

### 2. Scaffold files

Create in order:

1. `infra/modules/api-management/apis/{api-name}.bicep` — API definition with CORS, rate limiting, caching policies
2. `infra/modules/api-management/operations/{api-name}-operations.bicep` — operation definitions following naming conventions below

Follow patterns in `references/bicep-patterns.md` for Bicep structure.

If backend API key needed:
- `infra/modules/api-management/named-values/{api-name}-key.bicep` — Key Vault reference
- `infra/modules/api-management/policies/{api-name}-policy.bicep` — policy injecting the key

**Done when:** all files created and compile with `az bicep build`.

### 3. Wire up

Update existing modules:

1. `infra/modules/api-management/api-management.bicep` — add module references
2. `infra/modules/api-management/products/{product-name}.bicep` — associate API with product (if applicable)
3. `infra/main.bicepparam` — add Front Door route (if new path prefix)

**Done when:** `az bicep build --file infra/main.bicep` succeeds.

---

## Operation naming conventions

| Verb | Use | Example |
|------|-----|---------|
| `list` | collection | `listMinistries`, `listConsultations` |
| `get` | single item | `getResponse`, `getCatalog` |
| `create` | new item | `createSubscription` |
| `update` | modify | `updateDocument` |
| `delete` | remove | `deleteComment` |

**Rules:**
- English identifiers, lowerCamelCase
- `list` + plural (`listMinistries`), `get` + singular (`getResponse`)
- Never `fetch` or `retrieve` — use `list` or `get`
