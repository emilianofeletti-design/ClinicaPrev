export type ClinicalParameterKey =
  | 'dailyStepsOptimalThreshold'
  | 'dailyStepsLowThreshold'
  | 'whoWeeklyMinutesTarget'
  | 'upfHighRiskOncoPoints'
  | 'redMeatWeeklyLimit'
  | 'fruitVegDailyTarget'
  | 'alcoholLowRiskWeeklyLimit'
  | 'euDefaultTotalCholMgDl'
  | 'euPopCvdMedianMultiplier'
  | 'euPopOncoMedianOffset'
  | 'score2RegionCalibrationFactor'
  | 'findriscHighRiskCutoff'
  | 'wcrfRelativeRiskSlope';

export type GovernanceTier = 'guarded_auto' | 'manual_review';
export type ParameterUpdateMode = 'baseline' | 'guarded_auto' | 'manual_review' | 'rollback';
export type ProposalStatus = 'pending' | 'approved' | 'auto_applied' | 'rejected';

export type ClinicalParameterNumericMap = Record<ClinicalParameterKey, number>;

export interface ClinicalParameterSet extends ClinicalParameterNumericMap {
  version: string;
  updatedAtIso: string;
  updatedBy: string;
  updateMode: ParameterUpdateMode;
  changeSummary: string;
}

export interface ParameterGuardrailRule {
  key: ClinicalParameterKey;
  label: string;
  domain: 'cardiovascular' | 'metabolic' | 'oncologic' | 'multi';
  unit: string;
  governanceTier: GovernanceTier;
  min: number;
  max: number;
  maxStepDelta: number;
  protocolNote: string;
}

export interface ParameterUpdateProposal {
  id: string;
  parameterKey: ClinicalParameterKey;
  parameterLabel: string;
  governanceTier: GovernanceTier;
  status: ProposalStatus;
  currentValue: number;
  proposedValue: number;
  unit: string;
  sourceAuthority: string;
  pmidOrReference: string;
  sourceUrl: string;
  rationale: string;
  createdAtIso: string;
  updatedAtIso: string;
  reviewedBy?: string;
}

export interface ParameterRevisionRecord {
  id: string;
  version: string;
  createdAtIso: string;
  actorEmail: string;
  updateMode: ParameterUpdateMode;
  changeSummary: string;
  snapshot: ClinicalParameterNumericMap;
}

export const PARAMETER_GUARDRAILS: Record<ClinicalParameterKey, ParameterGuardrailRule> = {
  dailyStepsOptimalThreshold: {
    key: 'dailyStepsOptimalThreshold',
    label: 'Soglia ottimale passi giornalieri',
    domain: 'multi',
    unit: 'passi/die',
    governanceTier: 'guarded_auto',
    min: 6000,
    max: 10000,
    maxStepDelta: 1200,
    protocolNote: 'Meta-analisi passi/mortalità (EJPC 2023 · Lancet Public Health 2022)',
  },
  dailyStepsLowThreshold: {
    key: 'dailyStepsLowThreshold',
    label: 'Soglia sedentarietà passi giornalieri',
    domain: 'multi',
    unit: 'passi/die',
    governanceTier: 'guarded_auto',
    min: 3000,
    max: 5500,
    maxStepDelta: 700,
    protocolNote: 'Cut-off rischio sedentarietà cardiovascolare (EJPC 2023)',
  },
  whoWeeklyMinutesTarget: {
    key: 'whoWeeklyMinutesTarget',
    label: 'Target settimanale attività fisica OMS',
    domain: 'multi',
    unit: 'min eq./sett',
    governanceTier: 'guarded_auto',
    min: 120,
    max: 210,
    maxStepDelta: 30,
    protocolNote: 'WHO Guidelines on Physical Activity and Sedentary Behaviour',
  },
  upfHighRiskOncoPoints: {
    key: 'upfHighRiskOncoPoints',
    label: 'Peso esposizione alimenti ultra-processati (UPF)',
    domain: 'oncologic',
    unit: 'pt indice onco',
    governanceTier: 'guarded_auto',
    min: 4,
    max: 9,
    maxStepDelta: 1.5,
    protocolNote: 'BMJ 2024 Umbrella Review UPF & Fondazione AIRC',
  },
  redMeatWeeklyLimit: {
    key: 'redMeatWeeklyLimit',
    label: 'Limite settimanale carni rosse/lavorate',
    domain: 'oncologic',
    unit: 'porzioni/sett',
    governanceTier: 'guarded_auto',
    min: 2,
    max: 4,
    maxStepDelta: 1,
    protocolNote: 'WCRF/AICR Third Expert Report & Fondazione AIRC',
  },
  fruitVegDailyTarget: {
    key: 'fruitVegDailyTarget',
    label: 'Target giornaliero frutta, verdura e legumi',
    domain: 'multi',
    unit: 'porzioni/die',
    governanceTier: 'guarded_auto',
    min: 4,
    max: 7,
    maxStepDelta: 1,
    protocolNote: 'OMS · WCRF/AICR · Dieta Mediterranea PREDIMED',
  },
  alcoholLowRiskWeeklyLimit: {
    key: 'alcoholLowRiskWeeklyLimit',
    label: 'Soglia segnalazione consumo alcolico',
    domain: 'oncologic',
    unit: 'unità/sett',
    governanceTier: 'guarded_auto',
    min: 3,
    max: 10,
    maxStepDelta: 2,
    protocolNote: 'WHO Europe Alcohol & Cancer Statement (Lancet Public Health 2023)',
  },
  euDefaultTotalCholMgDl: {
    key: 'euDefaultTotalCholMgDl',
    label: 'Mediana UE colesterolo totale (se non inserito)',
    domain: 'cardiovascular',
    unit: 'mg/dL',
    governanceTier: 'guarded_auto',
    min: 180,
    max: 220,
    maxStepDelta: 15,
    protocolNote: 'Coorte europea ESC SCORE2 per imputazione lipidica opzionale',
  },
  euPopCvdMedianMultiplier: {
    key: 'euPopCvdMedianMultiplier',
    label: 'Fattore calibrazione mediana UE Cardiovascolare',
    domain: 'cardiovascular',
    unit: '× mediana UE',
    governanceTier: 'guarded_auto',
    min: 0.85,
    max: 1.15,
    maxStepDelta: 0.08,
    protocolNote: 'Calibrazione benchmark popolazione europea nel grafico Recharts',
  },
  euPopOncoMedianOffset: {
    key: 'euPopOncoMedianOffset',
    label: 'Offset mediana coorte UE Oncologia (EPIC/AIRC)',
    domain: 'oncologic',
    unit: 'pt indice',
    governanceTier: 'guarded_auto',
    min: -5,
    max: 5,
    maxStepDelta: 3,
    protocolNote: 'Calibrazione range popolazione europea EPIC/WCRF/AIRC',
  },
  score2RegionCalibrationFactor: {
    key: 'score2RegionCalibrationFactor',
    label: 'Fattore calibrazione regionale ESC SCORE2 (Italia)',
    domain: 'cardiovascular',
    unit: 'coeff. SCORE2',
    governanceTier: 'manual_review',
    min: 0.75,
    max: 1.05,
    maxStepDelta: 0.08,
    protocolNote: 'Protocollo clinico primario ESC SCORE2 — richiede approvazione manuale',
  },
  findriscHighRiskCutoff: {
    key: 'findriscHighRiskCutoff',
    label: 'Soglia screening clinico FINDRISC (HbA1c)',
    domain: 'metabolic',
    unit: 'pt FINDRISC',
    governanceTier: 'manual_review',
    min: 10,
    max: 15,
    maxStepDelta: 2,
    protocolNote: 'Protocollo clinico primario IDF FINDRISC — richiede approvazione manuale',
  },
  wcrfRelativeRiskSlope: {
    key: 'wcrfRelativeRiskSlope',
    label: 'Coefficiente pendenza Rischio Relativo WCRF/IARC',
    domain: 'oncologic',
    unit: 'coeff. RR',
    governanceTier: 'manual_review',
    min: 1.8,
    max: 2.5,
    maxStepDelta: 0.2,
    protocolNote: 'Protocollo clinico primario WCRF/AICR — richiede approvazione manuale',
  },
};

export const CLINICAL_PARAMETER_KEYS = Object.keys(
  PARAMETER_GUARDRAILS
) as ClinicalParameterKey[];

export const DEFAULT_CLINICAL_PARAMETERS: ClinicalParameterSet = {
  version: 'v1.0',
  updatedAtIso: '2026-11-20T00:00:00.000Z',
  updatedBy: 'Protocolli Internazionali Validati (Baseline)',
  updateMode: 'baseline',
  changeSummary:
    'Configurazione iniziale validata su ESC SCORE2 (2021), IDF FINDRISC, WCRF/AICR (2018), Fondazione AIRC e EJPC (2023).',
  dailyStepsOptimalThreshold: 8000,
  dailyStepsLowThreshold: 4000,
  whoWeeklyMinutesTarget: 150,
  upfHighRiskOncoPoints: 6,
  redMeatWeeklyLimit: 3,
  fruitVegDailyTarget: 5,
  alcoholLowRiskWeeklyLimit: 7,
  euDefaultTotalCholMgDl: 200,
  euPopCvdMedianMultiplier: 1.0,
  euPopOncoMedianOffset: 0,
  score2RegionCalibrationFactor: 0.88,
  findriscHighRiskCutoff: 12,
  wcrfRelativeRiskSlope: 2.15,
};

export function extractNumericParameterMap(
  params: ClinicalParameterSet
): ClinicalParameterNumericMap {
  return {
    dailyStepsOptimalThreshold: params.dailyStepsOptimalThreshold,
    dailyStepsLowThreshold: params.dailyStepsLowThreshold,
    whoWeeklyMinutesTarget: params.whoWeeklyMinutesTarget,
    upfHighRiskOncoPoints: params.upfHighRiskOncoPoints,
    redMeatWeeklyLimit: params.redMeatWeeklyLimit,
    fruitVegDailyTarget: params.fruitVegDailyTarget,
    alcoholLowRiskWeeklyLimit: params.alcoholLowRiskWeeklyLimit,
    euDefaultTotalCholMgDl: params.euDefaultTotalCholMgDl,
    euPopCvdMedianMultiplier: params.euPopCvdMedianMultiplier,
    euPopOncoMedianOffset: params.euPopOncoMedianOffset,
    score2RegionCalibrationFactor: params.score2RegionCalibrationFactor,
    findriscHighRiskCutoff: params.findriscHighRiskCutoff,
    wcrfRelativeRiskSlope: params.wcrfRelativeRiskSlope,
  };
}

export const BASELINE_PARAMETER_REVISIONS: ParameterRevisionRecord[] = [
  {
    id: 'rev_v1_0',
    version: 'v1.0',
    createdAtIso: '2026-11-20T00:00:00.000Z',
    actorEmail: 'baseline@clinicaprev.org',
    updateMode: 'baseline',
    changeSummary: DEFAULT_CLINICAL_PARAMETERS.changeSummary,
    snapshot: extractNumericParameterMap(DEFAULT_CLINICAL_PARAMETERS),
  },
];

export const BASELINE_PARAMETER_PROPOSALS: ParameterUpdateProposal[] = [
  {
    id: 'prop_upf_bmj_2024',
    parameterKey: 'upfHighRiskOncoPoints',
    parameterLabel: PARAMETER_GUARDRAILS.upfHighRiskOncoPoints.label,
    governanceTier: 'guarded_auto',
    status: 'pending',
    currentValue: 6,
    proposedValue: 7,
    unit: 'pt indice onco',
    sourceAuthority: 'BMJ Umbrella Review & Fondazione AIRC',
    pmidOrReference: 'PMID 38418082',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/38418082/',
    rationale:
      'La umbrella review BMJ su 9,8 milioni di partecipanti conferma un incremento dose-dipendente di mortalità cardiometabolica e incidenza oncologica da consumo elevato di alimenti ultra-processati (+1 pt entro guardrail 4–9).',
    createdAtIso: '2026-11-20T00:00:00.000Z',
    updatedAtIso: '2026-11-20T00:00:00.000Z',
  },
  {
    id: 'prop_steps_ejpc_2023',
    parameterKey: 'dailyStepsOptimalThreshold',
    parameterLabel: PARAMETER_GUARDRAILS.dailyStepsOptimalThreshold.label,
    governanceTier: 'guarded_auto',
    status: 'pending',
    currentValue: 8000,
    proposedValue: 7500,
    unit: 'passi/die',
    sourceAuthority: 'European Journal of Preventive Cardiology (ESC)',
    pmidOrReference: 'PMID 37555441',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/37555441/',
    rationale:
      'Meta-analisi su 226.889 adulti evidenzia un plateau di forte beneficio cardiovascolare già intorno ai 7.500 passi/giorno (variazione −6,2%, entro il guardrail automatico 6.000–10.000).',
    createdAtIso: '2026-11-20T00:00:00.000Z',
    updatedAtIso: '2026-11-20T00:00:00.000Z',
  },
  {
    id: 'prop_score2_esc_review',
    parameterKey: 'score2RegionCalibrationFactor',
    parameterLabel: PARAMETER_GUARDRAILS.score2RegionCalibrationFactor.label,
    governanceTier: 'manual_review',
    status: 'pending',
    currentValue: 0.88,
    proposedValue: 0.90,
    unit: 'coeff. SCORE2',
    sourceAuthority: 'ESC Preventive Cardiology / ISS Cuore',
    pmidOrReference: 'PMID 34120177',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/34120177/',
    rationale:
      'Proposta di calibrazione conservativa (+0,02) sul fattore regionale ESC SCORE2 per la coorte italiana. Essendo un protocollo clinico primario, resta bloccata finché il curatore non la approva manualmente.',
    createdAtIso: '2026-11-20T00:00:00.000Z',
    updatedAtIso: '2026-11-20T00:00:00.000Z',
  },
];

export function bumpParameterVersion(currentVersion: string, mode: ParameterUpdateMode): string {
  const match = currentVersion.match(/^v(\d+)\.(\d+)(?:\.(\d+))?$/);
  if (!match) return 'v1.1';
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = match[3] ? Number(match[3]) : 0;
  if (mode === 'manual_review') {
    return `v${major}.${minor + 1}`;
  }
  return `v${major}.${minor}.${patch + 1}`;
}

export function validateParameterUpdate(
  key: ClinicalParameterKey,
  currentValue: number,
  proposedValue: number,
  sourceUrl?: string
): {
  ok: boolean;
  reason: string;
  governanceTier: GovernanceTier;
} {
  const rule = PARAMETER_GUARDRAILS[key];
  if (!rule) {
    return {
      ok: false,
      reason: `Parametro sconosciuto: ${String(key)}.`,
      governanceTier: 'manual_review',
    };
  }
  if (!Number.isFinite(proposedValue)) {
    return {
      ok: false,
      reason: 'Il valore proposto non è un numero valido.',
      governanceTier: rule.governanceTier,
    };
  }
  if (proposedValue < rule.min || proposedValue > rule.max) {
    return {
      ok: false,
      reason: `Valore ${proposedValue} fuori dal guardrail consentito (${rule.min}–${rule.max} ${rule.unit}).`,
      governanceTier: rule.governanceTier,
    };
  }
  const delta = Math.abs(proposedValue - currentValue);
  if (delta === 0) {
    return {
      ok: false,
      reason: 'Il valore proposto coincide con quello già attivo.',
      governanceTier: rule.governanceTier,
    };
  }
  if (delta > rule.maxStepDelta + 1e-9) {
    return {
      ok: false,
      reason: `Variazione (${delta.toFixed(2)}) superiore al limite massimo per singolo ciclo (±${rule.maxStepDelta} ${rule.unit}).`,
      governanceTier: rule.governanceTier,
    };
  }
  if (sourceUrl && !sourceUrl.startsWith('https://')) {
    return {
      ok: false,
      reason: 'La fonte scientifica deve utilizzare un URL HTTPS verificabile.',
      governanceTier: rule.governanceTier,
    };
  }

  return {
    ok: true,
    reason: 'Conforme ai guardrail clinici.',
    governanceTier: rule.governanceTier,
  };
}

/**
 * Applies ONLY eligible `guarded_auto` proposals that pass every numerical guardrail and source check.
 * Core clinical protocol proposals (`manual_review`) are strictly preserved in `pending` state.
 */
export function applyGuardedAutoUpdates(
  currentParams: ClinicalParameterSet,
  proposals: ParameterUpdateProposal[],
  actorEmail = 'auto-guardrail@clinicaprev.org'
): {
  nextParams: ClinicalParameterSet;
  updatedProposals: ParameterUpdateProposal[];
  appliedProposals: ParameterUpdateProposal[];
  rejectedReasons: Array<{ proposalId: string; reason: string }>;
  revision: ParameterRevisionRecord | null;
} {
  const nowIso = new Date().toISOString();
  const nextParams: ClinicalParameterSet = { ...currentParams };
  const appliedProposals: ParameterUpdateProposal[] = [];
  const rejectedReasons: Array<{ proposalId: string; reason: string }> = [];

  const updatedProposals = proposals.map((prop) => {
    if (prop.status !== 'pending') return prop;
    const rule = PARAMETER_GUARDRAILS[prop.parameterKey];
    // Core clinical protocol rules MUST NEVER be auto-applied
    if (!rule || rule.governanceTier !== 'guarded_auto' || prop.governanceTier !== 'guarded_auto') {
      return prop;
    }

    const activeVal = nextParams[prop.parameterKey];
    const check = validateParameterUpdate(
      prop.parameterKey,
      activeVal,
      prop.proposedValue,
      prop.sourceUrl
    );

    if (!check.ok) {
      rejectedReasons.push({ proposalId: prop.id, reason: check.reason });
      return prop;
    }

    nextParams[prop.parameterKey] = prop.proposedValue;
    const applied: ParameterUpdateProposal = {
      ...prop,
      currentValue: activeVal,
      status: 'auto_applied',
      updatedAtIso: nowIso,
      reviewedBy: actorEmail,
    };
    appliedProposals.push(applied);
    return applied;
  });

  if (appliedProposals.length === 0) {
    return {
      nextParams: currentParams,
      updatedProposals,
      appliedProposals: [],
      rejectedReasons,
      revision: null,
    };
  }

  const nextVersion = bumpParameterVersion(currentParams.version, 'guarded_auto');
  const changeSummary = `Auto-aggiornamento guardrail (${appliedProposals.length} ${
    appliedProposals.length === 1 ? 'parametro' : 'parametri'
  }): ${appliedProposals
    .map((p) => `${p.parameterLabel} ${p.currentValue}→${p.proposedValue} (${p.pmidOrReference})`)
    .join('; ')}.`.slice(0, 490);

  nextParams.version = nextVersion;
  nextParams.updatedAtIso = nowIso;
  nextParams.updatedBy = actorEmail;
  nextParams.updateMode = 'guarded_auto';
  nextParams.changeSummary = changeSummary;

  const revision: ParameterRevisionRecord = {
    id: `rev_${nextVersion.replace(/\./g, '_')}_${Date.now()}`,
    version: nextVersion,
    createdAtIso: nowIso,
    actorEmail,
    updateMode: 'guarded_auto',
    changeSummary,
    snapshot: extractNumericParameterMap(nextParams),
  };

  return {
    nextParams,
    updatedProposals,
    appliedProposals,
    rejectedReasons,
    revision,
  };
}

/**
 * Applies a single proposal after explicit human curator approval (validating guardrails first).
 */
export function applyApprovedProposal(
  currentParams: ClinicalParameterSet,
  proposal: ParameterUpdateProposal,
  reviewerEmail: string
): {
  ok: boolean;
  reason?: string;
  nextParams: ClinicalParameterSet;
  updatedProposal: ParameterUpdateProposal;
  revision: ParameterRevisionRecord | null;
} {
  const activeVal = currentParams[proposal.parameterKey];
  const check = validateParameterUpdate(
    proposal.parameterKey,
    activeVal,
    proposal.proposedValue,
    proposal.sourceUrl
  );
  if (!check.ok) {
    return {
      ok: false,
      reason: check.reason,
      nextParams: currentParams,
      updatedProposal: proposal,
      revision: null,
    };
  }

  const nowIso = new Date().toISOString();
  const nextVersion = bumpParameterVersion(currentParams.version, 'manual_review');
  const changeSummary = `Approvazione manuale: ${proposal.parameterLabel} (${activeVal}→${proposal.proposedValue} ${proposal.unit}, ${proposal.pmidOrReference}).`.slice(
    0,
    490
  );

  const nextParams: ClinicalParameterSet = {
    ...currentParams,
    [proposal.parameterKey]: proposal.proposedValue,
    version: nextVersion,
    updatedAtIso: nowIso,
    updatedBy: reviewerEmail,
    updateMode: 'manual_review',
    changeSummary,
  };

  const updatedProposal: ParameterUpdateProposal = {
    ...proposal,
    currentValue: activeVal,
    status: 'approved',
    updatedAtIso: nowIso,
    reviewedBy: reviewerEmail,
  };

  const revision: ParameterRevisionRecord = {
    id: `rev_${nextVersion.replace(/\./g, '_')}_${Date.now()}`,
    version: nextVersion,
    createdAtIso: nowIso,
    actorEmail: reviewerEmail,
    updateMode: 'manual_review',
    changeSummary,
    snapshot: extractNumericParameterMap(nextParams),
  };

  return {
    ok: true,
    nextParams,
    updatedProposal,
    revision,
  };
}

/**
 * Restores all numeric parameters from a historical revision snapshot, producing a new rollback version.
 */
export function rollbackToRevision(
  currentParams: ClinicalParameterSet,
  targetRevision: ParameterRevisionRecord,
  actorEmail: string
): {
  nextParams: ClinicalParameterSet;
  revision: ParameterRevisionRecord;
} {
  const nowIso = new Date().toISOString();
  const nextVersion = bumpParameterVersion(currentParams.version, 'rollback');
  const changeSummary = `Rollback alla configurazione ${targetRevision.version} (${targetRevision.changeSummary.slice(
    0,
    180
  )})`.slice(0, 490);

  const nextParams: ClinicalParameterSet = {
    ...currentParams,
    ...targetRevision.snapshot,
    version: nextVersion,
    updatedAtIso: nowIso,
    updatedBy: actorEmail,
    updateMode: 'rollback',
    changeSummary,
  };

  const revision: ParameterRevisionRecord = {
    id: `rev_${nextVersion.replace(/\./g, '_')}_${Date.now()}`,
    version: nextVersion,
    createdAtIso: nowIso,
    actorEmail,
    updateMode: 'rollback',
    changeSummary,
    snapshot: extractNumericParameterMap(nextParams),
  };

  return { nextParams, revision };
}
