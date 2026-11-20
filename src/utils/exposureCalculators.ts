export interface WeeklyAlcoholDrinks {
  wineGlasses: number;
  smallBeers: number;
  aperitifsCocktails: number;
  spiritsShots: number;
}

export const EMPTY_WEEKLY_DRINKS: WeeklyAlcoholDrinks = {
  wineGlasses: 0,
  smallBeers: 0,
  aperitifsCocktails: 0,
  spiritsShots: 0,
};

/**
 * Italian ISS / CREA standard alcoholic unit weights (1 UA = 12 g pure ethanol):
 * - 125 ml wine (~12% ABV) = 1.0 UA
 * - 330 ml beer (~5% ABV) = 1.0 UA
 * - Aperitif / Spritz / Cocktail (~150-200 ml) = 1.5 UA
 * - 40 ml spirit / amaro (~40% ABV) = 1.0 UA
 */
export const ALCOHOL_UNIT_WEIGHTS: Record<keyof WeeklyAlcoholDrinks, number> = {
  wineGlasses: 1.0,
  smallBeers: 1.0,
  aperitifsCocktails: 1.5,
  spiritsShots: 1.0,
};

export function calculateWeeklyAlcoholUnits(drinks: WeeklyAlcoholDrinks): number {
  const safe = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);
  const raw =
    safe(drinks.wineGlasses) * ALCOHOL_UNIT_WEIGHTS.wineGlasses +
    safe(drinks.smallBeers) * ALCOHOL_UNIT_WEIGHTS.smallBeers +
    safe(drinks.aperitifsCocktails) * ALCOHOL_UNIT_WEIGHTS.aperitifsCocktails +
    safe(drinks.spiritsShots) * ALCOHOL_UNIT_WEIGHTS.spiritsShots;

  const rounded = Math.round(raw * 10) / 10;
  return Math.min(100, Math.max(0, rounded));
}

/**
 * Standard clinical pack-years calculation:
 * pack-years = (cigarettes per day / 20) * years smoked.
 * Returns null if either input is missing so partial typing does not clobber existing values.
 */
export function calculatePackYears(
  cigarettesPerDay: number | null,
  yearsSmoked: number | null
): number | null {
  if (
    cigarettesPerDay === null ||
    yearsSmoked === null ||
    !Number.isFinite(cigarettesPerDay) ||
    !Number.isFinite(yearsSmoked)
  ) {
    return null;
  }
  const cigs = Math.max(0, cigarettesPerDay);
  const years = Math.max(0, yearsSmoked);
  const raw = (cigs / 20) * years;
  const rounded = Math.round(raw * 10) / 10;
  return Math.min(100, Math.max(0, rounded));
}

export function formatItalianNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace('.', ',');
}
