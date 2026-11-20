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
  TrendingDown,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
  buildLongitudinalSeries,
  computeLongitudinalDelta,
  createPersonalAnalysisRecord,
  type LongitudinalChartPoint,
  type LongitudinalMetricKey,
  type PersonalAnalysisRecord,
} from '../utils/personalArchiveFile';

interface RiskDashboardProps {
  profile: ClinicalProfileInput;
  result: ClinicalAssessmentResult;
  personalTimeline: PersonalAnalysisRecord[];
  importError: string | null;
  onEditParameters: () => void;
  onExportArchiveFile: (label: string) => void;
  onImportArchiveFile: (file: File) => void;
  onClearTimeline: () => void;
  onOpenLegal: () => void;
  onOpenResearch: () => void;
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
}: {
  eyebrow: string;
  title: string;
  domain: DomainRiskResult;
  icon: ReactNode;
  accentClass: string;
  topBorderClass: string;
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

      <div className="pt-3 border-t border-stone-100 space-y-1 text-xs text-slate-500">
        <p className="font-medium text-slate-700">{domain.protocolName}</p>
        <p className="font-mono text-[11px] text-slate-500">{domain.protocolReference}</p>
        {domain.assumptionsUsed.length > 0 && (
          <p className="text-[11px] text-slate-500 pt-1">{domain.assumptionsUsed[0]}</p>
        )}
      </div>
    </article>
  );
}

const LONGITUDINAL_METRIC_OPTIONS: Array<{
  key: LongitudinalMetricKey;
  label: string;
  shortLabel: string;
  unit: string;
  color: string;
  domain?: [number, number | 'auto'];
}> = [
  {
    key: 'all_normalized',
    label: 'Tutti i rischi (0–100)',
    shortLabel: 'Tutti (0–100)',
    unit: '/100',
    color: '#0D6E6E',
    domain: [0, 100],
  },
  {
    key: 'cvdPct',
    label: 'Cardiovascolare 10 anni (%)',
    shortLabel: 'Cardio (%)',
    unit: '%',
    color: '#E11D48',
    domain: [0, 'auto'],
  },
  {
    key: 'findriscPoints',
    label: 'Diabete FINDRISC (0–26 pt)',
    shortLabel: 'Diabete (pt)',
    unit: ' pt',
    color: '#F97316',
    domain: [0, 26],
  },
  {
    key: 'oncologicIndex',
    label: 'Indice Oncologico (/100)',
    shortLabel: 'Oncologico (/100)',
    unit: '/100',
    color: '#0D6E6E',
    domain: [0, 100],
  },
  {
    key: 'bmi',
    label: 'Indice Massa Corporea (BMI)',
    shortLabel: 'BMI',
    unit: ' kg/m²',
    color: '#0284C7',
    domain: [15, 'auto'],
  },
];

export function RiskDashboard({
  profile,
  result,
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
  const [selectedTimelineMetric, setSelectedTimelineMetric] =
    useState<LongitudinalMetricKey>('all_normalized');
  const [includeCurrentInTimeline, setIncludeCurrentInTimeline] = useState(true);
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

  // Auto-select timeline view & latest historical checkpoint when a file is newly loaded
  useEffect(() => {
    if (sortedTimeline.length > 0) {
      setComparisonChartType('timeline');
      setSelectedCompareId((prev) =>
        sortedTimeline.some((r) => r.id === prev)
          ? prev
          : sortedTimeline[sortedTimeline.length - 1].id
      );
    } else {
      setSelectedCompareId('');
      setComparisonChartType((prev) => (prev === 'timeline' ? 'bar' : prev));
    }
  }, [sortedTimeline]);

  const currentRecord = useMemo(
    () => createPersonalAnalysisRecord(profile, result, 'Analisi attuale'),
    [profile, result]
  );

  const selectedBaselineRecord = useMemo(() => {
    if (sortedTimeline.length === 0) return null;
    return (
      sortedTimeline.find((r) => r.id === selectedCompareId) ??
      sortedTimeline[sortedTimeline.length - 1]
    );
  }, [sortedTimeline, selectedCompareId]);

  const longitudinalDelta = useMemo(
    () =>
      selectedBaselineRecord
        ? computeLongitudinalDelta(selectedBaselineRecord, currentRecord)
        : null,
    [selectedBaselineRecord, currentRecord]
  );

  const longitudinalChartData = useMemo(
    () => buildLongitudinalSeries(sortedTimeline, currentRecord, includeCurrentInTimeline),
    [sortedTimeline, currentRecord, includeCurrentInTimeline]
  );

  const activeMetricConfig =
    LONGITUDINAL_METRIC_OPTIONS.find((m) => m.key === selectedTimelineMetric) ??
    LONGITUDINAL_METRIC_OPTIONS[0];

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

      {/* Longitudinal Delta Summary Strip (appears whenever a user uploaded a previous .json file) */}
      {longitudinalDelta && (
        <section
          aria-labelledby="longitudinal-heading"
          className="bg-white border border-emerald-200 rounded-2xl p-6 space-y-5 shadow-sm"
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-stone-100 pb-4">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-700">
                <TrendingDown className="w-4 h-4" />
                CONFRONTO NEL TEMPO · FILE PERSONALE CARICATO ({sortedTimeline.length}{' '}
                {sortedTimeline.length === 1 ? 'rilevazione storica' : 'rilevazioni storiche'})
              </p>
              <h2 id="longitudinal-heading" className="text-lg font-bold text-slate-900">
                Come cambia il tuo profilo rispetto al{' '}
                {new Date(longitudinalDelta.previousRecord.recordedAtIso).toLocaleDateString('it-IT', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <p className="text-xs text-slate-600">
                Confronto tra la rilevazione selezionata dal tuo file locale e il calcolo attuale.
                Esplora il grafico a linee completo qui sotto o scarica il file storico aggiornato.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {sortedTimeline.length > 1 && (
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="baselineCompareSelect"
                    className="text-xs font-medium text-slate-600 whitespace-nowrap"
                  >
                    Confronta con:
                  </label>
                  <select
                    id="baselineCompareSelect"
                    value={selectedBaselineRecord?.id ?? ''}
                    onChange={(e) => setSelectedCompareId(e.target.value)}
                    className="px-2.5 py-2 text-xs font-medium bg-[#FAF9F5] border border-stone-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D6E6E]/20 focus:border-[#0D6E6E] cursor-pointer"
                  >
                    {sortedTimeline.map((rec) => {
                      const d = new Date(rec.recordedAtIso).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                      return (
                        <option key={rec.id} value={rec.id}>
                          {d} — {rec.label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Scarica File Storico Aggiornato (.json)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Cardiovascolare (10 anni)',
                prev: `${longitudinalDelta.previousRecord.summary.cvdPct}%`,
                curr: `${longitudinalDelta.currentRecord.summary.cvdPct}%`,
                delta: longitudinalDelta.cvdDeltaPct,
                unit: '%',
              },
              {
                label: 'Diabete Tipo 2 (FINDRISC)',
                prev: `${longitudinalDelta.previousRecord.summary.findriscPoints} pt`,
                curr: `${longitudinalDelta.currentRecord.summary.findriscPoints} pt`,
                delta: longitudinalDelta.findriscDeltaPoints,
                unit: ' pt',
              },
              {
                label: 'Indice Oncologico',
                prev: `${longitudinalDelta.previousRecord.summary.oncologicIndex}/100`,
                curr: `${longitudinalDelta.currentRecord.summary.oncologicIndex}/100`,
                delta: longitudinalDelta.oncologicDeltaIndex,
                unit: ' pt',
              },
              {
                label: 'Indice Massa Corporea (BMI)',
                prev: `${longitudinalDelta.previousRecord.summary.bmi}`,
                curr: `${longitudinalDelta.currentRecord.summary.bmi}`,
                delta: longitudinalDelta.bmiDelta,
                unit: '',
              },
            ].map((item) => {
              const improved = item.delta < 0;
              const unchanged = item.delta === 0;
              return (
                <div
                  key={item.label}
                  className="rounded-xl bg-[#FAF9F5] border border-stone-200 p-4 space-y-1.5"
                >
                  <p className="text-[11px] font-medium text-slate-600">{item.label}</p>
                  <p className="text-sm font-mono font-semibold text-slate-900 tabular-nums">
                    {item.prev} → {item.curr}
                  </p>
                  <span
                    className={`inline-block text-xs font-mono font-bold tabular-nums ${
                      improved
                        ? 'text-emerald-700'
                        : unchanged
                          ? 'text-slate-500'
                          : 'text-rose-700'
                    }`}
                  >
                    {item.delta > 0 ? `+${item.delta}` : item.delta}
                    {item.unit}{' '}
                    {improved ? '(Migliorato)' : unchanged ? '(Stabile)' : '(In aumento)'}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
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
        />
      </section>

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
            sortedTimeline.length === 0 ? (
              <div className="rounded-xl bg-[#FAF9F5] border border-dashed border-stone-300 p-8 text-center space-y-3">
                <CalendarClock className="w-8 h-8 text-[#0D6E6E] mx-auto" />
                <div className="space-y-1 max-w-lg mx-auto">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Nessun file storico caricato in questa sessione
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Per visualizzare il grafico a linee dell’andamento temporale del rischio, carica
                    un tuo file analisi precedente (<code>.json</code>). Tutti i dati restano solo
                    sul tuo dispositivo e non vengono mai salvati sul sito.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => dashboardFileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0D6E6E] rounded-lg hover:bg-[#0A5656] transition-colors cursor-pointer"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    Carica File Storico (.json)
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0D6E6E] bg-white border border-teal-200 rounded-lg hover:bg-teal-50/70 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Salva l’Analisi di Oggi come Punto di Partenza
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Metric Selector & Current Analysis Toggle */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#FAF9F5] border border-stone-200/80 rounded-xl p-3">
                  <div
                    role="group"
                    aria-label="Selettore indicatore grafico temporale"
                    className="flex flex-wrap items-center gap-1.5"
                  >
                    {LONGITUDINAL_METRIC_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setSelectedTimelineMetric(opt.key)}
                        aria-pressed={selectedTimelineMetric === opt.key}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                          selectedTimelineMetric === opt.key
                            ? 'bg-white text-[#0D6E6E] font-semibold border border-teal-200 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
                        }`}
                      >
                        {opt.shortLabel}
                      </button>
                    ))}
                  </div>

                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none shrink-0 px-1">
                    <input
                      type="checkbox"
                      checked={includeCurrentInTimeline}
                      onChange={(e) => setIncludeCurrentInTimeline(e.target.checked)}
                      className="rounded border-stone-300 text-[#0D6E6E] focus:ring-[#0D6E6E]"
                    />
                    Includi analisi attuale (“Oggi”)
                  </label>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Recharts LineChart */}
                  <div
                    className="lg:col-span-8 w-full h-72"
                    data-testid="longitudinal-line-chart"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={longitudinalChartData}
                        margin={{ top: 10, right: 20, left: -6, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                        <XAxis
                          dataKey="dateLabel"
                          tick={{ fontSize: 11, fill: '#475569' }}
                          axisLine={{ stroke: '#CBD5E1' }}
                          tickLine={false}
                        />
                        <YAxis
                          domain={activeMetricConfig.domain}
                          tick={{ fontSize: 11, fill: '#64748B' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload || payload.length === 0) return null;
                            const pt = payload[0]?.payload as LongitudinalChartPoint | undefined;
                            if (!pt) return null;
                            return (
                              <div className="bg-white border border-stone-200 rounded-lg p-3 shadow-sm text-xs space-y-1.5 max-w-xs">
                                <p className="font-semibold text-slate-900">
                                  {pt.label} {pt.isCurrent ? '(Attuale)' : ''}
                                </p>
                                <p className="text-[11px] font-mono text-slate-500">
                                  {pt.fullDate}
                                </p>
                                <div className="pt-1 border-t border-stone-100 space-y-1 font-mono tabular-nums">
                                  <div className="flex justify-between gap-4">
                                    <span className="text-rose-700">Cardiovascolare:</span>
                                    <span className="font-semibold text-slate-900">
                                      {pt.cvdPct}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-orange-700">Diabete FINDRISC:</span>
                                    <span className="font-semibold text-slate-900">
                                      {pt.findriscPoints} / 26 pt
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-[#0D6E6E]">Indice Oncologico:</span>
                                    <span className="font-semibold text-slate-900">
                                      {pt.oncologicIndex} / 100
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-sky-700">BMI:</span>
                                    <span className="font-semibold text-slate-900">
                                      {pt.bmi} kg/m²
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />

                        {selectedTimelineMetric === 'all_normalized' ? (
                          <>
                            <Line
                              type="monotone"
                              dataKey="oncologicNormalized"
                              name="Oncologico (0–100)"
                              stroke="#0D6E6E"
                              strokeWidth={2.5}
                              dot={{ r: 4, strokeWidth: 2 }}
                              activeDot={{ r: 6 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="findriscNormalized"
                              name="Diabete FINDRISC (norm. 0–100)"
                              stroke="#F97316"
                              strokeWidth={2.5}
                              dot={{ r: 4, strokeWidth: 2 }}
                              activeDot={{ r: 6 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="cvdNormalized"
                              name="Cardiovascolare (norm. 0–100)"
                              stroke="#E11D48"
                              strokeWidth={2.5}
                              dot={{ r: 4, strokeWidth: 2 }}
                              activeDot={{ r: 6 }}
                            />
                          </>
                        ) : (
                          <Line
                            type="monotone"
                            dataKey={selectedTimelineMetric}
                            name={activeMetricConfig.label}
                            stroke={activeMetricConfig.color}
                            strokeWidth={2.75}
                            dot={{ r: 5, strokeWidth: 2 }}
                            activeDot={{ r: 7 }}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Historical Records Checkpoints List */}
                  <div className="lg:col-span-4 border border-stone-200 rounded-xl bg-[#FAF9F5]/80 divide-y divide-stone-200 max-h-72 overflow-y-auto">
                    <div className="px-4 py-2.5 bg-stone-100/70">
                      <p className="text-[11px] font-mono font-semibold text-slate-600 uppercase">
                        Record storici nel file ({sortedTimeline.length})
                      </p>
                    </div>
                    {sortedTimeline.map((rec) => {
                      const isSelected = selectedBaselineRecord?.id === rec.id;
                      return (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={() => setSelectedCompareId(rec.id)}
                          className={`w-full text-left px-4 py-3 space-y-1 transition-colors cursor-pointer ${
                            isSelected ? 'bg-teal-50/70' : 'hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {rec.label}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-mono font-semibold text-[#0D6E6E] bg-teal-100 px-1.5 py-0.5 rounded shrink-0">
                                In confronto
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-slate-500">
                            {new Date(rec.recordedAtIso).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-[11px] font-mono text-slate-700 tabular-nums">
                            CV {rec.summary.cvdPct}% · Diab {rec.summary.findriscPoints}pt · Onco{' '}
                            {rec.summary.oncologicIndex} · BMI {rec.summary.bmi}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )
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
