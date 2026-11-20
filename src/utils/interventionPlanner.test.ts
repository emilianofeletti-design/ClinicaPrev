import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLINICAL_PRESETS,
  DEFAULT_CLINICAL_PROFILE,
  evaluateClinicalRisk,
} from './clinicalRiskEngine';
import { createPersonalAnalysisRecord } from './personalArchiveFile';
import {
  buildPersonalizedInterventionPlan,
  evaluateHistoricalTrajectory,
  simulateSelectedInterventions,
} from './interventionPlanner';

test('buildPersonalizedInterventionPlan generates prioritized, data-driven interventions for high-risk profile', () => {
  const highRiskPreset = CLINICAL_PRESETS.find((p) => p.id === 'high_cardiometabolic')!;
  const result = evaluateClinicalRisk(highRiskPreset.profile);
  const plan = buildPersonalizedInterventionPlan(highRiskPreset.profile, result);

  assert.equal(plan.isAlreadyOptimal, false);
  assert.ok(plan.interventions.length >= 6, 'High-risk profile should yield multiple concrete levers');
  assert.equal(plan.interventions[0].priority, 'alta', 'Highest-priority actions should sort first');

  const smokingAction = plan.interventions.find((a) => a.factorKey === 'smoking');
  assert.ok(smokingAction, 'Active smoker must receive tobacco cessation intervention');
  assert.ok(smokingAction.simulatedDelta.cvdDeltaPct < 0);
  assert.ok(smokingAction.simulatedDelta.oncologicDeltaIndex < 0);
  assert.ok(smokingAction.howToSteps.length >= 3);

  const combined = simulateSelectedInterventions(
    highRiskPreset.profile,
    result,
    plan.interventions,
    plan.defaultSelectedIds
  );
  assert.ok(combined.selectedCount >= 4);
  assert.ok(combined.projectedCvdPct < combined.baseCvdPct, 'Combined plan must lower CVD risk');
  assert.ok(combined.projectedFindrisc < combined.baseFindrisc, 'Combined plan must lower FINDRISC');
  assert.ok(combined.projectedOnco < combined.baseOnco, 'Combined plan must lower oncologic index');
});

test('buildPersonalizedInterventionPlan recognizes already-optimal protective profile without false high alarms', () => {
  const protective = CLINICAL_PRESETS.find((p) => p.id === 'protective')!;
  const result = evaluateClinicalRisk(protective.profile);
  const plan = buildPersonalizedInterventionPlan(protective.profile, result);

  assert.equal(plan.isAlreadyOptimal, true);
  assert.equal(
    plan.interventions.filter((i) => i.priority === 'alta' || i.priority === 'media').length,
    0
  );
  assert.ok(plan.protectiveStrengths.length >= 4);
});

test('evaluateHistoricalTrajectory detects clear improvement and lists consolidated factor progress', () => {
  const baselineProfile = {
    ...DEFAULT_CLINICAL_PROFILE,
    smokingStatus: 'current_heavy' as const,
    packYears: 20,
    systolicBp: 146,
    weightKg: 92,
    waistCm: 103,
    workoutsPerWeek: 0,
    minutesPerWorkout: 0,
    dailySteps: 3400,
    alcoholUnitsPerWeek: 14,
  };
  const baselineRec = createPersonalAnalysisRecord(
    baselineProfile,
    evaluateClinicalRisk(baselineProfile),
    'Controllo Gennaio 2026',
    '2026-01-15T10:00:00.000Z'
  );

  const currentProfile = {
    ...baselineProfile,
    smokingStatus: 'former' as const,
    systolicBp: 126,
    weightKg: 84,
    waistCm: 93,
    workoutsPerWeek: 4,
    minutesPerWorkout: 45,
    activityType: 'combined' as const,
    dailySteps: 8600,
    alcoholUnitsPerWeek: 2,
  };
  const currentRes = evaluateClinicalRisk(currentProfile);
  const currentRec = createPersonalAnalysisRecord(
    currentProfile,
    currentRes,
    'Analisi attuale',
    '2026-07-20T10:00:00.000Z'
  );

  const evaluation = evaluateHistoricalTrajectory([baselineRec], currentRec, baselineRec);

  assert.equal(evaluation.verdict, 'improving');
  assert.ok(evaluation.improvedFactors.some((f) => f.factorKey === 'smoking'));
  assert.ok(evaluation.improvedFactors.some((f) => f.factorKey === 'blood_pressure'));
  assert.ok(evaluation.improvedFactors.some((f) => f.factorKey === 'adiposity'));
  assert.ok(evaluation.improvedFactors.some((f) => f.factorKey === 'activity'));
  assert.ok(evaluation.improvedFactors.some((f) => f.factorKey === 'alcohol'));
  assert.equal(evaluation.worsenedFactors.length, 0);
});

test('evaluateHistoricalTrajectory detects worsening trend and tags regressed levers in intervention plan', () => {
  const baselineProfile = {
    ...DEFAULT_CLINICAL_PROFILE,
    systolicBp: 120,
    weightKg: 76,
    waistCm: 88,
    workoutsPerWeek: 4,
    minutesPerWorkout: 45,
    activityType: 'combined' as const,
    dailySteps: 8500,
    alcoholUnitsPerWeek: 2,
  };
  const baselineRec = createPersonalAnalysisRecord(
    baselineProfile,
    evaluateClinicalRisk(baselineProfile),
    'Controllo Marzo 2026',
    '2026-03-10T10:00:00.000Z'
  );

  const regressedProfile = {
    ...baselineProfile,
    systolicBp: 142,
    weightKg: 86,
    waistCm: 99,
    workoutsPerWeek: 1,
    minutesPerWorkout: 30,
    activityType: 'light' as const,
    dailySteps: 4200,
    alcoholUnitsPerWeek: 12,
  };
  const regressedRes = evaluateClinicalRisk(regressedProfile);
  const currentRec = createPersonalAnalysisRecord(
    regressedProfile,
    regressedRes,
    'Analisi attuale',
    '2026-11-20T10:00:00.000Z'
  );

  const evaluation = evaluateHistoricalTrajectory([baselineRec], currentRec, baselineRec);
  assert.equal(evaluation.verdict, 'worsening');
  assert.ok(evaluation.worsenedFactors.length >= 4);

  const plan = buildPersonalizedInterventionPlan(regressedProfile, regressedRes, undefined, evaluation);
  const bpAction = plan.interventions.find((a) => a.factorKey === 'blood_pressure');
  assert.ok(bpAction?.historicalContext, 'Regressed factor should display historical context');
  assert.equal(bpAction?.historicalContext?.direction, 'worsened');
});

test('evaluateHistoricalTrajectory detects stable trajectory when scores do not materially change', () => {
  const baseRes = evaluateClinicalRisk(DEFAULT_CLINICAL_PROFILE);
  const baselineRec = createPersonalAnalysisRecord(
    DEFAULT_CLINICAL_PROFILE,
    baseRes,
    'Controllo Agosto 2026',
    '2026-08-01T10:00:00.000Z'
  );
  const currentRec = createPersonalAnalysisRecord(
    DEFAULT_CLINICAL_PROFILE,
    baseRes,
    'Analisi attuale',
    '2026-11-20T10:00:00.000Z'
  );

  const evaluation = evaluateHistoricalTrajectory([baselineRec], currentRec, baselineRec);
  assert.equal(evaluation.verdict, 'stable');
  assert.equal(evaluation.improvedFactors.length, 0);
  assert.equal(evaluation.worsenedFactors.length, 0);
});

test('getPersonalizedAdvice in RiskDashboard generates guideline-based suggestions (sodium, daily BP monitoring, activity, smoking) and icon categories', async () => {
  const { getPersonalizedAdvice } = await import('../components/RiskDashboard');

  const highRiskPreset = CLINICAL_PRESETS.find((p) => p.id === 'high_cardiometabolic')!;
  const highRiskResult = evaluateClinicalRisk(highRiskPreset.profile);
  const adviceList = getPersonalizedAdvice(highRiskPreset.profile, highRiskResult);

  const bpAdvice = adviceList.find((a) => a.iconCategory === 'hypertension');
  assert.ok(bpAdvice, 'Elevated systolic BP must trigger hypertension advice');
  assert.ok(
    bpAdvice.suggestedActions.some((s) => /Riduzione apporto sodico/i.test(s)),
    'Hypertension advice must include sodium reduction'
  );
  assert.ok(
    bpAdvice.suggestedActions.some((s) => /Monitoraggio pressorio quotidiano/i.test(s)),
    'Hypertension advice must include daily blood pressure monitoring'
  );
  assert.ok(bpAdvice.guideline.includes('ESC'));

  assert.ok(
    adviceList.some((a) => a.iconCategory === 'activity' && /Incremento attività fisica/i.test(a.title)),
    'Insufficient activity must trigger physical activity advice'
  );
  assert.ok(
    adviceList.some((a) => a.iconCategory === 'smoking' && /Cessazione del fumo/i.test(a.title)),
    'Active smoker must trigger tobacco cessation advice'
  );
  assert.equal(adviceList[0].severity, 'urgent', 'Urgent alerts must be sorted first');

  const protectivePreset = CLINICAL_PRESETS.find((p) => p.id === 'protective')!;
  const protectiveResult = evaluateClinicalRisk(protectivePreset.profile);
  const optimalAdvice = getPersonalizedAdvice(protectivePreset.profile, protectiveResult);
  assert.equal(optimalAdvice.length, 1);
  assert.equal(optimalAdvice[0].severity, 'positive');
  assert.equal(optimalAdvice[0].iconCategory, 'protective');
});

