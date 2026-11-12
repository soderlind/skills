# Playwright patterns for acceptance tests

## Contents

- [Config](#config)
- [Authentication](#authentication)
- [Test data](#test-data)
- [Stubbing external services](#stubbing-external-services)
- [Test shape](#test-shape)
- [CRITERIA.md template](#criteriamd-template)
- [Common start commands](#common-start-commands)

## Config

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/acceptance',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'tests/acceptance/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

If the app already runs elsewhere (staging, Local by Flywheel), drop `webServer` and set `BASE_URL`.
Add `tests/acceptance/.auth/` to `.gitignore`.

## Authentication

Log in once in a setup project, then reuse the storage state:

```ts
// tests/acceptance/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.E2E_USER!);
  await page.getByLabel('Password').fill(process.env.E2E_PASS!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('navigation')).toContainText('Sign out');
  await page.context().storageState({ path: 'tests/acceptance/.auth/user.json' });
});
```

Use one storage file per role. For anonymous tests, opt out with `test.use({ storageState: { cookies: [], origins: [] } })`.
Read credentials from environment variables and never commit them.

## Test data

Prefer the app's API or CLI over clicking through the UI to arrange state:

```ts
test.beforeEach(async ({ request }) => {
  await request.post('/api/test/reset');           // if the app has a reset route
});
```

WordPress: `npx wp-env run cli wp post create --post_title=Fixture --porcelain` or the REST API with an application password.
Use a unique suffix (`Date.now()`) in created records so parallel tests do not collide.

## Stubbing external services

```ts
await page.route('**/api.stripe.com/**', route =>
  route.fulfill({ status: 200, json: { id: 'pi_test', status: 'succeeded' } }));
```

Stub only third parties. Never stub the app under test, because then the test no longer proves acceptance.

## Test shape

```ts
import { test, expect } from '@playwright/test';

test.describe('Checkout', () => {
  test('AC-03 shows an error when the card is declined', async ({ page }) => {
    // Given
    await page.goto('/cart');
    // When
    await page.getByRole('button', { name: 'Pay now' }).click();
    // Then
    await expect(page.getByRole('alert')).toHaveText(/card was declined/i);
    await expect(page).toHaveURL(/\/cart$/);
  });
});
```

Known app bug that the user agreed to track:

```ts
test('AC-07 …', async ({ page }) => {
  test.fail(true, 'App bug: saving draft drops tags. See CRITERIA.md AC-07');
  // ...
});
```

## CRITERIA.md template

```md
# Acceptance criteria

Agreed with <user> on <date>. Tests: `tests/acceptance/*.spec.ts`.

## Checkout

### AC-03 Declined card shows an error
- Actor: logged-in customer
- Given a cart with one item
- When the payment provider declines the card
- Then an alert says the card was declined and the user stays on /cart
- Evidence: src/checkout/pay.ts:42, docs/checkout.md#errors

## Out of scope
- Refunds (handled by admin, not in this round)
```

## Common start commands

| Stack | `webServer.command` | Default URL |
| --- | --- | --- |
| Vite | `npm run dev` | `http://localhost:5173` |
| Next.js | `npm run build && npm run start` | `http://localhost:3000` |
| Astro | `npm run dev` | `http://localhost:4321` |
| wp-env | none: run `npx wp-env start` first (it exits), set `BASE_URL` | `http://localhost:8888` |
| Static | `npx serve -l 4173 dist` | `http://localhost:4173` |
