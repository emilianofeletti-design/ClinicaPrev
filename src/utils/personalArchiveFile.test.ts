import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CLINICAL_PROFILE, evaluateClinicalRisk } from './clinicalRiskEngine';
import {
  buildLongitudinalSeries,
  buildPersonalArchiveFile,
  computeLongitudinalDelta,
  createPersonalAnalysisRecord,
  parsePersonalArchiveFile,
  serializePersonalArchiveFile,
} from './personalArchiveFile';

test('personal archive file round-trips cleanly and preserves chronological timeline when lifestyle improves', () => {
  // Baseline 6 months ago: active smoker, low workouts
  const baselineProfile = {
    ...DEFAULT_CLINICAL_PROFILE,
    smokingStatus: 'current_heavy' as const,
    packYears: 18,
    workoutsPerWeek: 0,
    minutesPerWorkout: 0,
    dailySteps: 3500,
    weightKg: 88,
  };
  const baselineRes = evaluateClinicalRisk(baselineProfile);
  const oldRec = createPersonalAnalysisRecord(
    baselineProfile,
    baselineRes,
    'Controllo Maggio 2026',
    '2026-05-20T10:00:00.000Z'
  );

  // Today: quit smoking, 4x45 combined workouts, 8500 steps, lost 6 kg
  const improvedProfile = {
    ...baselineProfile,
    smokingStatus: 'former' as const,
    workoutsPerWeek: 4,
    minutesPerWorkout: 45,
    activityType: 'combined' as const,
    dailySteps: 8500,
    weightKg: 82,
    waistCm: 91,
  };
  const improvedRes = evaluateClinicalRisk(improvedProfile);
  const newRec = createPersonalAnalysisRecord(
    improvedProfile,
    improvedRes,
    'Controllo Novembre 2026',
    '2026-11-20T10:00:00.000Z'
  );

  const archive = buildPersonalArchiveFile([oldRec], newRec);
  const serialized = serializePersonalArchiveFile(archive);
  const parsed = parsePersonalArchiveFile(serialized);

  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.archive.records.length, 2);
    assert.equal(parsed.latestRecord.label, 'Controllo Novembre 2026');
    const delta = computeLongitudinalDelta(parsed.archive.records[0], parsed.archive.records[1]);
    assert.ok(delta.cvdDeltaPct < 0, 'Quitting smoking and exercising should lower CVD risk');
    assert.ok(delta.oncologicDeltaIndex < 0, 'Lifestyle improvement should lower oncologic index');
    assert.ok(delta.daysElapsed >= 180);
  }
});

test('parsePersonalArchiveFile rejects invalid JSON or incompatible schemas cleanly', () => {
  const badJson = parsePersonalArchiveFile('{not valid json');
  assert.equal(badJson.ok, false);

  const wrongApp = parsePersonalArchiveFile(JSON.stringify({ appName: 'OtherApp', schemaVersion: 1, records: [] }));
  assert.equal(wrongApp.ok, false);
});

test('buildLongitudinalSeries sorts historical records chronologically, supports includeCurrent toggle, and normalizes 0-100', () => {
  const baseRes = evaluateClinicalRisk(DEFAULT_CLINICAL_PROFILE);
  const recFeb = createPersonalAnalysisRecord(
    DEFAULT_CLINICAL_PROFILE,
    baseRes,
    'Febbraio 2026',
    '2026-02-10T10:00:00.000Z'
  );
  const recJun = createPersonalAnalysisRecord(
    DEFAULT_CLINICAL_PROFILE,
    baseRes,
    'Giugno 2026',
    '2026-06-15T10:00:00.000Z'
  );
  const recNow = createPersonalAnalysisRecord(
    DEFAULT_CLINICAL_PROFILE,
    baseRes,
    'Analisi attuale',
    '2026-11-20T10:00:00.000Z'
  );

  // Pass unsorted historical records
  const withCurrent = buildLongitudinalSeries([recJun, recFeb], recNow, true);
  assert.equal(withCurrent.length, 3);
  assert.equal(withCurrent[0].label, 'Febbraio 2026');
  assert.equal(withCurrent[1].label, 'Giugno 2026');
  assert.equal(withCurrent[2].dateLabel, 'Oggi');
  assert.equal(withCurrent[2].isCurrent, true);

  for (const pt of withCurrent) {
    assert.ok(pt.cvdNormalized >= 0 && pt.cvdNormalized <= 100);
    assert.ok(pt.findriscNormalized >= 0 && pt.findriscNormalized <= 100);
    assert.ok(pt.oncologicNormalized >= 0 && pt.oncologicNormalized <= 100);
  }

  const historyOnly = buildLongitudinalSeries([recJun, recFeb], recNow, false);
  assert.equal(historyOnly.length, 2);
  assert.equal(historyOnly[0].label, 'Febbraio 2026');
  assert.equal(historyOnly[1].label, 'Giugno 2026');
});
