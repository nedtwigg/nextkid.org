import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.TEST_URL || 'http://localhost:8787';
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const alice = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const bob = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const a = await alice.newPage();
  const b = await bob.newPage();
  for (const page of [a, b]) page.on('pageerror', error => errors.push(error.message));
  await a.goto(base);
  await a.getByRole('button', { name: 'New game', exact: true }).click();
  await a.getByLabel('Left coach').fill('Alice');
  await a.getByLabel('Right coach').fill('Bob');
  const players = ['Maya', 'Sam', 'Ivy', 'Leo', 'Ava', 'Finn', 'Nora', 'Owen', 'Theo', 'Eli', 'Kai', 'Lily', 'Ezra', 'Mila', 'Jude'];
  for (let i = 0; i < players.length; i++) {
    if (await a.getByLabel(`Player ${i + 1}`, { exact: true }).count() === 0) await a.getByRole('button', { name: 'Add player', exact: true }).click();
    await a.getByLabel(`Player ${i + 1}`, { exact: true }).fill(players[i]);
  }
  await a.getByRole('button', { name: 'Begin pregame' }).click();
  await a.waitForURL('**/g/*');
  await b.goto(a.url());
  await a.getByRole('button', { name: 'Share game link' }).filter({ hasText: '2 live' }).waitFor();
  await b.getByRole('button', { name: 'Share game link' }).filter({ hasText: '2 live' }).waitFor();
  await Promise.all([
    a.getByRole('button', { name: /^Maya, not here/ }).click(),
    b.getByRole('button', { name: /^Sam, not here/ }).click(),
  ]);
  for (const player of players.slice(2, 9)) await a.getByRole('button', { name: new RegExp(`^${player}, not here`) }).click();
  await b.getByRole('button', { name: /^Theo, here/ }).waitFor();
  await a.getByRole('button', { name: 'Go to game' }).click();
  await b.getByRole('button', { name: 'START', exact: true }).waitFor();
  await a.getByRole('button', { name: 'START', exact: true }).click();
  await b.getByText('RUNNING', { exact: true }).waitFor();
  await a.getByRole('button', { name: /^Maya, more|^Maya, playing/ }).click();
  await a.getByRole('button', { name: 'Move Maya to bench' }).click();
  await b.getByRole('region', { name: 'Bench', exact: true }).getByRole('button', { name: /^Maya,/ }).waitFor();
  await b.getByRole('button', { name: 'STOP', exact: true }).click();
  await a.getByText('PAUSED', { exact: true }).waitFor();
  assert.equal(await a.locator('.clock-bar strong').textContent(), await b.locator('.clock-bar strong').textContent());
  await a.getByRole('button', { name: /Alice, left coach/ }).click();
  assert.match(await a.getByTestId('left-field').textContent(), /Bob/);
  assert.match(await b.getByTestId('left-field').textContent(), /Alice/);
  console.log('PASS: real game creation, two-phone attendance, moves, clock, and independent field orientation');

  await a.getByRole('button', { name: /Attendance/ }).click();
  await a.getByRole('button', { name: /^Lily, not here/ }).click();
  await a.getByRole('button', { name: 'Go to game' }).click();
  await b.getByRole('region', { name: 'Bench', exact: true }).getByRole('button', { name: /^Lily,/ }).waitFor();
  await a.reload();
  await a.getByRole('button', { name: 'Share game link' }).filter({ hasText: '2 live' }).waitFor();
  await a.getByRole('region', { name: 'Bench', exact: true }).getByRole('button', { name: /^Lily,/ }).waitFor();
  // The offline event must pause edits even if the browser leaves a socket open.
  await alice.setOffline(true);
  await a.getByText('RECONNECTING · EDITS PAUSED', { exact: true }).waitFor({ timeout: 55000 });
  assert.equal(await a.getByRole('button', { name: 'START', exact: true }).isDisabled(), true);
  await b.getByRole('button', { name: /^Lily,/ }).click();
  await b.getByRole('button', { name: 'Move Lily here' }).last().click();
  await alice.setOffline(false);
  await a.getByRole('button', { name: 'Share game link' }).filter({ hasText: '2 live' }).waitFor({ timeout: 20000 });
  await a.locator('[data-zone="bob"]').getByRole('button', { name: /^Lily,/ }).waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS: late arrivals, reload, offline edit lockout, reconnect and reconciliation; no browser errors');
} finally {
  await browser.close();
}
