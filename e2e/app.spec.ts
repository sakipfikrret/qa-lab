import { test, expect, Page } from '@playwright/test';

const SHOTS = 'e2e/screenshots';
const ADMIN = { name: 'Ada Admin', email: 'ada@lab.dev', password: 'correct-horse-battery' };
const BOB = { name: 'Bob Member', email: 'bob@lab.dev', password: 'another-long-passphrase' };

const problems: string[] = [];
test.beforeEach(({ page }) => {
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
});
test.afterAll(() => {
  // Expected 4xx from deliberate negative tests show up as console errors; anything else (CSP, JS errors) must not.
  const real = problems.filter(p => !/status of (400|401|403|404|409)/.test(p));
  expect(real, real.join('\n')).toEqual([]);
});

async function signIn(page: Page, u: { email: string; password: string }) {
  await page.addInitScript(() => localStorage.setItem('qalab_has_visited', 'true')); // skip the landing page
  await page.goto('/');
  await page.getByLabel('Email').fill(u.email);
  await page.getByLabel(/^Password/).fill(u.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}
async function tab(page: Page, name: string) {
  await page.getByRole('button', { name }).first().click();
}

test.describe.configure({ mode: 'serial' });

test('landing page, then first-run admin setup', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Product preview' })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/01-landing.png`, fullPage: true });
  await page.getByRole('button', { name: /Open Console/ }).first().click();

  await expect(page.getByText('Create the admin account')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/02-setup.png` });
  await page.getByLabel('Name').fill(ADMIN.name);
  await page.getByLabel('Email').fill(ADMIN.email);
  await page.getByLabel(/^Password/).fill(ADMIN.password);
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByText('Quality Engineering Console')).toBeVisible();
  await expect(page.getByText(/Ada Admin · admin/)).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/03-dashboard.png`, fullPage: true });
});

test('session survives a reload; sign out ends it server-side', async ({ page }) => {
  await signIn(page, ADMIN);
  await expect(page.getByText('Quality Engineering Console')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Quality Engineering Console')).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in to QA//LAB' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sign in to QA//LAB' })).toBeVisible();
});

test('a run cannot be saved as passed while steps are unmarked', async ({ page }) => {
  await signIn(page, ADMIN);
  await tab(page, 'Executions');
  await page.getByRole('button', { name: /Launch New Test Run/ }).click();
  await page.getByLabel('Suite Name').fill('E2E run');
  await page.screenshot({ path: `${SHOTS}/04-new-run.png` });
  await page.getByRole('button', { name: 'Launch Runner' }).click();

  await expect(page.getByText('E2E run').first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/05-runner.png`, fullPage: true });

  await page.getByRole('button', { name: /Save Execution Result/ }).click();
  await expect(page.getByRole('alert')).toContainText('Mark every step');

  // Mark every visible step PASS, then saving must work.
  const passButtons = page.getByRole('button', { name: 'PASS', exact: true });
  const n = await passButtons.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) await passButtons.nth(i).click();
  await page.getByRole('button', { name: /Save Execution Result/ }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Mark every step' })).toHaveCount(0);
});

test('Copilot renders formatted answers and is labelled honestly without an API key', async ({ page }) => {
  await signIn(page, ADMIN);
  await page.getByRole('button', { name: 'QA Copilot' }).click();
  const dialog = page.getByRole('dialog', { name: 'QA Copilot' });
  await expect(dialog).toContainText("I'll say so");
  await dialog.getByLabel('Message the Copilot').fill('Which requirements have no test cases?');
  await dialog.getByRole('button', { name: 'Send message' }).click();
  await expect(dialog.locator('p, li').last()).toBeVisible({ timeout: 15_000 });
  expect(await dialog.innerText()).not.toContain('**');
  await page.screenshot({ path: `${SHOTS}/06-copilot.png` });
  await dialog.getByRole('button', { name: 'Close Copilot' }).click();
});

test('admin adds a member who sees nothing until given access, then read-only', async ({ page }) => {
  await signIn(page, ADMIN);
  await tab(page, 'Settings');
  await page.getByLabel('Name', { exact: true }).fill(BOB.name);
  await page.getByLabel('Email', { exact: true }).fill(BOB.email);
  await page.getByLabel('Temporary password').fill(BOB.password);
  await page.getByRole('button', { name: 'Add team member' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Added Bob Member' })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/07-settings-admin.png`, fullPage: true });
  await page.getByRole('button', { name: 'Sign out' }).click();

  // Bob: empty workspace
  await signIn(page, BOB);
  await expect(page.getByText('No projects yet')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/08-member-empty.png` });
  await page.getByRole('button', { name: 'Sign out' }).click();

  // Admin grants viewer access on the demo project
  await signIn(page, ADMIN);
  await tab(page, 'Settings');
  await page.getByLabel('Member email').fill(BOB.email);
  await page.getByLabel('Project role', { exact: true }).selectOption('viewer');
  await page.getByRole('button', { name: 'Give access' }).click();
  await expect(page.getByText(BOB.email).first()).toBeVisible();
  await page.getByRole('button', { name: 'Sign out' }).click();

  await signIn(page, BOB);
  await expect(page.getByText('Quality Engineering Console')).toBeVisible();
  await expect(page.getByText('read-only', { exact: true })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/09-member-viewer.png` });
});

test('reset link lets a user set a new password exactly once', async ({ page, browser }) => {
  await signIn(page, ADMIN);
  await tab(page, 'Settings');
  const bobRow = page.getByRole('listitem').filter({ hasText: BOB.email }).last();
  await bobRow.getByRole('button', { name: 'Reset link' }).click();
  const url = await page.getByLabel('Reset link').inputValue();
  expect(url).toContain('?reset=');

  const ctx = await browser.newContext();
  const p2 = await ctx.newPage();
  await p2.goto(url);
  await expect(p2.getByRole('heading', { name: 'Set a new password' })).toBeVisible();
  await p2.screenshot({ path: `${SHOTS}/10-reset.png` });
  await p2.getByLabel(/New password/).fill('brand-new-passphrase');
  await p2.getByRole('button', { name: /Set password/ }).click();
  await expect(p2.getByText('Quality Engineering Console')).toBeVisible();
  expect(p2.url()).not.toContain('reset=');

  const p3 = await (await browser.newContext()).newPage();
  await p3.goto(url);
  await p3.getByLabel(/New password/).fill('yet-another-new-one-1');
  await p3.getByRole('button', { name: /Set password/ }).click();
  await expect(p3.getByRole('alert')).toContainText('invalid or has expired');
});

test('wrong password shows an error and stays signed out', async ({ page }) => {
  await signIn(page, { email: ADMIN.email, password: 'definitely-wrong-pass' });
  await expect(page.getByRole('alert')).toContainText('Invalid email or password');
});

test('mobile layout has no horizontal overflow', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await signIn(page, ADMIN);
  await expect(page.getByText('Quality Engineering Console')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  await page.screenshot({ path: `${SHOTS}/11-mobile-dashboard.png`, fullPage: true });
  expect(overflow).toBeLessThanOrEqual(1);
});
