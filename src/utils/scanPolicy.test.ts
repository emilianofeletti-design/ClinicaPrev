import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeMonthlyScanEligibility,
  DAY_MS,
  MONTHLY_SCAN_COOLDOWN_DAYS,
} from './scanPolicy';

test('computeMonthlyScanEligibility locks scans for 30 days and unlocks on day 30 or later', () => {
  const baseIso = '2026-11-20T00:00:00.000Z';
  const baseMs = new Date(baseIso).getTime();

  // Day 0: locked for 30 days
  const day0 = computeMonthlyScanEligibility(baseIso, baseMs);
  assert.equal(day0.canRunScan, false);
  assert.equal(day0.daysUntilNextScan, MONTHLY_SCAN_COOLDOWN_DAYS);

  // Day 15: locked with 15 days remaining
  const day15 = computeMonthlyScanEligibility(baseIso, baseMs + 15 * DAY_MS);
  assert.equal(day15.canRunScan, false);
  assert.equal(day15.daysUntilNextScan, 15);

  // Day 29.5: still locked with 1 day remaining
  const day29Half = computeMonthlyScanEligibility(baseIso, baseMs + 29.5 * DAY_MS);
  assert.equal(day29Half.canRunScan, false);
  assert.equal(day29Half.daysUntilNextScan, 1);

  // Exact day 30: unlocked
  const day30 = computeMonthlyScanEligibility(baseIso, baseMs + 30 * DAY_MS);
  assert.equal(day30.canRunScan, true);
  assert.equal(day30.daysUntilNextScan, 0);

  // Day 365 (visitor comes once a year): unlocked so a single refresh runs on demand
  const day365 = computeMonthlyScanEligibility(baseIso, baseMs + 365 * DAY_MS);
  assert.equal(day365.canRunScan, true);
  assert.equal(day365.daysUntilNextScan, 0);
});
