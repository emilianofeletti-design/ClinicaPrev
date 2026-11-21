import {
  BookOpen,
  CalendarClock,
  Download,
  Droplets,
  FileUp,
  HeartPulse,
  Printer,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  ClinicalAssessmentResult,
  ClinicalProfileInput,
  DomainRiskResult,
  PathologyPopulationComparison,
  RiskTier,
} from '../types/clinical';
import {
  DEFAULT_CLINICAL_PARAMETERS,
  type ClinicalParameterSet,
} from '../utils/clinicalParameters';
import {
  computeEffectiveActivityMetrics,
  normalizeOptionalLipid,
} from '../utils/clinicalRiskEngine';
import {
  buildPersonalizedInterventionPlan,
  evaluateHistoricalTrajectory,
} from '../utils/interventionPlanner';
import {
  createPersonalAnalysisRecord,
  type PersonalAnalysisRecord,
} from '../utils/personalArchiveFile';
import {
  HealthAdvicePanel,
  type AdviceSeverity,
  type PersonalizedAdviceItem,
} from './HealthAdviceAlert';
import { HistoricalEvaluationPanel } from './HistoricalEvaluationPanel';
import { InterventionPlanSection } from './InterventionPlanSection';
import { RiskTimelineChart } from './RiskTimelineChart';
import { SpecificCancerRiskSection } from './SpecificCancerRiskSection';

export type { AdviceSeverity, PersonalizedAdviceItem };

interface RiskDashboardProps {
  profile: ClinicalProfileInput;
  result: ClinicalAssessmentResult;
  activeParams: ClinicalParameterSet;
  personalTimeline: PersonalAnalysisRecord[];
  importError: string | null;
  onEditParameters: () => void;
  onExportArchiveFile: (label: string) => void;
  onImportArchiveFile: (file: File) => void;
  onClearTimeline: () => void;
  onOpenLegal: () => void;
  onOpenResearch: () => void;
}

/**
 * Analyzes `computedProfile` and `result` against ESC, WHO, IDF/FINDRISC and WCRF/AICR
 * guidelines to generate prioritized clinical suggestions displayed via `HealthAdviceAlert`.
 */
export function getPersonalizedAdvice(
  computedProfile: ClinicalProfileInput,
  result: ClinicalAssessmentResult,
  params: ClinicalParameterSet = DEFAULT_CLINICAL_PARAMETERS
): PersonalizedAdviceItem[] {
  const advice: PersonalizedAdviceItem[] = [];
  const activity = computeEffectiveActivityMetrics(computedProfile, params);
  const waistThreshold = computedProfile.sex === 'male' ? 94 : 80;
  const waistHigh = computedProfile.sex === 'male' ? 102 : 88;
  const totalChol = normalizeOptionalLipid(computedProfile.totalCholesterolMgDl);
  const hdlChol = normalizeOptionalLipid(computedProfile.hdlCholesterolMgDl);
  const nonHdl = totalChol !== null && hdlChol !== null ? Math.round(totalChol - hdlChol) : null;

  // 0. Segnale d'allarme clinico gastrointestinale (Red Flag NICE NG12 / AIOM)
  if (computedProfile.persistentBowelChangeOrBleeding) {
    advice.push({
      id: 'advice_bowel_red_flag',
      factorKey: 'clinical_evaluation',
      iconCategory: 'gastrointestinal',
      severity: 'urgent',
      severityLabel: 'Valutazione medica prioritaria',
      title: 'Variazione persistente dell’alvo o sanguinamento riferito (Red Flag clinico)',
      triggerMetric: 'Segnale d’allarme gastrointestinale attivo (non altera lo score statistico)',
      suggestedActions: [
        'Prenotare una valutazione diretta con il Medico di Medicina Generale (MMG)',
        'Valutare con il medico ricerca sangue occulto fecale (SOF/FIT) o approfondimento gastroenterologico/endoscopico',
      ],
      actionSummary:
        'A differenza della stipsi cronica abituale (che secondo WCRF/AICR non aumenta il rischio statistico di tumore del colon-retto), una variazione recente e persistente delle abitudini intestinali (>4–6 settimane) o la presenza di sangue nelle feci richiede sempre inquadramento medico diretto.',
      guideline: 'NICE Guideline NG12 · Linee Guida AIOM Colon-Retto · WCRF/AICR',
      domains: 'Gastroenterologia · Oncologia Preventiva',
    });
  }

  // 1. Cessazione fumo di tabacco
  if (
    computedProfile.smokingStatus === 'current_light' ||
    computedProfile.smokingStatus === 'current_heavy'
  ) {
    advice.push({
      id: 'advice_smoking',
      factorKey: 'smoking',
      iconCategory: 'smoking',
      severity: 'urgent',
      severityLabel: 'Intervento prioritario',
      title: 'Cessazione del fumo di tabacco',
      triggerMetric: `${computedProfile.packYears} pacchetti-anno · CV ${result.cardiovascular.scoreNumeric}% · Onco ${result.oncologic.scoreNumeric}/100`,
      suggestedActions: [
        'Percorso guidato presso Centro Antifumo SSN (Telefono Verde ISS 800 554088)',
        'Valutazione terapia antifumo di prima linea con il medico curante',
      ],
      actionSummary:
        'Smettere di fumare è il singolo intervento modificabile con il maggiore impatto simultaneo su rischio cardiovascolare e oncologico.',
      guideline: 'ESC Prevention 2021 · IARC Monograph 100E · ISS',
      domains: 'Cardiovascolare · Oncologico',
    });
  }

  // 2. Rischio ipertensione -> Riduzione apporto sodico & Monitoraggio pressorio quotidiano
  if (
    computedProfile.systolicBp >= 130 ||
    ((result.cardiovascular.tier === 'high' || result.cardiovascular.tier === 'very_high') &&
      computedProfile.systolicBp >= 125)
  ) {
    const isUrgent =
      computedProfile.systolicBp >= 140 ||
      result.cardiovascular.tier === 'high' ||
      result.cardiovascular.tier === 'very_high';
    advice.push({
      id: 'advice_sodium_bp',
      factorKey: 'blood_pressure',
      iconCategory: 'hypertension',
      severity: isUrgent ? 'urgent' : 'warning',
      severityLabel: isUrgent ? 'Intervento prioritario' : 'Azione consigliata',
      title:
        computedProfile.systolicBp >= 140
          ? 'Rischio elevato di ipertensione arteriosa'
          : 'Pressione arteriosa sopra il target ottimale',
      triggerMetric: `PA sistolica ${computedProfile.systolicBp} mmHg · Rischio CV ${result.cardiovascular.scoreNumeric}%`,
      suggestedActions: [
        'Riduzione apporto sodico (<5 g di sale/giorno, limitando salumi e cibi pronti)',
        'Monitoraggio pressorio quotidiano (diario domiciliare mattina e sera per 7 giorni)',
        ...(computedProfile.systolicBp >= 140
          ? ['Condivisione del diario pressorio con il MMG per verifica clinica/terapeutica']
          : []),
      ],
      actionSummary:
        'Ogni calo sostenuto di 10 mmHg della pressione sistolica riduce di circa il 20% il rischio di eventi cardiovascolari maggiori e ictus.',
      guideline: 'ESC Hypertension Guidelines 2024 · DASH Trial',
      domains: 'Cardiovascolare',
    });
  }

  // 3. Incremento attività fisica
  const lowSteps =
    activity.dailySteps !== null && activity.dailySteps < params.dailyStepsOptimalThreshold;
  if (
    !activity.meetsWhoTarget ||
    !activity.hasCombinedModality ||
    lowSteps ||
    computedProfile.sedentaryHoursPerDay >= 9
  ) {
    const isUrgent = !activity.meetsWhoTarget && activity.whoEquivalentMinutes < 75;
    advice.push({
      id: 'advice_activity',
      factorKey: 'activity',
      iconCategory: 'activity',
      severity: isUrgent ? 'urgent' : 'warning',
      severityLabel: isUrgent ? 'Intervento prioritario' : 'Azione consigliata',
      title: 'Incremento attività fisica e riduzione sedentarietà',
      triggerMetric: `${activity.whoEquivalentMinutes} min eq. OMS/sett${
        activity.dailySteps !== null ? ` · ${activity.dailySteps} passi/die` : ''
      } · ${computedProfile.sedentaryHoursPerDay} h seduto`,
      suggestedActions: [
        `Incremento attività fisica verso ≥${params.whoWeeklyMinutesTarget} min/settimana`,
        'Allenamento combinato: aerobico + 2 sedute/settimana di rinforzo muscolare',
        `Target ≥${params.dailyStepsOptimalThreshold} passi/giorno con pause attive ogni 45–60 min`,
      ],
      actionSummary:
        'L’esercizio combinato migliora la sensibilità insulinica, abbassa la pressione arteriosa e riduce l’incidenza di tumori correlati.',
      guideline: 'WHO 2020 · Momma BJSM 2022 · Banach EJPC 2023',
      domains: 'Cardiovascolare · Diabete · Oncologico',
    });
  }

  // 4. Controllo peso e circonferenza vita
  if (result.bmi >= 25 || computedProfile.waistCm >= waistThreshold) {
    const isUrgent = result.bmi >= 30 || computedProfile.waistCm > waistHigh;
    advice.push({
      id: 'advice_weight_waist',
      factorKey: 'adiposity',
      iconCategory: 'weight',
      severity: isUrgent ? 'urgent' : 'warning',
      severityLabel: isUrgent ? 'Intervento prioritario' : 'Azione consigliata',
      title: 'Riduzione peso corporeo e circonferenza vita',
      triggerMetric: `BMI ${result.bmi.toFixed(1)} kg/m² · Vita ${computedProfile.waistCm} cm (target <${waistThreshold} cm)`,
      suggestedActions: [
        'Deficit calorico graduale e sostenibile (−5/8% del peso in 3–6 mesi)',
        'Monitoraggio settimanale di peso e girovita abbinato a camminata post-prandiale',
      ],
      actionSummary:
        'Ridurre l’adiposità viscerale addominale abbatte simultaneamente il punteggio FINDRISC, la pressione sistolica e il carico infiammatorio.',
      guideline: 'DPP / Look AHEAD · WCRF/AICR 2018 · IDF',
      domains: 'Cardiovascolare · Diabete · Oncologico',
    });
  }

  // 5. Screening glicemico (FINDRISC / pregressa iperglicemia)
  if (
    result.metabolic.scoreNumeric >= params.findriscHighRiskCutoff ||
    computedProfile.priorHighBloodGlucose
  ) {
    const isUrgent =
      computedProfile.priorHighBloodGlucose || result.metabolic.scoreNumeric >= 15;
    advice.push({
      id: 'advice_glucose',
      factorKey: 'glucose',
      iconCategory: 'glucose',
      severity: isUrgent ? 'urgent' : 'warning',
      severityLabel: isUrgent ? 'Intervento prioritario' : 'Azione consigliata',
      title: 'Monitoraggio glicemico (HbA1c e glicemia a digiuno)',
      triggerMetric: `FINDRISC ${result.metabolic.scoreNumeric}/26 pt (${result.metabolic.secondaryScoreValue} rischio 10 anni)`,
      suggestedActions: [
        'Dosaggio emoglobina glicata (HbA1c) e glicemia a digiuno con il MMG',
        'Riduzione zuccheri liberi/farine raffinate e camminata di 10–15 min dopo i pasti',
      ],
      actionSummary:
        'Intercettare precocemente il prediabete e intervenire su dieta e movimento riduce fino al 58% la progressione verso il diabete tipo 2.',
      guideline: 'ADA Standards of Care 2025 · SID-AMD · FINDRISC',
      domains: 'Diabete · Cardiovascolare',
    });
  }

  // 6. Riduzione consumo alcolico
  if (computedProfile.alcoholUnitsPerWeek > 3) {
    const isUrgent = computedProfile.alcoholUnitsPerWeek > 14;
    advice.push({
      id: 'advice_alcohol',
      factorKey: 'alcohol',
      iconCategory: 'alcohol',
      severity: isUrgent ? 'urgent' : 'warning',
      severityLabel: isUrgent ? 'Intervento prioritario' : 'Azione consigliata',
      title: 'Riduzione del consumo di alcol',
      triggerMetric: `${computedProfile.alcoholUnitsPerWeek} UA/settimana · Indice Onco ${result.oncologic.scoreNumeric}/100`,
      suggestedActions: [
        'Inserire 4–5 giorni consecutivi alcohol-free a settimana',
        'Ridurre aperitivi/superalcolici verso ≤3 UA/sett (target ottimale OMS: 0 UA)',
      ],
      actionSummary:
        'L’alcol è un cancerogeno IARC Gruppo 1 senza soglia priva di rischio e contribuisce ad aumentare pressione arteriosa e peso corporeo.',
      guideline: 'WHO Europe / Lancet Public Health 2023 · IARC',
      domains: isUrgent ? 'Oncologico · Cardiovascolare' : 'Oncologico',
    });
  }

  // 7. Qualità nutrizionale
  if (
    computedProfile.fruitVegServingsPerDay < params.fruitVegDailyTarget ||
    computedProfile.redProcessedMeatServingsPerWeek > params.redMeatWeeklyLimit ||
    computedProfile.ultraProcessedIntake !== 'rare'
  ) {
    const isUrgent =
      computedProfile.ultraProcessedIntake === 'frequent' ||
      computedProfile.redProcessedMeatServingsPerWeek >= 6;
    advice.push({
      id: 'advice_nutrition',
      factorKey: 'nutrition',
      iconCategory: 'nutrition',
      severity: isUrgent ? 'urgent' : 'warning',
      severityLabel: isUrgent ? 'Intervento prioritario' : 'Azione consigliata',
      title: 'Ottimizzazione dieta mediterranea e fibre vegetali',
      triggerMetric: `${computedProfile.fruitVegServingsPerDay} veg/die · ${computedProfile.redProcessedMeatServingsPerWeek} carni/sett`,
      suggestedActions: [
        `Aumentare frutta e verdura ad almeno ${params.fruitVegDailyTarget} porzioni/giorno (>30 g fibre)`,
        `Limitare carni rosse/lavorate a ≤${Math.max(1, params.redMeatWeeklyLimit - 1)} porzioni/sett ed eliminare ultra-processati frequenti`,
      ],
      actionSummary:
        'Aderire al modello Mediterraneo tradizionale protegge da eventi cardiovascolari, picchi glicemici e tumori del tratto gastrointestinale.',
      guideline: 'WCRF/AICR 2018 · PREDIMED NEJM 2018 · BMJ 2024 UPF',
      domains: 'Oncologico · Diabete · Cardiovascolare',
    });
  }

  // 8. Profilo lipidico (Non-HDL elevato o mancante)
  if (nonHdl !== null && nonHdl >= 145) {
    advice.push({
      id: 'advice_lipids',
      factorKey: 'lipids',
      iconCategory: 'lipids',
      severity: nonHdl >= 175 ? 'urgent' : 'warning',
      severityLabel: nonHdl >= 175 ? 'Intervento prioritario' : 'Azione consigliata',
      title: 'Riduzione del colesterolo aterogeno (Non-HDL)',
      triggerMetric: `Non-HDL ${nonHdl} mg/dL (target <130 mg/dL)`,
      suggestedActions: [
        'Sostituire grassi saturi con olio EVO, pesce azzurro, legumi e avena (fibre solubili)',
        'Rivalutare profilo lipidico completo (LDL, ApoB, Lipoproteina(a)) con il MMG',
      ],
      actionSummary:
        'Il colesterolo Non-HDL concentra le lipoproteine aterogene responsabili della placca arteriosa ed è un driver diretto di ESC SCORE2.',
      guideline: 'ESC/EAS Dyslipidaemia · ESC SCORE2 2021',
      domains: 'Cardiovascolare',
    });
  } else if (totalChol === null || hdlChol === null) {
    advice.push({
      id: 'advice_lipids_missing',
      factorKey: 'lipids',
      iconCategory: 'lipids',
      severity: 'info',
      severityLabel: 'Approfondimento utile',
      title: 'Completamento profilo lipidico da esami ematici',
      triggerMetric: 'Colesterolo totale o HDL non inseriti (stima su mediane UE)',
      suggestedActions: [
        'Richiedere Colesterolo Totale, HDL, LDL e Trigliceridi al prossimo prelievo',
        'Aggiornare i valori in Valutazione per calibrare al meglio ESC SCORE2',
      ],
      actionSummary:
        'Inserire i valori reali da laboratorio elimina la stima su mediane europee e migliora l’accuratezza della fascia cardiovascolare.',
      guideline: 'ESC SCORE2 2021 Calibration Standard',
      domains: 'Cardiovascolare',
    });
  }

  // 9. Sonno e protezione UV
  if (
    computedProfile.sleepHoursPerNight < 6.5 ||
    computedProfile.sleepHoursPerNight > 9.5 ||
    computedProfile.uvProtection === 'rare'
  ) {
    advice.push({
      id: 'advice_sleep_uv',
      factorKey: 'sleep_uv',
      iconCategory: 'sleep_uv',
      severity: 'info',
      severityLabel: 'Approfondimento utile',
      title: 'Regolarizzazione del sonno e fotoprotezione UV',
      triggerMetric: `Sonno ${computedProfile.sleepHoursPerNight} h/notte · Protezione UV ${
        computedProfile.uvProtection === 'rare'
          ? 'rara'
          : computedProfile.uvProtection === 'occasional'
            ? 'occasionale'
            : 'costante'
      }`,
      suggestedActions: [
        'Regolarizzare il sonno verso 7–8 ore/notte con orari costanti',
        'Fotoprotezione SPF 30+/50+ nelle esposizioni dirette e controllo periodico dei nei',
      ],
      actionSummary:
        'Qualità del sonno e protezione dai raggi UV (IARC Gruppo 1) completano la prevenzione cardiometabolica e dermatologica.',
      guideline: 'AHA Life’s Essential 8 · Codice Europeo Contro il Cancro',
      domains: 'Cardiovascolare · Oncologico',
    });
  }

  // Profilo già ottimale
  if (advice.length === 0) {
    advice.push({
      id: 'advice_optimal',
      factorKey: 'maintenance',
      iconCategory: 'protective',
      severity: 'positive',
      severityLabel: 'Profilo protettivo',
      title: 'Mantenimento dei fattori protettivi attuali',
      triggerMetric: `CV ${result.cardiovascular.scoreNumeric}% · FINDRISC ${result.metabolic.scoreNumeric}/26 pt · Onco ${result.oncologic.scoreNumeric}/100`,
      suggestedActions: [
        'Mantenere l’attuale routine di movimento, alimentazione mediterranea e astensione da fumo/alcol',
        'Programmare controlli annuali di pressione, peso e screening SSN per fascia d’età',
      ],
      actionSummary:
        'Tutti i principali parametri modificabili rientrano già nei target preventivi delle linee guida internazionali.',
      guideline: 'ESC 2021 · WHO 2020 · WCRF/AICR 2018',
      domains: 'Cardiovascolare · Diabete · Oncologico',
    });
  }

  const severityOrder: Record<AdviceSeverity, number> = {
    urgent: 0,
    warning: 1,
    info: 2,
    positive: 3,
  };
  return advice.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

function getTierPresentation(tier: RiskTier): { symbol: string; textClass: string } {
  switch (tier) {
    case 'low':
      return { symbol: '●', textClass: 'text-emerald-700' };
    case 'moderate':
      return { symbol: '▲', textClass: 'text-amber-700' };
    case 'elevated':
      return { symbol: '◆', textClass: 'text-orange-700' };
    case 'high':
    case 'very_high':
      return { symbol: '✖', textClass: 'text-rose-700' };
  }
}

function DomainScoreCard({
  eyebrow,
  title,
  domain,
  icon,
  accentClass,
  topBorderClass,
  actionLabel,
  onActionClick,
}: {
  eyebrow: string;
  title: string;
  domain: DomainRiskResult;
  icon: ReactNode;
  accentClass: string;
  topBorderClass: string;
  actionLabel?: string;
  onActionClick?: () => void;
}) {
  const tierStyle = getTierPresentation(domain.tier);

  return (
    <article
      className={`bg-white border border-stone-200/90 border-t-2 ${topBorderClass} rounded-xl p-6 flex flex-col justify-between gap-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)]`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-2 font-mono text-slate-500">
            <span
              aria-hidden="true"
              className={`inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${accentClass}`}
            >
              {icon}
            </span>
            {eyebrow}
          </span>
          <span className={`font-semibold whitespace-nowrap ${tierStyle.textClass}`}>
            {tierStyle.symbol} {domain.tierLabel}
          </span>
        </div>

        <h2 className="text-base font-semibold text-slate-900">{title}</h2>

        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-3xl font-mono font-bold tabular-nums text-slate-900">
            {domain.scoreNumeric}
          </span>
          <span className="text-xs font-mono text-slate-500">{domain.unit}</span>
        </div>

        {domain.secondaryScoreLabel && domain.secondaryScoreValue && (
          <div className="flex items-baseline justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
            <span className="text-slate-500">{domain.secondaryScoreLabel}</span>
            <span className="font-mono font-semibold tabular-nums text-slate-900">
              {domain.secondaryScoreValue}
            </span>
          </div>
        )}

        <p className="text-sm text-slate-600 leading-relaxed">{domain.summary}</p>
      </div>

      <div className="pt-3 border-t border-stone-100 space-y-1.5 text-xs text-slate-500">
        <p className="font-medium text-slate-700">{domain.protocolName}</p>
        <p className="font-mono text-[11px] text-slate-500">{domain.protocolReference}</p>
        {domain.assumptionsUsed.length > 0 && (
          <p className="text-[11px] text-slate-500 pt-0.5">{domain.assumptionsUsed[0]}</p>
        )}
        {actionLabel && onActionClick && (
          <div className="pt-1.5">
            <button
              type="button"
              onClick={onActionClick}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D6E6E] hover:underline cursor-pointer"
            >
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export function RiskDashboard({
  profile,
  result,
  activeParams,
  personalTimeline,
  importError,
  onEditParameters,
  onExportArchiveFile,
  onImportArchiveFile,
  onClearTimeline,
  onOpenLegal,
  onOpenResearch,
}: RiskDashboardProps) {
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [comparisonChartType, setComparisonChartType] = useState<'bar' | 'radar' | 'timeline'>(
    () => (personalTimeline.length > 0 ? 'timeline' : 'bar')
  );
  const [selectedCompareId, setSelectedCompareId] = useState<string>('');
  const dashboardFileInputRef = useRef<HTMLInputElement | null>(null);
  const populationComparison = result.populationComparison ?? [];

  const sortedTimeline = useMemo(
    () =>
      [...personalTimeline].sort(
        (a, b) => Date.parse(a.recordedAtIso) - Date.parse(b.recordedAtIso)
      ),
    [personalTimeline]
  );

  const currentRecord = useMemo(
    () => createPersonalAnalysisRecord(profile, result, 'Analisi attuale'),
    [profile, result]
  );

  // Auto-select timeline view & best historical baseline checkpoint when a file is loaded
  useEffect(() => {
    if (sortedTimeline.length > 0) {
      setComparisonChartType('timeline');
      setSelectedCompareId((prev) => {
        if (sortedTimeline.some((r) => r.id === prev)) return prev;
        const latest = sortedTimeline[sortedTimeline.length - 1];
        const latestMatchesCurrent =
          sortedTimeline.length > 1 &&
          latest.summary.cvdPct === currentRecord.summary.cvdPct &&
          latest.summary.findriscPoints === currentRecord.summary.findriscPoints &&
          latest.summary.oncologicIndex === currentRecord.summary.oncologicIndex &&
          latest.summary.bmi === currentRecord.summary.bmi;
        return latestMatchesCurrent ? sortedTimeline[0].id : latest.id;
      });
    } else {
      setSelectedCompareId('');
      setComparisonChartType((prev) => (prev === 'timeline' ? 'bar' : prev));
    }
  }, [sortedTimeline, currentRecord]);

  const selectedBaselineRecord = useMemo(() => {
    if (sortedTimeline.length === 0) return null;
    return (
      sortedTimeline.find((r) => r.id === selectedCompareId) ??
      sortedTimeline[sortedTimeline.length - 1]
    );
  }, [sortedTimeline, selectedCompareId]);

  const historicalEvaluation = useMemo(
    () =>
      selectedBaselineRecord
        ? evaluateHistoricalTrajectory(
            sortedTimeline,
            currentRecord,
            selectedBaselineRecord,
            activeParams
          )
        : null,
    [sortedTimeline, currentRecord, selectedBaselineRecord, activeParams]
  );

  const personalizedAdvice = useMemo(
    () => getPersonalizedAdvice(profile, result, activeParams),
    [profile, result, activeParams]
  );

  const interventionPlan = useMemo(
    () =>
      buildPersonalizedInterventionPlan(
        profile,
        result,
        activeParams,
        historicalEvaluation
      ),
    [profile, result, activeParams, historicalEvaluation]
  );

  const handleScrollToPlan = () => {
    const el = document.getElementById('piano-intervento');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleScrollToSpecificCancers = () => {
    const el = document.getElementById('profilo-oncologico-sedi');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleJumpToFactor = (factorKey: PersonalizedAdviceItem['factorKey']) => {
    if (factorKey === 'clinical_evaluation') {
      const target =
        document.querySelector('[data-testid="specific-cancer-card-colorectal"]') ||
        document.getElementById('profilo-oncologico-sedi');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    const target =
      document.querySelector(`[data-testid="intervention-item-${factorKey}"]`) ||
      document.getElementById('piano-intervento');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleExport = () => {
    const clean =
      snapshotLabel.trim() ||
      `Analisi ${new Date().toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`;
    onExportArchiveFile(clean);
    setSnapshotLabel('');
    setExportSuccess(
      'File personale (.json) scaricato sul tuo dispositivo! Nessun dato è stato salvato sul sito.'
    );
  };

  return (
    <div className="space-y-8">
      {/* Header & Summary Actions */}
      <section className="bg-gradient-to-r from-[#FFFDF8] via-white to-[#F0FDFA] border border-teal-100 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6 shadow-[0_2px_12px_rgba(13,110,110,0.04)]">
        <div className="space-y-2">
          <p className="text-xs font-mono text-[#0D6E6E]">
            BMI {result.bmi.toFixed(1)} kg/m² · {result.bmiCategory} · Età {profile.age} anni · PA{' '}
            {profile.systolicBp} mmHg · Parametri {result.parameterVersion}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Dashboard del Profilo di Rischio Clinico
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Sintesi puramente informativa e divulgativa calcolata su ESC SCORE2, FINDRISC,
            WCRF/AICR e Fondazione AIRC.{' '}
            <button
              type="button"
              onClick={onOpenLegal}
              className="font-medium text-[#0D6E6E] hover:underline cursor-pointer"
            >
              Non sostituisce il medico · Zero dati salvati sul sito.
            </button>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0D6E6E] rounded-lg hover:bg-[#0A5757] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Salva File Analisi (.json)
          </button>
          <button
            type="button"
            onClick={onEditParameters}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-stone-300 rounded-lg hover:border-[#0D6E6E] hover:text-[#0D6E6E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Modifica Parametri
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-stone-300 rounded-lg hover:border-[#0D6E6E] hover:text-[#0D6E6E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Stampa
          </button>
          <button
            type="button"
            onClick={onOpenResearch}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#0D6E6E] bg-teal-50/70 border border-teal-200 rounded-lg hover:bg-teal-100/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Fonti &amp; Parametri
          </button>
        </div>
      </section>

      {/* Historical Trajectory Evaluation (appears whenever a user uploaded a previous .json file) */}
      {historicalEvaluation && selectedBaselineRecord && (
        <HistoricalEvaluationPanel
          evaluation={historicalEvaluation}
          sortedTimeline={sortedTimeline}
          selectedBaselineId={selectedBaselineRecord.id}
          onSelectBaseline={setSelectedCompareId}
          onExportArchive={handleExport}
          onScrollToPlan={handleScrollToPlan}
        />
      )}

      {/* 3 Primary Clinical Scorecards */}
      <section aria-label="Indicatori di rischio clinico" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DomainScoreCard
          eyebrow="CARDIOVASCOLARE"
          title="Rischio Eventi CV (10 anni)"
          domain={result.cardiovascular}
          icon={<HeartPulse className="w-4 h-4" />}
          accentClass="bg-rose-50 text-rose-600"
          topBorderClass="border-t-rose-400"
        />
        <DomainScoreCard
          eyebrow="METABOLICO & DIABETE"
          title="Rischio Diabete Tipo 2"
          domain={result.metabolic}
          icon={<Droplets className="w-4 h-4" />}
          accentClass="bg-amber-50 text-amber-600"
          topBorderClass="border-t-amber-400"
        />
        <DomainScoreCard
          eyebrow="ONCOLOGIA PREVENTIVA"
          title="Indice Esposizione Oncologica"
          domain={result.oncologic}
          icon={<ShieldCheck className="w-4 h-4" />}
          accentClass="bg-teal-50 text-teal-700"
          topBorderClass="border-t-teal-500"
          actionLabel={`Esplora rischio per sede oncologica (${result.specificCancers?.length ?? 5} sedi) ↓`}
          onActionClick={handleScrollToSpecificCancers}
        />
      </section>

      {/* Personalized Advice Alerts (generated by getPersonalizedAdvice) */}
      <HealthAdvicePanel
        items={personalizedAdvice}
        onJumpToFactor={handleJumpToFactor}
      />

      {/* Organ-Specific Preventive Oncology Exposure & SSN Screening Section */}
      {result.specificCancers && result.specificCancers.length > 0 && (
        <SpecificCancerRiskSection
          sites={result.specificCancers}
          sex={profile.sex}
          age={profile.age}
          hasBowelRedFlag={Boolean(profile.persistentBowelChangeOrBleeding)}
          onJumpToFactor={handleJumpToFactor}
        />
      )}

      {/* Personalized "Where & How to Intervene" Plan + Live Combined Risk Simulator */}
      <InterventionPlanSection
        profile={profile}
        result={result}
        plan={interventionPlan}
        activeParams={activeParams}
        hasHistoryLoaded={Boolean(historicalEvaluation)}
        onEditParameters={onEditParameters}
      />

      {/* Unified Comparative & Longitudinal Analytics Section (Bar / Radar / Temporal LineChart) */}
      {populationComparison.length > 0 && (
        <section
          aria-labelledby="population-comparison-heading"
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-[0_1px_4px_rgba(15,23,42,0.03)]"
        >
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <h2
                id="population-comparison-heading"
                className="text-base font-semibold text-slate-900"
              >
                {comparisonChartType === 'timeline'
                  ? 'Andamento Temporale del Rischio (Confronto Record Storici)'
                  : 'Confronto con i Range della Popolazione Generale UE per Patologia'}
              </h2>
              <p className="text-xs text-slate-500 max-w-3xl">
                {comparisonChartType === 'timeline'
                  ? 'Visualizza come cambiano i tuoi indicatori di rischio nel tempo confrontando le rilevazioni salvate nel tuo file locale (.json) e l’analisi attuale.'
                  : `Confronto normalizzato (scala 0–100, valori più bassi indicano minor rischio) tra il tuo profilo, la mediana e il range tipico (25°–75° percentile) della popolazione generale europea per fascia d’età (${profile.age} anni) e sesso (${profile.sex === 'male' ? 'maschile' : 'femminile'}).`}
              </p>
            </div>

            <div
              role="group"
              aria-label="Selettore vista grafico analisi rischi"
              className="inline-flex flex-wrap items-center bg-slate-100 rounded-lg p-1 shrink-0 self-start gap-0.5"
            >
              <button
                type="button"
                onClick={() => setComparisonChartType('bar')}
                aria-pressed={comparisonChartType === 'bar'}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  comparisonChartType === 'bar'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Grafico a Barre
              </button>
              <button
                type="button"
                onClick={() => setComparisonChartType('radar')}
                aria-pressed={comparisonChartType === 'radar'}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  comparisonChartType === 'radar'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Grafico Radar
              </button>
              <button
                type="button"
                onClick={() => setComparisonChartType('timeline')}
                aria-pressed={comparisonChartType === 'timeline'}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  comparisonChartType === 'timeline'
                    ? 'bg-[#0D6E6E] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <CalendarClock className="w-3.5 h-3.5" />
                Andamento Temporale
                {sortedTimeline.length > 0 && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${
                      comparisonChartType === 'timeline'
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {sortedTimeline.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {comparisonChartType === 'timeline' ? (
            <RiskTimelineChart
              personalTimeline={personalTimeline}
              currentRecord={currentRecord}
              selectedCompareId={selectedCompareId}
              onSelectCompareId={setSelectedCompareId}
              onUploadFileClick={() => dashboardFileInputRef.current?.click()}
              onExportCurrentClick={handleExport}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div
                className="lg:col-span-7 w-full h-72"
                data-testid="population-comparison-chart"
              >
                <ResponsiveContainer width="100%" height="100%">
                  {comparisonChartType === 'bar' ? (
                    <BarChart
                      data={populationComparison}
                      margin={{ top: 8, right: 16, left: -12, bottom: 4 }}
                      barGap={6}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="shortLabel"
                        tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
                        axisLine={{ stroke: '#CBD5E1' }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: '#64748B', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || payload.length === 0) return null;
                          const row = payload[0]?.payload as PathologyPopulationComparison | undefined;
                          if (!row) return null;
                          return (
                            <div className="bg-white border border-slate-200 rounded-md p-3 shadow-sm text-xs space-y-1.5 max-w-xs">
                              <p className="font-semibold text-slate-900">{row.pathology}</p>
                              <p className="text-[11px] font-mono text-slate-500">{row.protocol}</p>
                              <div className="pt-1 border-t border-slate-100 space-y-1 font-mono tabular-nums">
                                <div className="flex justify-between gap-4">
                                  <span className="text-[#0D6E6E] font-semibold">Tuo Profilo:</span>
                                  <span className="text-slate-900 font-semibold">
                                    {row.userRawValue} ({row.userNormalized}/100)
                                  </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-600">Mediana UE:</span>
                                  <span className="text-slate-800">{row.populationMedianRaw}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-600">Range UE (25°–75°):</span>
                                  <span className="text-slate-800">{row.populationRangeRaw}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-emerald-700">Target Ottimale:</span>
                                  <span className="text-emerald-800">{row.optimalTargetRaw}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                        iconType="square"
                      />
                      <Bar
                        dataKey="userNormalized"
                        name="Tuo Profilo"
                        fill="#0D6E6E"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={36}
                      />
                      <Bar
                        dataKey="populationMedianNormalized"
                        name="Media Popolazione UE"
                        fill="#38BDF8"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={36}
                      />
                      <Bar
                        dataKey="populationHighNormalized"
                        name="Limite Sup. Range UE (75°)"
                        fill="#FED7AA"
                        radius={[5, 5, 0, 0]}
                        maxBarSize={36}
                      />
                    </BarChart>
                  ) : (
                    <RadarChart cx="50%" cy="50%" outerRadius="72%" data={populationComparison}>
                      <PolarGrid stroke="#CBD5E1" />
                      <PolarAngleAxis
                        dataKey="shortLabel"
                        tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fill: '#94A3B8', fontSize: 10 }}
                      />
                      <Radar
                        name="Limite Sup. Range UE (75°)"
                        dataKey="populationHighNormalized"
                        stroke="#F97316"
                        strokeDasharray="4 4"
                        fill="#FED7AA"
                        fillOpacity={0.25}
                      />
                      <Radar
                        name="Media Popolazione UE"
                        dataKey="populationMedianNormalized"
                        stroke="#0284C7"
                        strokeWidth={1.75}
                        fill="transparent"
                      />
                      <Radar
                        name="Tuo Profilo"
                        dataKey="userNormalized"
                        stroke="#0D6E6E"
                        strokeWidth={2.25}
                        fill="#0D6E6E"
                        fillOpacity={0.24}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload || payload.length === 0) return null;
                          const row = payload[0]?.payload as PathologyPopulationComparison | undefined;
                          if (!row) return null;
                          return (
                            <div className="bg-white border border-slate-200 rounded-md p-3 shadow-sm text-xs space-y-1">
                              <p className="font-semibold text-slate-900">{row.pathology}</p>
                              <p className="font-mono text-[#0D6E6E]">
                                Tuo Profilo: {row.userRawValue}
                              </p>
                              <p className="font-mono text-slate-600">
                                Range UE: {row.populationRangeRaw} (mediana {row.populationMedianRaw})
                              </p>
                            </div>
                          );
                        }}
                      />
                    </RadarChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Reference Ranges Summary Table */}
              <div className="lg:col-span-5 divide-y divide-slate-200 border border-slate-200 rounded-md bg-slate-50/50">
                {populationComparison.map((item) => {
                  const statusClass =
                    item.statusLabel === 'Sotto la media UE'
                      ? 'text-emerald-700'
                      : item.statusLabel === 'Nel range UE'
                        ? 'text-amber-700'
                        : 'text-rose-700';
                  const statusSymbol =
                    item.statusLabel === 'Sotto la media UE'
                      ? '●'
                      : item.statusLabel === 'Nel range UE'
                        ? '▲'
                        : '✖';

                  return (
                    <div key={item.id} className="p-4 space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900">{item.pathology}</p>
                        <span className={`text-xs font-semibold whitespace-nowrap ${statusClass}`}>
                          {statusSymbol} {item.statusLabel}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500">{item.protocol}</p>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-mono tabular-nums">
                      <div>
                        <span className="block text-[10px] font-sans text-slate-500">
                          Tuo Valore
                        </span>
                        <span className="font-semibold text-[#0D6E6E]">{item.userRawValue}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-sans text-slate-500">
                          Range Pop. UE
                        </span>
                        <span className="text-slate-700">{item.populationRangeRaw}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-sans text-slate-500">
                          Target Ottimale
                        </span>
                        <span className="text-emerald-700">{item.optimalTargetRaw}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}
        </section>
      )}

      {/* Radar Calibration & What-If Modifiable Simulator */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Radar Chart */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Profilo dei 6 Pilastri Preventivi (0–100)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Confronto tra il tuo punteggio attuale (linea blu piena) e il benchmark clinico
              OMS/WCRF (linea tratteggiata). Valori più alti indicano maggiore protezione.
            </p>
          </div>

          <div className="w-full h-72 mt-4" data-testid="risk-radar-chart">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="74%" data={result.radarData}>
                <PolarGrid stroke="#CBD5E1" />
                <PolarAngleAxis
                  dataKey="pillar"
                  tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: '#94A3B8', fontSize: 10 }}
                />
                <Radar
                  name="Target Linee Guida"
                  dataKey="guidelineTarget"
                  stroke="#F97316"
                  strokeDasharray="4 4"
                  fill="transparent"
                />
                <Radar
                  name="Tuo Profilo"
                  dataKey="userScore"
                  stroke="#0D6E6E"
                  strokeWidth={2.25}
                  fill="#0D6E6E"
                  fillOpacity={0.2}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Modifiable What-If Simulator */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Simulatore di Riduzione del Rischio Modificabile
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Impatto stimato dal modello clinico adottando singoli interventi validati sullo
                stile di vita, a parità di età e familiarità.
              </p>
            </div>

            {result.modifiableScenarios.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-200 rounded-md px-4">
                <p className="text-sm font-medium text-emerald-700">
                  ● Tutti i principali pilastri modificabili rientrano già nei target ottimali
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Mantieni l’aderenza attuale e programma i controlli periodici di fascia d’età.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {result.modifiableScenarios.map((scenario) => (
                  <div key={scenario.id} className="py-3.5 first:pt-1 last:pb-0 space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">{scenario.title}</h3>
                      <div className="flex items-center gap-3 text-xs font-mono tabular-nums font-semibold text-emerald-700 whitespace-nowrap">
                        {scenario.cvdDeltaPct < 0 && (
                          <span>CV {scenario.cvdDeltaPct.toFixed(1)}%</span>
                        )}
                        {scenario.diabetesDeltaPoints < 0 && (
                          <span>FINDRISC {scenario.diabetesDeltaPoints} pt</span>
                        )}
                        {scenario.oncologicDeltaIndex < 0 && (
                          <span>Onco {scenario.oncologicDeltaIndex} pt</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{scenario.description}</p>
                    <p className="text-[11px] font-mono text-slate-400">
                      Evidenza: {scenario.evidenceSource}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Principal Determinants Table */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            Determinanti Principali del Tuo Profilo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fattori ordinati per peso epidemiologico, distinguendo gli elementi modificabili da
            quelli non modificabili.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-6">Fattore Clinico</th>
                <th className="py-3 px-4">Impatto</th>
                <th className="py-3 px-4">Valore Attuale</th>
                <th className="py-3 px-4">Target Linee Guida</th>
                <th className="py-3 px-4 text-right">Natura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {result.drivers.map((driver) => {
                const impactText =
                  driver.impact === 'high_risk'
                    ? '✖ Rischio elevato'
                    : driver.impact === 'moderate_risk'
                      ? '▲ Rischio moderato'
                      : '● Protettivo';
                const impactColor =
                  driver.impact === 'high_risk'
                    ? 'text-rose-700'
                    : driver.impact === 'moderate_risk'
                      ? 'text-amber-700'
                      : 'text-emerald-700';

                return (
                  <tr key={driver.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-6">
                      <p className="font-medium text-slate-900">{driver.label}</p>
                      <p className="text-[11px] font-mono text-slate-400">{driver.citation}</p>
                    </td>
                    <td className={`py-3.5 px-4 text-xs font-semibold whitespace-nowrap ${impactColor}`}>
                      {impactText}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono tabular-nums text-slate-700">
                      {driver.currentValue}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">{driver.clinicalTarget}</td>
                    <td className="py-3.5 px-4 text-xs text-right text-slate-500 whitespace-nowrap">
                      {driver.modifiable ? 'Modificabile' : 'Non modificabile'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Personalized Results Guide & Screening Discussion */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Guida Operativa ai Risultati Ottenuti
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Priorità preventive personalizzate e punti pratici da condividere con il Medico di
              Medicina Generale.
            </p>
          </div>

          <div className="divide-y divide-slate-200">
            {result.guidanceActions.map((action, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    0{idx + 1}. {action.title}
                  </h3>
                  <span className="text-xs font-mono text-slate-500 whitespace-nowrap">
                    Priorità {action.priority} · {action.guideline}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{action.rationale}</p>
                <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                  <strong className="font-semibold text-slate-900">Con il tuo medico:</strong>{' '}
                  {action.clinicalDiscussionPoint}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Screening & Saved Local History */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
            <h2 className="text-base font-semibold text-slate-900">
              Promemoria Screening SSN / UE
            </h2>
            <p className="text-xs text-slate-500">
              In base ad età ({profile.age} anni), sesso ed esposizioni dichiarate:
            </p>
            <ul className="space-y-2.5 text-xs text-slate-700 leading-relaxed list-disc list-inside">
              {result.screeningNotes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4 shadow-sm">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Salva o Carica File Personale (.json)
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                <strong>Non salviamo i tuoi dati sul sito.</strong> Scarica sul tuo dispositivo un
                file datato con l’analisi attuale: in futuro (es. dopo aver smesso di fumare o
                iniziato a fare sport) potrai ricaricarlo e vedere l’andamento nel tempo.
              </p>
            </div>

            <div className="space-y-2.5">
              <label htmlFor="snapshotLabel" className="block text-xs font-medium text-slate-700">
                Nota opzionale per questa data
              </label>
              <input
                id="snapshotLabel"
                type="text"
                value={snapshotLabel}
                onChange={(e) => setSnapshotLabel(e.target.value)}
                placeholder="Es. Controllo dopo stop fumo"
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D6E6E]/20 focus:border-[#0D6E6E]"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-white bg-[#0D6E6E] rounded-lg hover:bg-[#0A5757] transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {personalTimeline.length > 0 ? 'Scarica Storico Aggiornato' : 'Scarica File (.json)'}
                </button>
                <button
                  type="button"
                  onClick={() => dashboardFileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-[#0D6E6E] bg-teal-50/70 border border-teal-200 rounded-lg hover:bg-teal-100/70 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  Carica File
                </button>
                <input
                  ref={dashboardFileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  aria-label="Carica un file personale ClinicaPrev"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onImportArchiveFile(file);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>

            {exportSuccess && (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {exportSuccess}
              </p>
            )}

            {importError && (
              <p role="alert" className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {importError}
              </p>
            )}

            {personalTimeline.length > 0 && (
              <div className="pt-3 border-t border-stone-100 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700">
                    Date presenti nel file caricato ({personalTimeline.length})
                  </p>
                  <button
                    type="button"
                    onClick={onClearTimeline}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-700 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Rimuovi dalla sessione
                  </button>
                </div>
                <ul className="divide-y divide-stone-100 max-h-44 overflow-y-auto">
                  {personalTimeline.map((entry) => (
                    <li key={entry.id} className="py-2 text-xs">
                      <p className="font-medium text-slate-900 truncate">
                        {entry.label}{' '}
                        <span className="font-mono text-[11px] text-slate-500">
                          ({new Date(entry.recordedAtIso).toLocaleDateString('it-IT')})
                        </span>
                      </p>
                      <p className="font-mono tabular-nums text-[11px] text-slate-500">
                        CV {entry.summary.cvdPct}% · FINDRISC {entry.summary.findriscPoints} · Onco{' '}
                        {entry.summary.oncologicIndex}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
