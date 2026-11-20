export const MONTHLY_SCAN_COOLDOWN_DAYS = 30;
export const DAY_MS = 24 * 60 * 60 * 1000;
export const MONTHLY_SCAN_COOLDOWN_MS = MONTHLY_SCAN_COOLDOWN_DAYS * DAY_MS;

export interface MonthlyScanEligibility {
  canRunScan: boolean;
  daysUntilNextScan: number;
  nextScheduledScanIso: string;
}

/**
 * Pure 30-day cooldown policy for lazy on-demand scientific source updates.
 * Guarantees at most one external API refresh every 30 days, triggered only
 * when a user visits and explicitly requests an update after the window expires.
 */
export function computeMonthlyScanEligibility(
  lastMonthlyScanIso: string,
  nowMs: number = Date.now()
): MonthlyScanEligibility {
  const lastMs = new Date(lastMonthlyScanIso).getTime();
  if (!Number.isFinite(lastMs)) {
    return {
      canRunScan: true,
      daysUntilNextScan: 0,
      nextScheduledScanIso: new Date(nowMs).toISOString(),
    };
  }

  const nextMs = lastMs + MONTHLY_SCAN_COOLDOWN_MS;
  const remainingMs = Math.max(0, nextMs - nowMs);
  const canRunScan = remainingMs === 0;
  const daysUntilNextScan = canRunScan ? 0 : Math.ceil(remainingMs / DAY_MS);

  return {
    canRunScan,
    daysUntilNextScan,
    nextScheduledScanIso: new Date(nextMs).toISOString(),
  };
}
