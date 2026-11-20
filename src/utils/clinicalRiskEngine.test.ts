import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateBmi,
  calculateCardiovascularRisk,
  calculateFindriscScore,
  calculateOncologicRiskIndex,
  CLINICAL_PRESETS,
  DEFAULT_CLINICAL_PROFILE,
  draftToClinicalProfile,
  EMPTY_CLINICAL_DRAFT,
  evaluateClinicalRisk,
  profileToDraft,
  validateClinicalDraft,
  validateClinicalProfile,
} from './clinicalRiskEngine';

test('calculateBmi computes exact WHO BMI values', () => {
  assert.equal(calculateBmi(180, 81), 25);
  assert.equal(calculateBmi(170, 65), 22.5);
  assert.equal(calculateBmi(175, 98), 32);
});

test('FINDRISC exact protocol boundaries match Lindström & Tuomilehto (2003)', () => {
  const optimalProfile = CLINICAL_PRESETS.find((p) => p.id === 'protective')!.profile;
  const optimalBmi = calculateBmi(optimalProfile.heightCm, optimalProfile.weightKg);
  const lowRes = calculateFindriscScore(optimalProfile, optimalBmi);
  assert.equal(lowRes.points, 0);
  assert.equal(lowRes.tenYearProbabilityPct, 1);
  assert.equal(lowRes.tier, 'low');

  const highProfile = CLINICAL_PRESETS.find((p) => p.id === 'high_cardiometabolic')!.profile;
  const highBmi = calculateBmi(highProfile.heightCm, highProfile.weightKg);
  const highRes = calculateFindriscScore(highProfile, highBmi);
  // Age 61 (+3) + BMI 32 (+3) + Waist 109 male (+4) + Activity 30m (+2) + Fruit 1 (+1)
  // + HTN meds (+2) + High glucose (+5) + Family 1st degree (+5) = 25
  assert.equal(highRes.points, 25);
  assert.equal(highRes.tenYearProbabilityPct, 50);
  assert.equal(highRes.tier, 'very_high');
});

test('ESC SCORE2 cardiovascular risk responds monotonically to smoking and blood pressure', () => {
  const base = { ...DEFAULT_CLINICAL_PROFILE, smokingStatus: 'never' as const, systolicBp: 118 };
  const bmi = calculateBmi(base.heightCm, base.weightKg);
  const baseCvd = calculateCardiovascularRisk(base, bmi);

  const smokerHigherBp = {
    ...base,
    smokingStatus: 'current_heavy' as const,
    systolicBp: 154,
  };
  const elevatedCvd = calculateCardiovascularRisk(smokerHigherBp, bmi);

  assert.ok(
    elevatedCvd.tenYearRiskPct > baseCvd.tenYearRiskPct * 1.8,
    `Expected smoking + high SBP (${elevatedCvd.tenYearRiskPct}%) to markedly exceed baseline (${baseCvd.tenYearRiskPct}%)`
  );
});

test('WCRF/IARC oncologic index and What-If simulator quantify risk reductions', () => {
  const highProfile = CLINICAL_PRESETS.find((p) => p.id === 'high_cardiometabolic')!.profile;
  const result = evaluateClinicalRisk(highProfile);

  assert.ok(result.oncologic.scoreNumeric >= 65, 'High-risk profile should have elevated oncologic index');
  assert.ok(result.modifiableScenarios.length >= 3, 'Should produce actionable modifiable scenarios');

  const quitSmokingScenario = result.modifiableScenarios.find((s) => s.id === 'quit_smoking');
  assert.ok(quitSmokingScenario, 'Smoking cessation scenario must be generated for active smokers');
  assert.ok(quitSmokingScenario.cvdDeltaPct < 0, 'Quitting smoking must reduce cardiovascular risk');
  assert.ok(quitSmokingScenario.oncologicDeltaIndex < 0, 'Quitting smoking must reduce oncologic risk index');

  const protectiveProfile = CLINICAL_PRESETS.find((p) => p.id === 'protective')!.profile;
  const protBmi = calculateBmi(protectiveProfile.heightCm, protectiveProfile.weightKg);
  const protOnco = calculateOncologicRiskIndex(protectiveProfile, protBmi);
  assert.equal(protOnco.tier, 'low');
  assert.ok(protOnco.wcrfAdherenceScore >= 6.5);
});

test('validateClinicalProfile catches out-of-range biometric inputs without silent fallback', () => {
  const invalid = {
    ...DEFAULT_CLINICAL_PROFILE,
    age: 12,
    systolicBp: 300,
    totalCholesterolMgDl: 150,
    hdlCholesterolMgDl: 160,
  };
  const errors = validateClinicalProfile(invalid);
  assert.ok(errors.age);
  assert.ok(errors.systolicBp);
  assert.ok(errors.hdlCholesterolMgDl);
});

test('optional cholesterol values (null, 0, or partial) pass validation and use EU medians', () => {
  const withoutLipids = {
    ...DEFAULT_CLINICAL_PROFILE,
    totalCholesterolMgDl: null,
    hdlCholesterolMgDl: null,
  };
  assert.deepEqual(validateClinicalProfile(withoutLipids), {});
  const resNull = evaluateClinicalRisk(withoutLipids);
  assert.ok(resNull.cardiovascular.scoreNumeric > 0);
  assert.equal(resNull.cardiovascular.secondaryScoreValue, 'Mediana UE · Basso Rischio');
  assert.ok(resNull.cardiovascular.assumptionsUsed.length >= 1);

  const zeroLipids = {
    ...DEFAULT_CLINICAL_PROFILE,
    totalCholesterolMgDl: 0,
    hdlCholesterolMgDl: 0,
  };
  assert.deepEqual(validateClinicalProfile(zeroLipids), {});

  const partialLipid = {
    ...DEFAULT_CLINICAL_PROFILE,
    totalCholesterolMgDl: 210,
    hdlCholesterolMgDl: null,
  };
  assert.deepEqual(validateClinicalProfile(partialLipid), {});
});

test('workout frequency, duration, activity type, and daily steps measurably affect clinical risk', () => {
  const lightSedentary = {
    ...DEFAULT_CLINICAL_PROFILE,
    workoutsPerWeek: 2,
    minutesPerWorkout: 30,
    activityType: 'light' as const,
    dailySteps: 3000,
  };
  const combinedActive = {
    ...DEFAULT_CLINICAL_PROFILE,
    workoutsPerWeek: 4,
    minutesPerWorkout: 45,
    activityType: 'combined' as const,
    dailySteps: 9500,
  };

  assert.deepEqual(validateClinicalProfile(lightSedentary), {});
  assert.deepEqual(validateClinicalProfile(combinedActive), {});

  const lowRes = evaluateClinicalRisk(lightSedentary);
  const highRes = evaluateClinicalRisk(combinedActive);

  assert.ok(
    highRes.cardiovascular.scoreNumeric < lowRes.cardiovascular.scoreNumeric,
    'Combined training + 9.500 daily steps must lower cardiovascular risk'
  );
  assert.ok(
    highRes.metabolic.scoreNumeric < lowRes.metabolic.scoreNumeric,
    'Combined training + 9.500 daily steps must lower FINDRISC diabetes score'
  );
  assert.ok(
    highRes.oncologic.scoreNumeric < lowRes.oncologic.scoreNumeric,
    'Combined training + 9.500 daily steps must lower oncologic risk index'
  );

  // Optional daily steps left blank (null) must validate cleanly
  const noSteps = { ...combinedActive, dailySteps: null };
  assert.deepEqual(validateClinicalProfile(noSteps), {});
});

test('EMPTY_CLINICAL_DRAFT starts empty and validateClinicalDraft highlights missing required fields only', () => {
  const errs = validateClinicalDraft(EMPTY_CLINICAL_DRAFT);
  // Core required fields must be flagged
  const expectedRequired = [
    'age',
    'sex',
    'heightCm',
    'weightKg',
    'waistCm',
    'systolicBp',
    'fruitVegServingsPerDay',
    'redProcessedMeatServingsPerWeek',
    'ultraProcessedIntake',
    'alcoholUnitsPerWeek',
    'smokingStatus',
    'workoutsPerWeek',
    'sedentaryHoursPerDay',
    'sleepHoursPerNight',
    'uvProtection',
    'familyHistoryDiabetes',
  ];
  for (const field of expectedRequired) {
    assert.ok(errs[field], `Expected missing required field "${field}" to be highlighted`);
  }

  // Optional fields must NOT be flagged when empty
  assert.equal(errs.totalCholesterolMgDl, undefined);
  assert.equal(errs.hdlCholesterolMgDl, undefined);
  assert.equal(errs.dailySteps, undefined);

  // Completed draft without optional cholesterol & steps must pass validation cleanly
  const filledWithoutOptionals = {
    ...profileToDraft(DEFAULT_CLINICAL_PROFILE),
    totalCholesterolMgDl: null,
    hdlCholesterolMgDl: null,
    dailySteps: null,
  };
  assert.deepEqual(validateClinicalDraft(filledWithoutOptionals), {});
  const converted = draftToClinicalProfile(filledWithoutOptionals);
  const res = evaluateClinicalRisk(converted);
  assert.ok(res.cardiovascular.scoreNumeric > 0);
});

test('populationComparison produces calibrated EU reference ranges for all 3 pathologies', () => {
  const protective = CLINICAL_PRESETS.find((p) => p.id === 'protective')!.profile;
  const highRisk = CLINICAL_PRESETS.find((p) => p.id === 'high_cardiometabolic')!.profile;

  const protRes = evaluateClinicalRisk(protective);
  const highRes = evaluateClinicalRisk(highRisk);

  assert.equal(protRes.populationComparison.length, 3);
  assert.equal(highRes.populationComparison.length, 3);

  for (const item of protRes.populationComparison) {
    assert.equal(item.statusLabel, 'Sotto la media UE');
    assert.ok(item.userNormalized < item.populationMedianNormalized);
    assert.ok(item.populationLowNormalized <= item.populationMedianNormalized);
    assert.ok(item.populationMedianNormalized <= item.populationHighNormalized);
  }

  for (const item of highRes.populationComparison) {
    assert.equal(item.statusLabel, 'Sopra il range UE');
    assert.ok(item.userNormalized > item.populationHighNormalized);
  }
});




