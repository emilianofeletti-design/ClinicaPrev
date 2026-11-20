import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyApprovedProposal,
  applyGuardedAutoUpdates,
  BASELINE_PARAMETER_PROPOSALS,
  BASELINE_PARAMETER_REVISIONS,
  DEFAULT_CLINICAL_PARAMETERS,
  rollbackToRevision,
  validateParameterUpdate,
  type ParameterUpdateProposal,
} from './clinicalParameters';

test('applyGuardedAutoUpdates applies valid guarded_auto proposals and NEVER auto-applies manual_review core protocols', () => {
  const outcome = applyGuardedAutoUpdates(
    DEFAULT_CLINICAL_PARAMETERS,
    BASELINE_PARAMETER_PROPOSALS
  );

  assert.equal(outcome.appliedProposals.length, 2);
  assert.equal(outcome.nextParams.upfHighRiskOncoPoints, 7);
  assert.equal(outcome.nextParams.dailyStepsOptimalThreshold, 7500);
  // Core ESC SCORE2 calibration factor MUST remain untouched (manual_review only)
  assert.equal(outcome.nextParams.score2RegionCalibrationFactor, 0.88);
  assert.equal(outcome.nextParams.updateMode, 'guarded_auto');
  assert.ok(outcome.revision !== null);

  const score2Prop = outcome.updatedProposals.find((p) => p.id === 'prop_score2_esc_review');
  assert.equal(score2Prop?.status, 'pending');
});

test('guardrails block out-of-range values, excessive single-step jumps, and non-HTTPS URLs', () => {
  const outOfRange = validateParameterUpdate('dailyStepsOptimalThreshold', 8000, 15000);
  assert.equal(outOfRange.ok, false);

  const tooBigStep = validateParameterUpdate('dailyStepsOptimalThreshold', 8000, 6000);
  assert.equal(tooBigStep.ok, false);

  const badUrl = validateParameterUpdate(
    'upfHighRiskOncoPoints',
    6,
    7,
    'javascript:alert(1)'
  );
  assert.equal(badUrl.ok, false);

  const tamperedAutoProposal: ParameterUpdateProposal = {
    ...BASELINE_PARAMETER_PROPOSALS[0],
    id: 'prop_tampered_core',
    parameterKey: 'score2RegionCalibrationFactor',
    governanceTier: 'guarded_auto', // Even if mislabeled, PARAMETER_GUARDRAILS enforces manual_review!
    proposedValue: 0.91,
  };
  const guardedRes = applyGuardedAutoUpdates(DEFAULT_CLINICAL_PARAMETERS, [tamperedAutoProposal]);
  assert.equal(guardedRes.appliedProposals.length, 0);
  assert.equal(guardedRes.nextParams.score2RegionCalibrationFactor, 0.88);
});

test('manual approval updates core protocol parameter and rollback restores exact baseline snapshot', () => {
  const coreProp = BASELINE_PARAMETER_PROPOSALS.find((p) => p.id === 'prop_score2_esc_review')!;
  const approved = applyApprovedProposal(
    DEFAULT_CLINICAL_PARAMETERS,
    coreProp,
    'emiliano.feletti@gmail.com'
  );

  assert.equal(approved.ok, true);
  assert.equal(approved.nextParams.score2RegionCalibrationFactor, 0.9);
  assert.equal(approved.updatedProposal.status, 'approved');
  assert.equal(approved.nextParams.updateMode, 'manual_review');
  assert.ok(approved.revision !== null);

  const rolled = rollbackToRevision(
    approved.nextParams,
    BASELINE_PARAMETER_REVISIONS[0],
    'emiliano.feletti@gmail.com'
  );
  assert.equal(rolled.nextParams.score2RegionCalibrationFactor, 0.88);
  assert.equal(rolled.nextParams.updateMode, 'rollback');
  assert.equal(rolled.revision.snapshot.score2RegionCalibrationFactor, 0.88);
});
