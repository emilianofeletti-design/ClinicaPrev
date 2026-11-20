import type {
  ClinicalAssessmentResult,
  ClinicalProfileInput,
  SmokingStatus,
  UltraProcessedIntake,
} from '../types/clinical';
import {
  DEFAULT_CLINICAL_PARAMETERS,
  type ClinicalParameterSet,
} from './clinicalParameters';
import {
  calculateBmi,
  computeEffectiveActivityMetrics,
  evaluateClinicalRisk,
  normalizeOptionalLipid,
} from './clinicalRiskEngine';
import {
  computeLongitudinalDelta,
  type LongitudinalDeltaSummary,
  type PersonalAnalysisRecord,
} from './personalArchiveFile';

export type InterventionPriority = 'alta' | 'media' | 'mantenimento';
export type InterventionArea = 'stile_vita' | 'alimentazione' | 'parametri_clinici';
export type InterventionDomainTag = 'Cardiovascolare' | 'Diabete' | 'Oncologico';

export type FactorKey =
  | 'smoking'
  | 'blood_pressure'
  | 'adiposity'
  | 'activity'
  | 'alcohol'
  | 'nutrition'
  | 'lipids'
  | 'glucose'
  | 'sleep_uv';

export interface HistoricalFactorChange {
  factorKey: FactorKey;
  label: string;
  direction: 'improved' | 'worsened' | 'stable';
  previousValue: string;
  currentValue: string;
  detail: string;
}

export type TrajectoryVerdict =
  | 'improving'
  | 'partial_improvement'
  | 'stable'
  | 'worsening';

export interface HistoricalTrajectoryEvaluation {
  verdict: TrajectoryVerdict;
  verdictLabel: string;
  verdictSymbol: '●' | '▲' | '◆' | '✖';
  headline: string;
  narrativeSummary: string;
  elapsedLabel: string;
  totalRecordsAnalyzed: number;
  overallSpanSummary: string | null;
  improvedFactors: HistoricalFactorChange[];
  worsenedFactors: HistoricalFactorChange[];
  factorHistoryMap: Partial<Record<FactorKey, HistoricalFactorChange>>;
  nextFocusRecommendation: string;
  delta: LongitudinalDeltaSummary;
}

export interface PersonalizedIntervention {
  id: string;
  factorKey: FactorKey;
  priority: InterventionPriority;
  area: InterventionArea;
  domains: InterventionDomainTag[];
  whereToAct: string;
  currentState: string;
  targetGoal: string;
  whyItMatters: string;
  howToSteps: string[];
  doctorNote?: string;
  evidence: string;
  simulatable: boolean;
  simulatedDelta: {
    cvdDeltaPct: number;
    findriscDeltaPoints: number;
    oncologicDeltaIndex: number;
  };
  historicalContext?: {
    direction: 'improved' | 'worsened' | 'stable';
    label: string;
  };
  applyPatch: (profile: ClinicalProfileInput) => ClinicalProfileInput;
}

export interface PersonalizedInterventionPlan {
  interventions: PersonalizedIntervention[];
  protectiveStrengths: string[];
  defaultSelectedIds: string[];
  isAlreadyOptimal: boolean;
}

export interface CombinedSimulationOutcome {
  selectedCount: number;
  baseCvdPct: number;
  projectedCvdPct: number;
  cvdDeltaPct: number;
  baseFindrisc: number;
  projectedFindrisc: number;
  findriscDeltaPoints: number;
  baseOnco: number;
  projectedOnco: number;
  oncologicDeltaIndex: number;
}

const SMOKING_RANK: Record<SmokingStatus, number> = {
  never: 0,
  former: 1,
  current_light: 2,
  current_heavy: 3,
};

const SMOKING_LABELS: Record<SmokingStatus, string> = {
  never: 'Non fumatore',
  former: 'Ex-fumatore',
  current_light: 'Fumatore moderato',
  current_heavy: 'Fumatore intenso',
};

const UPF_RANK: Record<UltraProcessedIntake, number> = {
  rare: 0,
  moderate: 1,
  frequent: 2,
};

const UPF_LABELS: Record<UltraProcessedIntake, string> = {
  rare: 'Rari',
  moderate: 'Moderati',
  frequent: 'Frequenti',
};

function formatItalianDecimal(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',');
}

function formatElapsedInterval(daysElapsed: number): string {
  if (daysElapsed <= 0) return 'stessa data';
  if (daysElapsed < 14) {
    return `${daysElapsed} ${daysElapsed === 1 ? 'giorno' : 'giorni'}`;
  }
  if (daysElapsed < 60) {
    const weeks = Math.round(daysElapsed / 7);
    return `circa ${weeks} ${weeks === 1 ? 'settimana' : 'settimane'} (${daysElapsed} giorni)`;
  }
  const months = Math.round(daysElapsed / 30.4);
  if (months < 24) {
    return `circa ${months} ${months === 1 ? 'mese' : 'mesi'} (${daysElapsed} giorni)`;
  }
  const years = (daysElapsed / 365.25).toFixed(1).replace('.', ',');
  return `circa ${years} anni (${daysElapsed} giorni)`;
}

function formatShortItalianDate(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso.slice(0, 10);
  return dt.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function computeSinglePatchDelta(
  profile: ClinicalProfileInput,
  baseResult: ClinicalAssessmentResult,
  patch: (p: ClinicalProfileInput) => ClinicalProfileInput,
  params: ClinicalParameterSet
): {
  cvdDeltaPct: number;
  findriscDeltaPoints: number;
  oncologicDeltaIndex: number;
} {
  const simulated = evaluateClinicalRisk(patch({ ...profile }), params);
  return {
    cvdDeltaPct: Number(
      (simulated.cardiovascular.scoreNumeric - baseResult.cardiovascular.scoreNumeric).toFixed(1)
    ),
    findriscDeltaPoints:
      simulated.metabolic.scoreNumeric - baseResult.metabolic.scoreNumeric,
    oncologicDeltaIndex:
      simulated.oncologic.scoreNumeric - baseResult.oncologic.scoreNumeric,
  };
}

/**
 * Evaluates the clinical trajectory between a selected historical record (and overall timeline)
 * and the current live assessment, surfacing concrete factor changes and next-step guidance.
 */
export function evaluateHistoricalTrajectory(
  sortedTimeline: PersonalAnalysisRecord[],
  currentRecord: PersonalAnalysisRecord,
  baselineRecord: PersonalAnalysisRecord,
  params: ClinicalParameterSet = DEFAULT_CLINICAL_PARAMETERS
): HistoricalTrajectoryEvaluation {
  const delta = computeLongitudinalDelta(baselineRecord, currentRecord);
  const prevP = baselineRecord.profile;
  const currP = currentRecord.profile;

  const improvedFactors: HistoricalFactorChange[] = [];
  const worsenedFactors: HistoricalFactorChange[] = [];
  const factorHistoryMap: Partial<Record<FactorKey, HistoricalFactorChange>> = {};

  const registerChange = (change: HistoricalFactorChange) => {
    factorHistoryMap[change.factorKey] = change;
    if (change.direction === 'improved') improvedFactors.push(change);
    else if (change.direction === 'worsened') worsenedFactors.push(change);
  };

  // 1. Tobacco smoking status
  const prevSmokeRank = SMOKING_RANK[prevP.smokingStatus];
  const currSmokeRank = SMOKING_RANK[currP.smokingStatus];
  if (currSmokeRank < prevSmokeRank) {
    registerChange({
      factorKey: 'smoking',
      label: 'Abitudine al fumo',
      direction: 'improved',
      previousValue: SMOKING_LABELS[prevP.smokingStatus],
      currentValue: SMOKING_LABELS[currP.smokingStatus],
      detail:
        currP.smokingStatus === 'former'
          ? 'Ottimo traguardo: passaggio a ex-fumatore, con beneficio diretto sul rischio CV e oncologico.'
          : 'Riduzione dell’intensità del fumo rispetto allo storico; obiettivo finale resta la cessazione completa.',
    });
  } else if (currSmokeRank > prevSmokeRank) {
    registerChange({
      factorKey: 'smoking',
      label: 'Abitudine al fumo',
      direction: 'worsened',
      previousValue: SMOKING_LABELS[prevP.smokingStatus],
      currentValue: SMOKING_LABELS[currP.smokingStatus],
      detail: 'Ripresa o aumento del consumo di tabacco: è la leva con maggiore impatto negativo sui punteggi.',
    });
  }

  // 2. Weight & Waist circumference
  const weightDiff = Number((currP.weightKg - prevP.weightKg).toFixed(1));
  const waistDiff = Math.round(currP.waistCm - prevP.waistCm);
  if (weightDiff <= -1.5 || waistDiff <= -2) {
    const parts: string[] = [];
    if (weightDiff <= -1) parts.push(`peso ${formatItalianDecimal(weightDiff)} kg`);
    if (waistDiff <= -1) parts.push(`vita ${waistDiff} cm`);
    registerChange({
      factorKey: 'adiposity',
      label: 'Peso e circonferenza vita',
      direction: 'improved',
      previousValue: `${prevP.weightKg} kg · vita ${prevP.waistCm} cm`,
      currentValue: `${currP.weightKg} kg · vita ${currP.waistCm} cm`,
      detail: `Riduzione misurabile (${parts.join(', ')}) con effetto favorevole su metabolismo e pressione.`,
    });
  } else if (weightDiff >= 1.5 || waistDiff >= 2) {
    const parts: string[] = [];
    if (weightDiff >= 1) parts.push(`peso +${formatItalianDecimal(weightDiff)} kg`);
    if (waistDiff >= 1) parts.push(`vita +${waistDiff} cm`);
    registerChange({
      factorKey: 'adiposity',
      label: 'Peso e circonferenza vita',
      direction: 'worsened',
      previousValue: `${prevP.weightKg} kg · vita ${prevP.waistCm} cm`,
      currentValue: `${currP.weightKg} kg · vita ${currP.waistCm} cm`,
      detail: `Incremento ponderale o viscerale (${parts.join(', ')}) che spinge al rialzo FINDRISC e rischio CV.`,
    });
  }

  // 3. Systolic blood pressure
  const bpDiff = Math.round(currP.systolicBp - prevP.systolicBp);
  if (bpDiff <= -5 && prevP.systolicBp >= 125) {
    registerChange({
      factorKey: 'blood_pressure',
      label: 'Pressione arteriosa sistolica',
      direction: 'improved',
      previousValue: `${prevP.systolicBp} mmHg`,
      currentValue: `${currP.systolicBp} mmHg`,
      detail: `Calo pressorio di ${Math.abs(bpDiff)} mmHg rispetto alla rilevazione precedente.`,
    });
  } else if (bpDiff >= 5 && currP.systolicBp >= 130) {
    registerChange({
      factorKey: 'blood_pressure',
      label: 'Pressione arteriosa sistolica',
      direction: 'worsened',
      previousValue: `${prevP.systolicBp} mmHg`,
      currentValue: `${currP.systolicBp} mmHg`,
      detail: `Rialzo pressorio di +${bpDiff} mmHg: opportuno monitoraggio domiciliare e verifica con il medico.`,
    });
  }

  // 4. Physical activity & daily steps
  const prevAct = computeEffectiveActivityMetrics(prevP, params);
  const currAct = computeEffectiveActivityMetrics(currP, params);
  const actDiff = currAct.whoEquivalentMinutes - prevAct.whoEquivalentMinutes;
  const stepsDiff =
    prevAct.dailySteps !== null && currAct.dailySteps !== null
      ? currAct.dailySteps - prevAct.dailySteps
      : 0;
  if (actDiff >= 30 || stepsDiff >= 1200) {
    registerChange({
      factorKey: 'activity',
      label: 'Attività fisica e movimento',
      direction: 'improved',
      previousValue: `${prevAct.whoEquivalentMinutes} eq. OMS/sett${
        prevAct.dailySteps ? ` · ${prevAct.dailySteps.toLocaleString('it-IT')} passi` : ''
      }`,
      currentValue: `${currAct.whoEquivalentMinutes} eq. OMS/sett${
        currAct.dailySteps ? ` · ${currAct.dailySteps.toLocaleString('it-IT')} passi` : ''
      }`,
      detail: 'Aumento consistente del volume di movimento settimanale, leva trasversale su tutti e tre i rischi.',
    });
  } else if (actDiff <= -30 || stepsDiff <= -1200) {
    registerChange({
      factorKey: 'activity',
      label: 'Attività fisica e movimento',
      direction: 'worsened',
      previousValue: `${prevAct.whoEquivalentMinutes} eq. OMS/sett${
        prevAct.dailySteps ? ` · ${prevAct.dailySteps.toLocaleString('it-IT')} passi` : ''
      }`,
      currentValue: `${currAct.whoEquivalentMinutes} eq. OMS/sett${
        currAct.dailySteps ? ` · ${currAct.dailySteps.toLocaleString('it-IT')} passi` : ''
      }`,
      detail: 'Riduzione del volume di attività fisica o dei passi quotidiani rispetto allo storico.',
    });
  }

  // 5. Alcohol intake
  const alcDiff = Number((currP.alcoholUnitsPerWeek - prevP.alcoholUnitsPerWeek).toFixed(1));
  if (alcDiff <= -2) {
    registerChange({
      factorKey: 'alcohol',
      label: 'Consumo alcolico',
      direction: 'improved',
      previousValue: `${formatItalianDecimal(prevP.alcoholUnitsPerWeek)} UA/sett`,
      currentValue: `${formatItalianDecimal(currP.alcoholUnitsPerWeek)} UA/sett`,
      detail: `Riduzione di ${formatItalianDecimal(Math.abs(alcDiff))} unità alcoliche/settimana, benefica per fegato e prevenzione oncologica.`,
    });
  } else if (alcDiff >= 2) {
    registerChange({
      factorKey: 'alcohol',
      label: 'Consumo alcolico',
      direction: 'worsened',
      previousValue: `${formatItalianDecimal(prevP.alcoholUnitsPerWeek)} UA/sett`,
      currentValue: `${formatItalianDecimal(currP.alcoholUnitsPerWeek)} UA/sett`,
      detail: `Aumento di +${formatItalianDecimal(alcDiff)} unità alcoliche/settimana rispetto allo storico.`,
    });
  }

  // 6. Diet quality (Fruit/veg, Red/processed meat, UPF)
  const fvDiff = currP.fruitVegServingsPerDay - prevP.fruitVegServingsPerDay;
  const meatDiff =
    currP.redProcessedMeatServingsPerWeek - prevP.redProcessedMeatServingsPerWeek;
  const upfDiff = UPF_RANK[currP.ultraProcessedIntake] - UPF_RANK[prevP.ultraProcessedIntake];
  const dietScoreShift = fvDiff - meatDiff * 0.5 - upfDiff * 1.5;
  if (dietScoreShift >= 1.5) {
    registerChange({
      factorKey: 'nutrition',
      label: 'Qualità dell’alimentazione',
      direction: 'improved',
      previousValue: `${prevP.fruitVegServingsPerDay} veg/die · ${prevP.redProcessedMeatServingsPerWeek} carni/sett · UPF ${UPF_LABELS[prevP.ultraProcessedIntake].toLowerCase()}`,
      currentValue: `${currP.fruitVegServingsPerDay} veg/die · ${currP.redProcessedMeatServingsPerWeek} carni/sett · UPF ${UPF_LABELS[currP.ultraProcessedIntake].toLowerCase()}`,
      detail: 'Migliore aderenza al modello Mediterraneo / WCRF (più vegetali o meno carni lavorate e ultra-processati).',
    });
  } else if (dietScoreShift <= -1.5) {
    registerChange({
      factorKey: 'nutrition',
      label: 'Qualità dell’alimentazione',
      direction: 'worsened',
      previousValue: `${prevP.fruitVegServingsPerDay} veg/die · ${prevP.redProcessedMeatServingsPerWeek} carni/sett · UPF ${UPF_LABELS[prevP.ultraProcessedIntake].toLowerCase()}`,
      currentValue: `${currP.fruitVegServingsPerDay} veg/die · ${currP.redProcessedMeatServingsPerWeek} carni/sett · UPF ${UPF_LABELS[currP.ultraProcessedIntake].toLowerCase()}`,
      detail: 'Calo dell’aderenza nutrizionale (meno frutta/verdura o aumento di carni rosse/ultra-processati).',
    });
  }

  // 7. Non-HDL Cholesterol (if present in both)
  const prevTot = normalizeOptionalLipid(prevP.totalCholesterolMgDl);
  const prevHdl = normalizeOptionalLipid(prevP.hdlCholesterolMgDl);
  const currTot = normalizeOptionalLipid(currP.totalCholesterolMgDl);
  const currHdl = normalizeOptionalLipid(currP.hdlCholesterolMgDl);
  if (prevTot !== null && prevHdl !== null && currTot !== null && currHdl !== null) {
    const prevNonHdl = Math.round(prevTot - prevHdl);
    const currNonHdl = Math.round(currTot - currHdl);
    const nonHdlDiff = currNonHdl - prevNonHdl;
    if (nonHdlDiff <= -15) {
      registerChange({
        factorKey: 'lipids',
        label: 'Colesterolo Non-HDL',
        direction: 'improved',
        previousValue: `${prevNonHdl} mg/dL`,
        currentValue: `${currNonHdl} mg/dL`,
        detail: `Riduzione del colesterolo aterogeno di ${Math.abs(nonHdlDiff)} mg/dL.`,
      });
    } else if (nonHdlDiff >= 15) {
      registerChange({
        factorKey: 'lipids',
        label: 'Colesterolo Non-HDL',
        direction: 'worsened',
        previousValue: `${prevNonHdl} mg/dL`,
        currentValue: `${currNonHdl} mg/dL`,
        detail: `Aumento del colesterolo Non-HDL (+${nonHdlDiff} mg/dL): da rivalutare su dieta e con il medico.`,
      });
    }
  }

  // Classify overall trajectory across the 3 primary clinical risk scores
  const improvedDomains =
    (delta.cvdDeltaPct <= -0.4 ? 1 : 0) +
    (delta.findriscDeltaPoints <= -1 ? 1 : 0) +
    (delta.oncologicDeltaIndex <= -3 ? 1 : 0);
  const worsenedDomains =
    (delta.cvdDeltaPct >= 0.4 ? 1 : 0) +
    (delta.findriscDeltaPoints >= 1 ? 1 : 0) +
    (delta.oncologicDeltaIndex >= 3 ? 1 : 0);

  let verdict: TrajectoryVerdict;
  let verdictLabel: string;
  let verdictSymbol: '●' | '▲' | '◆' | '✖';
  let headline: string;
  let narrativeSummary: string;
  let nextFocusRecommendation: string;

  const baseDateLabel = formatShortItalianDate(baselineRecord.recordedAtIso);

  if (improvedDomains >= 2 && worsenedDomains === 0) {
    verdict = 'improving';
    verdictLabel = 'In netto miglioramento';
    verdictSymbol = '●';
    headline = `Profilo di rischio sensibilmente ridotto rispetto al ${baseDateLabel}`;
    narrativeSummary =
      improvedFactors.length > 0
        ? `Gli interventi adottati stanno producendo un beneficio misurabile su ${improvedDomains} aree di rischio su 3, trainati in particolare da ${improvedFactors
            .slice(0, 3)
            .map((f) => f.label.toLowerCase())
            .join(', ')}.`
        : `I tuoi indicatori di rischio risultano in calo su ${improvedDomains} aree su 3 rispetto alla rilevazione di riferimento.`;
    nextFocusRecommendation =
      worsenedFactors.length > 0
        ? `Consolida i progressi raggiunti e riequilibra subito ${worsenedFactors[0].label.toLowerCase()} nel piano qui sotto.`
        : 'Mantieni la continuità sulle nuove abitudini e verifica nel piano d’azione qui sotto eventuali margini residui.';
  } else if (worsenedDomains >= 2 || (worsenedDomains >= 1 && improvedDomains === 0)) {
    verdict = 'worsening';
    verdictLabel = 'Trend in peggioramento';
    verdictSymbol = '✖';
    headline = `Aumento del profilo di rischio rispetto al ${baseDateLabel}`;
    narrativeSummary =
      worsenedFactors.length > 0
        ? `Rispetto allo storico si osserva un peggioramento su ${worsenedDomains} ${
            worsenedDomains === 1 ? 'indicatore principale' : 'indicatori principali'
          }, associato soprattutto a ${worsenedFactors
            .slice(0, 3)
            .map((f) => f.label.toLowerCase())
            .join(', ')}.`
        : `Uno o più indicatori di rischio sono aumentati rispetto al ${baseDateLabel} (anche per effetto dell’avanzamento dell’età anagrafica).`;
    nextFocusRecommendation =
      worsenedFactors.length > 0
        ? `Priorità immediata: inverti la tendenza su ${worsenedFactors
            .slice(0, 2)
            .map((f) => f.label.toLowerCase())
            .join(' e ')} seguendo gli step del Piano d’Azione qui sotto.`
        : 'Utilizza il Piano d’Azione qui sotto per compensare l’aumento del rischio agendo sulle leve modificabili a maggior impatto.';
  } else if (improvedDomains >= 1 && worsenedDomains >= 1) {
    verdict = 'partial_improvement';
    verdictLabel = 'Andamento misto (progressi parziali)';
    verdictSymbol = '▲';
    headline = `Miglioramenti presenti, ma con segnali da correggere rispetto al ${baseDateLabel}`;
    narrativeSummary = `Alcuni indicatori sono migliorati mentre almeno un’area mostra un incremento del rischio. ${
      improvedFactors.length > 0
        ? `Bene ${improvedFactors[0].label.toLowerCase()}`
        : 'Alcuni parametri sono in miglioramento'
    }${
      worsenedFactors.length > 0
        ? `, mentre richiede attenzione ${worsenedFactors[0].label.toLowerCase()}.`
        : '.'
    }`;
    nextFocusRecommendation =
      worsenedFactors.length > 0
        ? `Difendi i risultati già ottenuti e concentra il prossimo trimestre su ${worsenedFactors[0].label.toLowerCase()}.`
        : 'Consulta il Piano d’Azione sottostante per allineare al ribasso tutti e tre gli indicatori clinici.';
  } else if (improvedDomains === 1 && worsenedDomains === 0) {
    verdict = 'partial_improvement';
    verdictLabel = 'In miglioramento graduale';
    verdictSymbol = '●';
    headline = `Primo segnale positivo rispetto al ${baseDateLabel}`;
    narrativeSummary =
      improvedFactors.length > 0
        ? `Uno degli indicatori principali è già sceso senza peggioramenti sugli altri, grazie ai progressi su ${improvedFactors
            .slice(0, 2)
            .map((f) => f.label.toLowerCase())
            .join(' e ')}.`
        : `Uno degli indicatori principali mostra una riduzione del rischio, con gli altri domini stabili.`;
    nextFocusRecommendation =
      'Ottima direzione: seleziona 1 o 2 azioni aggiuntive nel Piano d’Azione per estendere il miglioramento anche agli altri domini.';
  } else {
    verdict = 'stable';
    verdictLabel = 'Andamento stabile';
    verdictSymbol = '◆';
    headline = `Profilo sostanzialmente invariato rispetto al ${baseDateLabel}`;
    narrativeSummary =
      'I tre punteggi principali (cardiovascolare, metabolico e oncologico) non mostrano variazioni clinicamente rilevanti nell’intervallo analizzato.';
    nextFocusRecommendation =
      currentRecord.summary.cvdPct >= 5 ||
      currentRecord.summary.findriscPoints >= 12 ||
      currentRecord.summary.oncologicIndex >= 35
        ? 'Poiché restano margini significativi di miglioramento, scegli dal Piano d’Azione sottostante le 2 leve più semplici da attivare nei prossimi 30 giorni.'
        : 'Stabilità favorevole: mantieni i fattori protettivi attuali e aggiorna lo storico al prossimo controllo annuale.';
  }

  // Optional multi-checkpoint full-span note when the file holds >=2 historical records
  let overallSpanSummary: string | null = null;
  if (sortedTimeline.length >= 2) {
    const firstRec = sortedTimeline[0];
    if (firstRec.id !== baselineRecord.id) {
      const spanDelta = computeLongitudinalDelta(firstRec, currentRecord);
      const firstDate = formatShortItalianDate(firstRec.recordedAtIso);
      overallSpanSummary = `Dal primo record in archivio (${firstDate}, ${sortedTimeline.length} rilevazioni totali): CV ${
        spanDelta.cvdDeltaPct > 0 ? `+${spanDelta.cvdDeltaPct}` : spanDelta.cvdDeltaPct
      }%, FINDRISC ${
        spanDelta.findriscDeltaPoints > 0
          ? `+${spanDelta.findriscDeltaPoints}`
          : spanDelta.findriscDeltaPoints
      } pt, Oncologico ${
        spanDelta.oncologicDeltaIndex > 0
          ? `+${spanDelta.oncologicDeltaIndex}`
          : spanDelta.oncologicDeltaIndex
      } pt.`;
    }
  }

  return {
    verdict,
    verdictLabel,
    verdictSymbol,
    headline,
    narrativeSummary,
    elapsedLabel: formatElapsedInterval(delta.daysElapsed),
    totalRecordsAnalyzed: sortedTimeline.length,
    overallSpanSummary,
    improvedFactors,
    worsenedFactors,
    factorHistoryMap,
    nextFocusRecommendation,
    delta,
  };
}

/**
 * Generates concrete, prioritized "Where & How to Intervene" actions directly from the user's
 * entered data, paired with exact risk-engine simulations and optional historical trajectory context.
 */
export function buildPersonalizedInterventionPlan(
  profile: ClinicalProfileInput,
  baseResult: ClinicalAssessmentResult,
  params: ClinicalParameterSet = DEFAULT_CLINICAL_PARAMETERS,
  historicalEval?: HistoricalTrajectoryEvaluation | null
): PersonalizedInterventionPlan {
  const interventions: PersonalizedIntervention[] = [];
  const protectiveStrengths: string[] = [];

  const attachHistory = (
    key: FactorKey
  ): PersonalizedIntervention['historicalContext'] | undefined => {
    const change = historicalEval?.factorHistoryMap[key];
    if (!change) return undefined;
    const baseDate = historicalEval
      ? formatShortItalianDate(historicalEval.delta.previousRecord.recordedAtIso)
      : '';
    if (change.direction === 'worsened') {
      return {
        direction: 'worsened',
        label: `In peggioramento rispetto al ${baseDate} (${change.previousValue} → ${change.currentValue})`,
      };
    }
    if (change.direction === 'improved') {
      return {
        direction: 'improved',
        label: `Già migliorato rispetto al ${baseDate} (${change.previousValue} → ${change.currentValue})`,
      };
    }
    return undefined;
  };

  const bmi = baseResult.bmi;
  const waistThreshold = profile.sex === 'male' ? 94 : 80;
  const waistHigh = profile.sex === 'male' ? 102 : 88;
  const activity = computeEffectiveActivityMetrics(profile, params);

  // 1. TOBACCO
  if (profile.smokingStatus === 'current_light' || profile.smokingStatus === 'current_heavy') {
    const patch = (p: ClinicalProfileInput): ClinicalProfileInput => ({
      ...p,
      smokingStatus: 'former',
    });
    const simDelta = computeSinglePatchDelta(profile, baseResult, patch, params);
    interventions.push({
      id: 'act_smoking',
      factorKey: 'smoking',
      priority: 'alta',
      area: 'stile_vita',
      domains: ['Cardiovascolare', 'Oncologico'],
      whereToAct: 'Cessazione completa del fumo di tabacco',
      currentState: `${SMOKING_LABELS[profile.smokingStatus]} (${formatItalianDecimal(
        profile.packYears
      )} pacchetti-anno)`,
      targetGoal: '0 sigarette/giorno (passaggio a ex-fumatore)',
      whyItMatters:
        'È il singolo fattore modificabile con il maggiore impatto simultaneo: smettere abbatte il rischio cardiovascolare già entro 12 mesi e riduce progressivamente l’esposizione cancerogena IARC Gruppo 1.',
      howToSteps: [
        'Fissa una data di stop entro 14 giorni e rimuovi sigarette, posaceneri e trigger abituali (es. caffè o pause automatiche).',
        'Contatta un Centro Antifumo SSN o il Telefono Verde ISS (800 554088): il supporto guidato triplica le probabilità di successo.',
        'Valuta con il medico curante una terapia di supporto di prima linea (citisina, vareniclina o sostituti nicotinici combinati).',
      ],
      doctorNote:
        profile.age >= 50 && profile.packYears >= 20
          ? 'Con ≥20 pacchetti-anno e ≥50 anni, discuti con il medico anche l’eventuale programma di screening polmonare LDCT.'
          : 'Chiedi al MMG un piano combinato di supporto comportamentale e farmacologico per prevenire ricadute.',
      evidence: 'ESC Prevention 2021 · IARC Monograph 100E · ISS',
      simulatable: true,
      simulatedDelta: simDelta,
      historicalContext: attachHistory('smoking'),
      applyPatch: patch,
    });
  } else if (profile.smokingStatus === 'never') {
    protectiveStrengths.push('Astensione completa dal tabacco (protezione massima CV e oncologica)');
  } else {
    protectiveStrengths.push(
      `Ex-fumatore (${formatItalianDecimal(profile.packYears)} pacchetti-anno): mantenere l’astensione continua a ridurre il rischio ogni anno`
    );
  }

  // 2. SYSTOLIC BLOOD PRESSURE
  if (profile.systolicBp >= 130) {
    const targetBp = profile.systolicBp >= 140 ? 128 : 120;
    const gapMmHg = Math.round(profile.systolicBp - targetBp);
    const patch = (p: ClinicalProfileInput): ClinicalProfileInput => ({
      ...p,
      systolicBp: Math.min(p.systolicBp, targetBp),
    });
    const simDelta = computeSinglePatchDelta(profile, baseResult, patch, params);
    const isHigh = profile.systolicBp >= 140;

    interventions.push({
      id: 'act_bp',
      factorKey: 'blood_pressure',
      priority: isHigh ? 'alta' : 'media',
      area: 'parametri_clinici',
      domains: ['Cardiovascolare'],
      whereToAct: isHigh
        ? 'Riduzione della pressione arteriosa sistolica elevata'
        : 'Ottimizzazione pressione arteriosa normale-alta',
      currentState: `${profile.systolicBp} mmHg${profile.onHypertensionMeds ? ' (in terapia)' : ''}`,
      targetGoal: `< 129 mmHg (riduzione stimata −${gapMmHg} mmHg)`,
      whyItMatters:
        'Ogni riduzione sostenuta di 10 mmHg della pressione sistolica diminuisce di circa il 20% il rischio di eventi cardiovascolari maggiori e ictus (Linee Guida ESC 2024).',
      howToSteps: [
        'Riduci il sale da cucina sotto 5 g/giorno (elimina salumi, dadi, snack salati e piatti pronti; usa spezie, limone e olio EVO).',
        'Aumenta l’apporto alimentare di potassio (verdure a foglia verde, legumi, frutta fresca) se non hai controindicazioni renali.',
        'Tieni un diario pressorio domiciliare per 7 giorni (2 misurazioni al mattino e 2 alla sera, seduto a riposo da 5 minuti).',
      ],
      doctorNote: isHigh
        ? profile.onHypertensionMeds
          ? 'Valori ≥140 mmHg nonostante la terapia: porta il diario pressorio al MMG o cardiologo per rivalutare dosaggio o combinazione.'
          : 'Valori ≥140 mmHg: condividi il diario pressorio domiciliare con il MMG per confermare la diagnosi e valutare l’eventuale trattamento.'
        : 'Monitora la pressione 1–2 volte al mese e ricontrollala dopo 8–12 settimane di interventi su sale, peso e movimento.',
      evidence: 'ESC Hypertension Guidelines 2024 · DASH Trial',
      simulatable: true,
      simulatedDelta: simDelta,
      historicalContext: attachHistory('blood_pressure'),
      applyPatch: patch,
    });
  } else {
    protectiveStrengths.push(`Pressione sistolica ottimale (${profile.systolicBp} mmHg)`);
  }

  // 3. WEIGHT & WAIST CIRCUMFERENCE
  if (bmi >= 25 || profile.waistCm >= waistThreshold) {
    const isHigh = bmi >= 30 || profile.waistCm > waistHigh;
    const weightForBmi245 = Math.round(24.5 * Math.pow(profile.heightCm / 100, 2));
    const eightPctTargetWeight = Math.round(profile.weightKg * 0.92);
    const targetWeight =
      bmi >= 25
        ? Math.max(weightForBmi245, Math.min(profile.weightKg - 3, eightPctTargetWeight))
        : profile.weightKg;
    const kgToLose = Math.max(0, Number((profile.weightKg - targetWeight).toFixed(1)));
    const targetWaist = Math.min(
      profile.waistCm,
      Math.max(waistThreshold - 2, profile.waistCm - (isHigh ? 8 : 5))
    );
    const cmToLose = Math.max(0, Math.round(profile.waistCm - targetWaist));

    const patch = (p: ClinicalProfileInput): ClinicalProfileInput => ({
      ...p,
      weightKg: Math.min(p.weightKg, targetWeight),
      waistCm: Math.min(p.waistCm, targetWaist),
    });
    const simDelta = computeSinglePatchDelta(profile, baseResult, patch, params);

    const targetParts: string[] = [];
    if (kgToLose >= 1) {
      const targetBmi = calculateBmi(profile.heightCm, targetWeight);
      targetParts.push(
        `−${formatItalianDecimal(kgToLose)} kg (verso ${targetWeight} kg · BMI ${formatItalianDecimal(targetBmi)})`
      );
    }
    if (cmToLose >= 1) {
      targetParts.push(`vita −${cmToLose} cm (verso ${targetWaist} cm, soglia <${waistThreshold} cm)`);
    }

    interventions.push({
      id: 'act_adiposity',
      factorKey: 'adiposity',
      priority: isHigh ? 'alta' : 'media',
      area: 'alimentazione',
      domains: ['Cardiovascolare', 'Diabete', 'Oncologico'],
      whereToAct: isHigh
        ? 'Riduzione del peso corporeo e dell’adiposità addominale'
        : 'Riduzione del sovrappeso / girovita sopra soglia',
      currentState: `BMI ${formatItalianDecimal(bmi)} kg/m² (${profile.weightKg} kg) · Vita ${profile.waistCm} cm`,
      targetGoal: targetParts.join(' · ') || `BMI <25 · Vita <${waistThreshold} cm`,
      whyItMatters:
        'Il grasso viscerale addominale alimenta insulino-resistenza, infiammazione cronica e pressione alta. Anche una perdita graduale del 5–8% del peso riduce drasticamente il rischio di diabete tipo 2 e tumori correlati.',
      howToSteps: [
        'Imposta un deficit calorico moderato e sostenibile (300–450 kcal/giorno, circa 0,4–0,5 kg a settimana) evitando diete drastiche.',
        'Costruisci ogni pasto principale con metà piatto di verdure, un quarto di proteine magre/legumi e un quarto di cereali integrali.',
        'Abbina una camminata di 15–20 minuti dopo il pasto principale e monitora peso e circonferenza vita una volta a settimana.',
      ],
      doctorNote: isHigh
        ? 'Valuta un percorso strutturato con un medico dietologo o biologo nutrizionista per un piano sostenibile nel medio termine.'
        : undefined,
      evidence: 'DPP / Look AHEAD · WCRF/AICR 2018 · IDF',
      simulatable: true,
      simulatedDelta: simDelta,
      historicalContext: attachHistory('adiposity'),
      applyPatch: patch,
    });
  } else {
    protectiveStrengths.push(
      `Peso e circonferenza vita nei target ottimali (BMI ${formatItalianDecimal(bmi)} · vita ${profile.waistCm} cm)`
    );
  }

  // 4. PHYSICAL ACTIVITY, MODALITY, STEPS & SEDENTARY TIME
  const lowSteps =
    activity.dailySteps !== null && activity.dailySteps < params.dailyStepsOptimalThreshold;
  const highSedentary = profile.sedentaryHoursPerDay >= 9;
  if (!activity.meetsWhoTarget || !activity.hasCombinedModality || lowSteps || highSedentary) {
    const isHigh = !activity.meetsWhoTarget && activity.whoEquivalentMinutes < 75;
    const targetWorkouts = Math.max(profile.workoutsPerWeek, 3);
    const targetMinutes = Math.max(profile.minutesPerWorkout, 45);
    const targetSteps = Math.max(activity.dailySteps ?? 0, params.dailyStepsOptimalThreshold);

    const patch = (p: ClinicalProfileInput): ClinicalProfileInput => ({
      ...p,
      workoutsPerWeek: Math.max(p.workoutsPerWeek, 4),
      minutesPerWorkout: Math.max(p.minutesPerWorkout, 45),
      activityType: 'combined',
      dailySteps: Math.max(p.dailySteps ?? 0, Math.max(8000, params.dailyStepsOptimalThreshold)),
      sedentaryHoursPerDay: Math.min(p.sedentaryHoursPerDay, 7),
    });
    const simDelta = computeSinglePatchDelta(profile, baseResult, patch, params);

    const stepsList: string[] = [];
    if (!activity.meetsWhoTarget) {
      stepsList.push(
        `Passa gradualmente da ${profile.workoutsPerWeek}×${profile.minutesPerWorkout} min a ${targetWorkouts}–4 sessioni da ${targetMinutes} min/settimana (almeno ${params.whoWeeklyMinutesTarget} min eq. OMS).`
      );
    } else if (!activity.hasCombinedModality) {
      stepsList.push(
        'Integra 2 sessioni settimanali di rinforzo muscolare (pesi, elastici o corpo libero) accanto all’attività aerobica: la combinazione offre la massima protezione.'
      );
    }
    if (activity.dailySteps !== null && activity.dailySteps < params.dailyStepsOptimalThreshold) {
      const stepsDelta = targetSteps - activity.dailySteps;
      stepsList.push(
        `Aumenta i passi giornalieri di +1.000 ogni 2 settimane (da ${activity.dailySteps.toLocaleString(
          'it-IT'
        )} verso ${targetSteps.toLocaleString('it-IT')}/die, +${stepsDelta.toLocaleString('it-IT')} passi).`
      );
    } else if (activity.dailySteps === null) {
      stepsList.push(
        `Punta ad almeno ${params.dailyStepsOptimalThreshold.toLocaleString(
          'it-IT'
        )} passi al giorno (puoi monitorarli facilmente con lo smartphone).`
      );
    }
    if (highSedentary) {
      stepsList.push(
        `Interrompi le ${profile.sedentaryHoursPerDay} ore da seduto con 2–3 minuti in piedi o di cammino leggero ogni 45–60 minuti (telefonate in piedi, scale).`
      );
    }
    if (stepsList.length < 3) {
      stepsList.push(
        'Inserisci in calendario giorni e orari fissi per le sessioni (es. lun/mer/ven + camminata nel weekend) per trasformare l’esercizio in routine.'
      );
    }

    interventions.push({
      id: 'act_activity',
      factorKey: 'activity',
      priority: isHigh ? 'alta' : 'media',
      area: 'stile_vita',
      domains: ['Cardiovascolare', 'Diabete', 'Oncologico'],
      whereToAct: !activity.meetsWhoTarget
        ? 'Aumento attività fisica settimanale e passi quotidiani'
        : 'Passaggio ad allenamento combinato (aerobico + forza) e riduzione sedentarietà',
      currentState: `${profile.workoutsPerWeek}×${profile.minutesPerWorkout} min (${
        activity.whoEquivalentMinutes
      } eq. OMS/sett)${
        activity.dailySteps !== null
          ? ` · ${activity.dailySteps.toLocaleString('it-IT')} passi/die`
          : ''
      } · ${profile.sedentaryHoursPerDay} h seduto`,
      targetGoal: `≥${params.whoWeeklyMinutesTarget} min eq. OMS (aerobico + forza) · ≥${params.dailyStepsOptimalThreshold.toLocaleString(
        'it-IT'
      )} passi/die · <8 h seduto`,
      whyItMatters:
        'L’esercizio combinato migliora la sensibilità insulinica fino a 48 ore dopo ogni seduta, abbassa la pressione arteriosa e riduce il rischio di tumori di colon-retto, mammella ed endometrio.',
      howToSteps: stepsList.slice(0, 3),
      evidence: 'WHO 2020 · Momma BJSM 2022 · Banach EJPC 2023',
      simulatable: true,
      simulatedDelta: simDelta,
      historicalContext: attachHistory('activity'),
      applyPatch: patch,
    });
  } else {
    protectiveStrengths.push(
      `Attività fisica combinata e volume di movimento ottimali (${activity.whoEquivalentMinutes} eq. OMS/sett)`
    );
  }

  // 5. ALCOHOL
  if (profile.alcoholUnitsPerWeek > 3) {
    const isHigh = profile.alcoholUnitsPerWeek > 14;
    const isMedHigh = profile.alcoholUnitsPerWeek > params.alcoholLowRiskWeeklyLimit;
    const targetUnits = profile.alcoholUnitsPerWeek > 10 ? 3 : 0;
    const reduction = Number((profile.alcoholUnitsPerWeek - targetUnits).toFixed(1));
    const patch = (p: ClinicalProfileInput): ClinicalProfileInput => ({
      ...p,
      alcoholUnitsPerWeek: Math.min(p.alcoholUnitsPerWeek, targetUnits),
    });
    const simDelta = computeSinglePatchDelta(profile, baseResult, patch, params);

    interventions.push({
      id: 'act_alcohol',
      factorKey: 'alcohol',
      priority: isHigh ? 'alta' : isMedHigh ? 'media' : 'media',
      area: 'alimentazione',
      domains: isHigh ? ['Oncologico', 'Cardiovascolare'] : ['Oncologico'],
      whereToAct: 'Riduzione del consumo settimanale di alcol',
      currentState: `${formatItalianDecimal(profile.alcoholUnitsPerWeek)} UA/settimana`,
      targetGoal:
        targetUnits === 0
          ? '0 UA/settimana (ottimale OMS per prevenzione oncologica)'
          : `≤${targetUnits} UA/settimana (riduzione −${formatItalianDecimal(reduction)} UA/sett)`,
      whyItMatters:
        'L’etanolo è classificato cancerogeno IARC Gruppo 1 (senza soglia completamente priva di rischio) e sopra le 14 UA/sett alza pressione arteriosa, trigliceridi e calorie liquide.',
      howToSteps: [
        'Programma almeno 4–5 giorni consecutivi a zero alcol ogni settimana per interrompere l’automatismo quotidiano.',
        'Riduci le porzioni più dense (spritz/cocktail = 1,5 UA; superalcolici) sostituendoli con alternative analcoliche o birra 0.0%.',
        'Evita di bere a stomaco vuoto e alterna sempre ogni bicchiere con un bicchiere d’acqua.',
      ],
      evidence: 'WHO Europe / Lancet Public Health 2023 · IARC · WCRF',
      simulatable: true,
      simulatedDelta: simDelta,
      historicalContext: attachHistory('alcohol'),
      applyPatch: patch,
    });
  } else if (profile.alcoholUnitsPerWeek === 0) {
    protectiveStrengths.push('Consumo alcolico azzerato (massima protezione oncologica OMS)');
  }

  // 6. NUTRITION (Fruit/Veg, Red/Processed Meat, UPF)
  const lowFruitVeg = profile.fruitVegServingsPerDay < params.fruitVegDailyTarget;
  const highMeat = profile.redProcessedMeatServingsPerWeek > params.redMeatWeeklyLimit;
  const highUpf = profile.ultraProcessedIntake !== 'rare';
  if (lowFruitVeg || highMeat || highUpf) {
    const isHigh =
      profile.ultraProcessedIntake === 'frequent' ||
      profile.redProcessedMeatServingsPerWeek >= 6 ||
      profile.fruitVegServingsPerDay <= 1;

    const patch = (p: ClinicalProfileInput): ClinicalProfileInput => ({
      ...p,
      fruitVegServingsPerDay: Math.max(p.fruitVegServingsPerDay, params.fruitVegDailyTarget),
      redProcessedMeatServingsPerWeek: Math.min(
        p.redProcessedMeatServingsPerWeek,
        Math.max(1, params.redMeatWeeklyLimit - 1)
      ),
      ultraProcessedIntake: 'rare',
    });
    const simDelta = computeSinglePatchDelta(profile, baseResult, patch, params);

    const gaps: string[] = [];
    const steps: string[] = [];
    if (lowFruitVeg) {
      const addVeg = params.fruitVegDailyTarget - profile.fruitVegServingsPerDay;
      gaps.push(`+${addVeg} porzioni vegetali/die (verso ${params.fruitVegDailyTarget})`);
      steps.push(
        `Aggiungi ${addVeg} ${
          addVeg === 1 ? 'porzione' : 'porzioni'
        } al giorno di verdura o frutta di stagione (es. un contorno abbondante sia a pranzo sia a cena + un frutto a spuntino).`
      );
    }
    if (highMeat) {
      const cutMeat = profile.redProcessedMeatServingsPerWeek - Math.max(1, params.redMeatWeeklyLimit - 1);
      gaps.push(`carni rosse/lavorate ≤${Math.max(1, params.redMeatWeeklyLimit - 1)}/sett (−${cutMeat})`);
      steps.push(
        `Sostituisci ${cutMeat} porzioni settimanali di carni rosse o salumi con legumi (ceci, lenticchie, fagioli), pesce azzurro o pollame magro.`
      );
    }
    if (highUpf) {
      gaps.push('ultra-processati rari');
      steps.push(
        'Riduci gli alimenti ultra-processati (merendine, snack confezionati, bevande zuccherate, piatti pronti) scegliendo cibi integrali con pochi ingredienti.'
      );
    }
    if (steps.length < 3) {
      steps.push(
        'Usa olio extravergine d’oliva a crudo come condimento principale e porta le fibre totali sopra i 30 g/giorno.'
      );
    }

    interventions.push({
      id: 'act_nutrition',
      factorKey: 'nutrition',
      priority: isHigh ? 'alta' : 'media',
      area: 'alimentazione',
      domains: ['Oncologico', 'Diabete', 'Cardiovascolare'],
      whereToAct: 'Riallineamento alimentare verso Dieta Mediterranea e WCRF/AICR',
      currentState: `${profile.fruitVegServingsPerDay} veg/die · ${profile.redProcessedMeatServingsPerWeek} carni/sett · UPF ${UPF_LABELS[profile.ultraProcessedIntake]}`,
      targetGoal: gaps.join(' · '),
      whyItMatters:
        'Un’alimentazione ricca di fibre vegetali e povera di carni lavorate e ultra-processati protegge la mucosa intestinale, riduce i picchi glicemici e abbassa la mortalità cardiovascolare (PREDIMED, BMJ 2024).',
      howToSteps: steps.slice(0, 3),
      evidence: 'WCRF/AICR 2018 · PREDIMED NEJM 2018 · BMJ 2024 UPF',
      simulatable: true,
      simulatedDelta: simDelta,
      historicalContext: attachHistory('nutrition'),
      applyPatch: patch,
    });
  } else {
    protectiveStrengths.push(
      `Ottima qualità alimentare (${profile.fruitVegServingsPerDay} porzioni vegetali/die, carni rosse controllate, ultra-processati rari)`
    );
  }

  // 7. LIPIDS (Missing or elevated Non-HDL)
  const totalChol = normalizeOptionalLipid(profile.totalCholesterolMgDl);
  const hdlChol = normalizeOptionalLipid(profile.hdlCholesterolMgDl);
  const nonHdl =
    totalChol !== null && hdlChol !== null ? Math.round(totalChol - hdlChol) : null;

  if (nonHdl !== null && nonHdl >= 145) {
    const targetNonHdl = 120;
    const targetTotal = Math.max(hdlChol! + targetNonHdl, 165);
    const patch = (p: ClinicalProfileInput): ClinicalProfileInput => ({
      ...p,
      totalCholesterolMgDl: Math.min(p.totalCholesterolMgDl ?? targetTotal, targetTotal),
    });
    const simDelta = computeSinglePatchDelta(profile, baseResult, patch, params);
    interventions.push({
      id: 'act_lipids',
      factorKey: 'lipids',
      priority: nonHdl >= 175 ? 'alta' : 'media',
      area: 'parametri_clinici',
      domains: ['Cardiovascolare'],
      whereToAct: 'Riduzione del colesterolo aterogeno (Non-HDL)',
      currentState: `Non-HDL ${nonHdl} mg/dL (Totale ${totalChol} · HDL ${hdlChol} mg/dL)`,
      targetGoal: `Non-HDL < 130 mg/dL (ottimale < 100–120 mg/dL in base al rischio CV)`,
      whyItMatters:
        'Il colesterolo Non-HDL racchiude tutte le lipoproteine aterogene (LDL, VLDL, Lp(a)) ed è il parametro lipidico primario usato da ESC SCORE2.',
      howToSteps: [
        'Sostituisci grassi saturi (burro, formaggi grassi, carni grasse, prodotti da forno industriali) con olio EVO, pesce azzurro e frutta secca non salata (20–30 g/die).',
        'Aumenta le fibre solubili (avena, orzo, legumi, mele, semi di lino) che riducono l’assorbimento intestinale del colesterolo.',
        'Ripeti il profilo lipidico completo (Totale, HDL, LDL, Trigliceridi) dopo 3 mesi di intervento sullo stile di vita.',
      ],
      doctorNote:
        'Chiedi al MMG di valutare il profilo LDL/ApoB e dosare la Lipoproteina(a) almeno una volta nella vita (raccomandazione ESC).',
      evidence: 'ESC/EAS Dyslipidaemia Guidelines · ESC SCORE2 2021',
      simulatable: true,
      simulatedDelta: simDelta,
      historicalContext: attachHistory('lipids'),
      applyPatch: patch,
    });
  } else if (totalChol === null || hdlChol === null) {
    interventions.push({
      id: 'act_lipids_missing',
      factorKey: 'lipids',
      priority: 'mantenimento',
      area: 'parametri_clinici',
      domains: ['Cardiovascolare'],
      whereToAct: 'Completare gli esami del profilo lipidico per affinare il calcolo SCORE2',
      currentState: 'Colesterolo totale o HDL non inseriti (usate mediane europee)',
      targetGoal: 'Inserire valori reali di Colesterolo Totale e HDL da prelievo ematico',
      whyItMatters:
        'Senza i tuoi valori lipidici reali la stima cardiovascolare usa mediane epidemiologiche europee: inserire gli esami recenti rende il calcolo molto più aderente al tuo profilo.',
      howToSteps: [
        'Al prossimo controllo ematico di routine richiedi Colesterolo Totale, HDL, LDL e Trigliceridi.',
        'Valuta con il medico il dosaggio una tantum della Lipoproteina(a) secondo le linee guida ESC.',
        'Aggiorna i valori nella scheda Valutazione e salva il nuovo file storico (.json).',
      ],
      evidence: 'ESC SCORE2 2021 Calibration Standard',
      simulatable: false,
      simulatedDelta: { cvdDeltaPct: 0, findriscDeltaPoints: 0, oncologicDeltaIndex: 0 },
      applyPatch: (p) => p,
    });
  }

  // 8. GLYCEMIC SCREENING (High FINDRISC or prior high blood glucose)
  if (baseResult.metabolic.scoreNumeric >= params.findriscHighRiskCutoff || profile.priorHighBloodGlucose) {
    interventions.push({
      id: 'act_glucose',
      factorKey: 'glucose',
      priority: profile.priorHighBloodGlucose || baseResult.metabolic.scoreNumeric >= 15 ? 'alta' : 'media',
      area: 'parametri_clinici',
      domains: ['Diabete', 'Cardiovascolare'],
      whereToAct: 'Controllo glicometabolico (HbA1c e glicemia) e gestione dei picchi glicemici',
      currentState: profile.priorHighBloodGlucose
        ? `Pregressa iperglicemia · FINDRISC ${baseResult.metabolic.scoreNumeric}/26 pt`
        : `FINDRISC ${baseResult.metabolic.scoreNumeric}/26 pt (${baseResult.metabolic.secondaryScoreValue} rischio 10 anni)`,
      targetGoal: 'Glicemia a digiuno <100 mg/dL · HbA1c <5,7% (39 mmol/mol)',
      whyItMatters:
        'Intercettare precocemente la fase di prediabete permette, tramite interventi mirati su alimentazione, muscolo e peso, di prevenire o ritardare il diabete di tipo 2 fino al 58% dei casi (studi DPP/DPS).',
      howToSteps: [
        'Inizia i pasti con una porzione di verdure ricche di fibre, seguita da proteine e infine carboidrati integrali per attenuare il picco glicemico.',
        'Riduci zuccheri liberi, succhi di frutta e farine raffinate; preferisci legumi e cereali in chicco.',
        'Inserisci 10–15 minuti di cammino entro 30 minuti dai pasti più ricchi di carboidrati.',
      ],
      doctorNote:
        'Concorda con il MMG il dosaggio di emoglobina glicata (HbA1c) e glicemia plasmatica a digiuno secondo linee guida SID-AMD / ADA 2025.',
      evidence: 'ADA Standards of Care 2025 · SID-AMD · FINDRISC',
      simulatable: false,
      simulatedDelta: { cvdDeltaPct: 0, findriscDeltaPoints: 0, oncologicDeltaIndex: 0 },
      applyPatch: (p) => p,
    });
  }

  // 9. SLEEP & UV PROTECTION
  const poorSleep = profile.sleepHoursPerNight < 6.5 || profile.sleepHoursPerNight > 9.5;
  const poorUv = profile.uvProtection !== 'consistent';
  if (poorSleep || poorUv) {
    const patch = (p: ClinicalProfileInput): ClinicalProfileInput => ({
      ...p,
      sleepHoursPerNight: poorSleep ? 7.5 : p.sleepHoursPerNight,
      uvProtection: 'consistent',
    });
    const simDelta = computeSinglePatchDelta(profile, baseResult, patch, params);
    const steps: string[] = [];
    if (poorSleep) {
      steps.push(
        `Stabilizza gli orari di risveglio e punta a 7–8 ore di sonno (ora ${formatItalianDecimal(
          profile.sleepHoursPerNight
        )} h/notte), evitando schermi luminosi e caffeina nelle ore serali.`
      );
    }
    if (poorUv) {
      steps.push(
        'Applica protezione solare SPF 30+/50+ nelle esposizioni dirette, evita le ore centrali (11–16) e programma un controllo dermatologico periodico dei nei.'
      );
    }
    steps.push('Riduci l’esposizione a stress cronico serale con una routine di decompressione di 20 minuti prima di dormire.');

    interventions.push({
      id: 'act_sleep_uv',
      factorKey: 'sleep_uv',
      priority: 'mantenimento',
      area: 'stile_vita',
      domains: poorUv ? ['Oncologico', 'Cardiovascolare'] : ['Cardiovascolare', 'Diabete'],
      whereToAct:
        poorSleep && poorUv
          ? 'Regolarizzazione del sonno e fotoprotezione UV'
          : poorUv
            ? 'Protezione solare costante contro radiazioni UV'
            : 'Regolarizzazione della durata del sonno notturno',
      currentState: [
        poorSleep ? `Sonno ${formatItalianDecimal(profile.sleepHoursPerNight)} h/notte` : null,
        poorUv
          ? `Protezione UV: ${profile.uvProtection === 'rare' ? 'Rara' : 'Occasionale'}`
          : null,
      ]
        .filter(Boolean)
        .join(' · '),
      targetGoal: [
        poorSleep ? '7–8 ore di sonno regolare/notte' : null,
        poorUv ? 'Protezione UV costante (SPF 30+/50+)' : null,
      ]
        .filter(Boolean)
        .join(' · '),
      whyItMatters:
        'Il sonno insufficiente altera cortisolo, pressione e sensibilità insulinica, mentre la radiazione UV è un cancerogeno cutaneo prevenibile (IARC Gruppo 1).',
      howToSteps: steps.slice(0, 3),
      evidence: 'AHA Life’s Essential 8 · Codice Europeo Contro il Cancro',
      simulatable: poorUv,
      simulatedDelta: simDelta,
      applyPatch: patch,
    });
  }

  // Sort: Alta first, then Media, then Mantenimento; within same priority, worsened-in-history first, then largest simulated impact
  const priorityOrder: Record<InterventionPriority, number> = {
    alta: 0,
    media: 1,
    mantenimento: 2,
  };

  interventions.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    const aWorsened = a.historicalContext?.direction === 'worsened' ? 0 : 1;
    const bWorsened = b.historicalContext?.direction === 'worsened' ? 0 : 1;
    if (aWorsened !== bWorsened) return aWorsened - bWorsened;

    const aImpact =
      Math.abs(a.simulatedDelta.cvdDeltaPct) * 3 +
      Math.abs(a.simulatedDelta.findriscDeltaPoints) * 2 +
      Math.abs(a.simulatedDelta.oncologicDeltaIndex);
    const bImpact =
      Math.abs(b.simulatedDelta.cvdDeltaPct) * 3 +
      Math.abs(b.simulatedDelta.findriscDeltaPoints) * 2 +
      Math.abs(b.simulatedDelta.oncologicDeltaIndex);
    return bImpact - aImpact;
  });

  const defaultSelectedIds = interventions
    .filter((item) => item.simulatable && item.priority !== 'mantenimento')
    .map((item) => item.id);

  const hasHighOrMedium = interventions.some(
    (item) => item.priority === 'alta' || item.priority === 'media'
  );

  return {
    interventions,
    protectiveStrengths,
    defaultSelectedIds,
    isAlreadyOptimal: !hasHighOrMedium,
  };
}

/**
 * Simulates the combined effect of applying all currently selected interventions simultaneously
 * using the exact clinical risk engine and active parameter set.
 */
export function simulateSelectedInterventions(
  profile: ClinicalProfileInput,
  baseResult: ClinicalAssessmentResult,
  interventions: PersonalizedIntervention[],
  selectedIds: string[],
  params: ClinicalParameterSet = DEFAULT_CLINICAL_PARAMETERS
): CombinedSimulationOutcome {
  const selectedSet = new Set(selectedIds);
  const activeInterventions = interventions.filter(
    (item) => item.simulatable && selectedSet.has(item.id)
  );

  let patchedProfile: ClinicalProfileInput = { ...profile };
  for (const item of activeInterventions) {
    patchedProfile = item.applyPatch(patchedProfile);
  }

  const projected =
    activeInterventions.length > 0
      ? evaluateClinicalRisk(patchedProfile, params)
      : baseResult;

  return {
    selectedCount: activeInterventions.length,
    baseCvdPct: baseResult.cardiovascular.scoreNumeric,
    projectedCvdPct: projected.cardiovascular.scoreNumeric,
    cvdDeltaPct: Number(
      (projected.cardiovascular.scoreNumeric - baseResult.cardiovascular.scoreNumeric).toFixed(1)
    ),
    baseFindrisc: baseResult.metabolic.scoreNumeric,
    projectedFindrisc: projected.metabolic.scoreNumeric,
    findriscDeltaPoints:
      projected.metabolic.scoreNumeric - baseResult.metabolic.scoreNumeric,
    baseOnco: baseResult.oncologic.scoreNumeric,
    projectedOnco: projected.oncologic.scoreNumeric,
    oncologicDeltaIndex:
      projected.oncologic.scoreNumeric - baseResult.oncologic.scoreNumeric,
  };
}
