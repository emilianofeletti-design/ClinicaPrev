import { ArrowDown, Download, TrendingDown, TrendingUp } from 'lucide-react';
import type { HistoricalTrajectoryEvaluation } from '../utils/interventionPlanner';
import type { PersonalAnalysisRecord } from '../utils/personalArchiveFile';

interface HistoricalEvaluationPanelProps {
  evaluation: HistoricalTrajectoryEvaluation;
  sortedTimeline: PersonalAnalysisRecord[];
  selectedBaselineId: string;
  onSelectBaseline: (id: string) => void;
  onExportArchive: () => void;
  onScrollToPlan: () => void;
}

function getVerdictClasses(verdict: HistoricalTrajectoryEvaluation['verdict']): {
  borderClass: string;
  textClass: string;
  accentBgClass: string;
} {
  switch (verdict) {
    case 'improving':
      return {
        borderClass: 'border-emerald-200',
        textClass: 'text-emerald-700',
        accentBgClass: 'bg-emerald-50/50',
      };
    case 'partial_improvement':
      return {
        borderClass: 'border-teal-200',
        textClass: 'text-[#0D6E6E]',
        accentBgClass: 'bg-teal-50/40',
      };
    case 'worsening':
      return {
        borderClass: 'border-rose-200',
        textClass: 'text-rose-700',
        accentBgClass: 'bg-rose-50/40',
      };
    case 'stable':
      return {
        borderClass: 'border-stone-200',
        textClass: 'text-slate-700',
        accentBgClass: 'bg-stone-50/70',
      };
  }
}

export function HistoricalEvaluationPanel({
  evaluation,
  sortedTimeline,
  selectedBaselineId,
  onSelectBaseline,
  onExportArchive,
  onScrollToPlan,
}: HistoricalEvaluationPanelProps) {
  const { delta } = evaluation;
  const style = getVerdictClasses(evaluation.verdict);
  const baselineDateText = new Date(delta.previousRecord.recordedAtIso).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const metricItems = [
    {
      label: 'Cardiovascolare (10 anni)',
      prev: `${delta.previousRecord.summary.cvdPct}%`,
      curr: `${delta.currentRecord.summary.cvdPct}%`,
      diff: delta.cvdDeltaPct,
      unit: '%',
    },
    {
      label: 'Diabete Tipo 2 (FINDRISC)',
      prev: `${delta.previousRecord.summary.findriscPoints} pt`,
      curr: `${delta.currentRecord.summary.findriscPoints} pt`,
      diff: delta.findriscDeltaPoints,
      unit: ' pt',
    },
    {
      label: 'Indice Oncologico',
      prev: `${delta.previousRecord.summary.oncologicIndex}/100`,
      curr: `${delta.currentRecord.summary.oncologicIndex}/100`,
      diff: delta.oncologicDeltaIndex,
      unit: ' pt',
    },
    {
      label: 'Indice Massa Corporea (BMI)',
      prev: `${delta.previousRecord.summary.bmi}`,
      curr: `${delta.currentRecord.summary.bmi}`,
      diff: delta.bmiDelta,
      unit: '',
    },
  ];

  return (
    <section
      aria-labelledby="historical-evaluation-heading"
      data-testid="historical-evaluation-panel"
      className={`scroll-mt-32 bg-white border ${style.borderClass} rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,0.03)]`}
    >
      {/* Top Verdict & Controls */}
      <div className={`px-4 sm:px-6 py-5 border-b border-stone-200 ${style.accentBgClass}`}>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
              <span className={`inline-flex items-center gap-1.5 font-semibold ${style.textClass}`}>
                {evaluation.verdict === 'worsening' ? (
                  <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                {evaluation.verdictSymbol} {evaluation.verdictLabel}
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="font-mono text-slate-600 tabular-nums">
                Storico caricato ({evaluation.totalRecordsAnalyzed}{' '}
                {evaluation.totalRecordsAnalyzed === 1 ? 'rilevazione' : 'rilevazioni'})
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="font-mono text-slate-600">Intervallo: {evaluation.elapsedLabel}</span>
            </div>

            <h2
              id="historical-evaluation-heading"
              className="text-lg font-bold tracking-tight text-slate-900"
            >
              Valutazione dello Storico: {evaluation.headline}
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">{evaluation.narrativeSummary}</p>
            {evaluation.overallSpanSummary && (
              <p className="text-xs font-mono text-slate-600 pt-0.5">
                {evaluation.overallSpanSummary}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 w-full lg:w-auto lg:shrink-0 min-w-0">
            {sortedTimeline.length > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto min-w-0">
                <label
                  htmlFor="baselineCompareSelect"
                  className="text-xs font-medium text-slate-700 whitespace-nowrap"
                >
                  Confronta con:
                </label>
                <select
                  id="baselineCompareSelect"
                  value={selectedBaselineId}
                  onChange={(e) => onSelectBaseline(e.target.value)}
                  className="w-full sm:w-auto max-w-full min-w-0 px-2.5 py-2 text-xs font-medium bg-white border border-stone-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0D6E6E]/20 focus:border-[#0D6E6E] cursor-pointer"
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
              onClick={onExportArchive}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0D6E6E] rounded-lg hover:bg-[#0A5757] transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Scarica Storico Aggiornato (.json)
            </button>
          </div>
        </div>
      </div>

      {/* 4-Column Tabular Delta Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-stone-200 border-b border-stone-200">
        {metricItems.map((item) => {
          const improved = item.diff < 0;
          const unchanged = item.diff === 0;
          return (
            <div key={item.label} className="px-5 py-4 space-y-1">
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className="text-sm font-mono font-semibold text-slate-900 tabular-nums">
                {item.prev} → {item.curr}
              </p>
              <p
                className={`text-xs font-mono font-semibold tabular-nums ${
                  improved
                    ? 'text-emerald-700'
                    : unchanged
                      ? 'text-slate-500'
                      : 'text-rose-700'
                }`}
              >
                {item.diff > 0 ? `+${item.diff}` : item.diff}
                {item.unit}{' '}
                {improved ? '● Migliorato' : unchanged ? '◆ Stabile' : '✖ In aumento'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Factor-by-Factor Historical Breakdown */}
      {(evaluation.improvedFactors.length > 0 || evaluation.worsenedFactors.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-stone-200 border-b border-stone-200">
          <div className="p-6 space-y-3">
            <h3 className="text-xs font-semibold text-emerald-800">
              ● Progressi consolidati rispetto al {baselineDateText}
            </h3>
            {evaluation.improvedFactors.length === 0 ? (
              <p className="text-xs text-slate-500 leading-relaxed">
                Nessun fattore modificabile risulta ancora migliorato in modo significativo rispetto
                alla data selezionata.
              </p>
            ) : (
              <ul className="space-y-3">
                {evaluation.improvedFactors.map((item) => (
                  <li key={item.factorKey} className="space-y-0.5 text-xs">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold text-slate-900">{item.label}</span>
                      <span className="font-mono tabular-nums text-emerald-700">
                        {item.previousValue} → {item.currentValue}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{item.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-6 space-y-3">
            <h3 className="text-xs font-semibold text-rose-800">
              ▲ Aree peggiorate o su cui intervenire ora
            </h3>
            {evaluation.worsenedFactors.length === 0 ? (
              <p className="text-xs text-slate-600 leading-relaxed">
                Nessuna regressione rilevata nei fattori modificabili rispetto al {baselineDateText}.
                Continua con la routine attuale e controlla nel piano sotto se restano obiettivi
                residui.
              </p>
            ) : (
              <ul className="space-y-3">
                {evaluation.worsenedFactors.map((item) => (
                  <li key={item.factorKey} className="space-y-0.5 text-xs">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold text-slate-900">{item.label}</span>
                      <span className="font-mono tabular-nums text-rose-700">
                        {item.previousValue} → {item.currentValue}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{item.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Next-Step Recommendation Footer */}
      <div className="px-6 py-4 bg-[#FAF9F5]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-700 leading-relaxed">
          <strong className="font-semibold text-slate-900">Indicazione operativa:</strong>{' '}
          {evaluation.nextFocusRecommendation}
        </p>
        <button
          type="button"
          onClick={onScrollToPlan}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0D6E6E] bg-white border border-teal-200 rounded-lg hover:bg-teal-50/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
        >
          Vai al Piano d’Azione
          <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
