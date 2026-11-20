import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculatePackYears,
  calculateWeeklyAlcoholUnits,
  EMPTY_WEEKLY_DRINKS,
  formatItalianNumber,
} from './exposureCalculators';

test('calculatePackYears computes exact clinical (cigarettes/day ÷ 20) × years formula', () => {
  assert.equal(calculatePackYears(20, 10), 10);
  assert.equal(calculatePackYears(10, 15), 7.5);
  assert.equal(calculatePackYears(7, 12), 4.2);
  assert.equal(calculatePackYears(0, 10), 0);
  // Partial inputs do not overwrite with 0
  assert.equal(calculatePackYears(10, null), null);
  assert.equal(calculatePackYears(null, 15), null);
  // Clamped safely at validation maximum (100)
  assert.equal(calculatePackYears(60, 50), 100);
});

test('calculateWeeklyAlcoholUnits converts everyday Italian drinks into ISS/CREA alcoholic units', () => {
  assert.equal(calculateWeeklyAlcoholUnits(EMPTY_WEEKLY_DRINKS), 0);
  assert.equal(
    calculateWeeklyAlcoholUnits({
      wineGlasses: 3,
      smallBeers: 2,
      aperitifsCocktails: 1,
      spiritsShots: 0,
    }),
    6.5
  );
  assert.equal(
    calculateWeeklyAlcoholUnits({
      wineGlasses: 0,
      smallBeers: 0,
      aperitifsCocktails: 2,
      spiritsShots: 1,
    }),
    4
  );
  // Handles negative/NaN defensively and caps at 100
  assert.equal(
    calculateWeeklyAlcoholUnits({
      wineGlasses: -3,
      smallBeers: Number.NaN,
      aperitifsCocktails: 0,
      spiritsShots: 2,
    }),
    2
  );
});

test('formatItalianNumber uses comma for decimals and keeps integers clean', () => {
  assert.equal(formatItalianNumber(6), '6');
  assert.equal(formatItalianNumber(7.5), '7,5');
});
