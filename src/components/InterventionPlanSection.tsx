import { CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ClinicalAssessmentResult, ClinicalProfileInput } from '../types/clinical';
import type { ClinicalParameterSet } from '../utils/clinicalParameters';
import {
  simulateSelectedInterventions,
  type InterventionArea,
  type InterventionPriority,
  type PersonalizedIntervention,
  type PersonalizedInterventionPlan,
} from '../utils/interventionPlanner';

interface InterventionPlanSectionProps {
  profile: ClinicalProfileInput;
  result: ClinicalAssessmentResult;
  plan: PersonalizedInterventionPlan;
  activeParams: ClinicalParameterSet;
  hasHistoryLoaded: boolean;
  onEditParameters: () => void;
}

type FilterOption = 'all' | 'alta' | InterventionArea;

function getPriorityPresentation(priority: InterventionPriority): {
  symbol: string;
  label: string;
  className: string;
} {
  switch (priority) {
    case 'alta':
      return { symbol: '✖', label: 'Priorità alta', className: 'text-rose-700' };
    case 'media':
      return { symbol: '▲', label: 'Priorità media', className: 'text-amber-700' };
    case 'mantenimento':
      return { symbol: '●', label: 'Completamento / Mantenimento', className: 'text-[#0D6E6E]' };
  }
}

function formatDeltaSummary(item: PersonalizedIntervention): string[] {
  const parts: string[] = [];
  if (item.simulatedDelta.cvdDeltaPct < 0) {
    parts.push(`CV ${item.simulatedDelta.cvdDeltaPct.toFixed(1)}%`);
  }
  if (item.simulatedDelta.findriscDeltaPoints < 0) {
    parts.push(`FINDRISC ${item.simulatedDelta.findriscDeltaPoints} pt`);
  }
  if (item.simulatedDelta.oncologicDeltaIndex < 0) {
    parts.push(`Oncologico ${item.simulatedDelta.oncologicDeltaIndex} pt`);
  }
  return parts;
}

export function InterventionPlanSection({
  profile,
  result,
  plan,
  activeParams,
  hasHistoryLoaded,
  onEditParameters,
}: InterventionPlanSectionProps) {
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>(plan.defaultSelectedIds);

  // Sync default simulation selection whenever the underlying profile or active params change
  useEffect(() => {
    setSelectedIds(plan.defaultSelectedIds);
    setSelectedFilter('all');
  }, [plan.defaultSelectedIds]);

  const simulation = useMemo(
    () =>
      simulateSelectedInterventions(
        profile,
        result,
        plan.interventions,
        selectedIds,
        activeParams
      ),
    [profile, result, plan.interventions, selectedIds, activeParams]
  );

  const filterCounts = useMemo(() => {
    return {
      all: plan.interventions.length,
      alta: plan.interventions.filter((i) => i.priority === 'alta').length,
      stile_vita: plan.interventions.filter((i) => i.area === 'stile_vita').length,
      alimentazione: plan.interventions.filter((i) => i.area === 'alimentazione').length,
      parametri_clinici: plan.interventions.filter((i) => i.area === 'parametri_clinici').length,
    };
  }, [plan.interventions]);

  const visibleInterventions = useMemo(() => {
    if (selectedFilter === 'all') return plan.interventions;
    if (selectedFilter === 'alta') {
      return plan.interventions.filter((i) => i.priority === 'alta');
    }
    return plan.interventions.filter((i) => i.area === selectedFilter);
  }, [plan.interventions, selectedFilter]);

  const simulatableCount = useMemo(
    () => plan.interventions.filter((i) => i.simulatable).length,
    [plan.interventions]
  );

  const toggleIntervention = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const allFilterButtons: Array<{ key: FilterOption; label: string; count: number }> = [
    { key: 'all', label: 'Tutte', count: filterCounts.all },
    { key: 'alta', label: 'Priorità alta', count: filterCounts.alta },
    { key: 'stile_vita', label: 'Stile di vita', count: filterCounts.stile_vita },
    { key: 'alimentazione', label: 'Alimentazione & Peso', count: filterCounts.alimentazione },
    { key: 'parametri_clinici', label: 'Parametri & Esami', count: filterCounts.parametri_clinici },
  ];
  const filterButtons = allFilterButtons.filter((btn) => btn.key === 'all' || btn.count > 0);

  return (
    <section
      id="piano-intervento"
      aria-labelledby="intervention-plan-heading"
      data-testid="intervention-plan-section"
      className="scroll-mt-32 bg-white border border-stone-200 rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(15,23,42,0.03)]"
    >
      {/* Header */}
      <div className="px-4 sm:px-6 py-5 border-b border-stone-200 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-mono text-[#0D6E6E]">
            Piano personalizzato dai tuoi dati{hasHistoryLoaded ? ' · Integrato con lo storico' : ''}
          </p>
          <h2
            id="intervention-plan-heading"
            className="text-lg font-bold tracking-tight text-slate-900"
          >
            Dove e Come Intervenire per Migliorare i Fattori di Rischio
          </h2>
          <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
            Ogni leva qui sotto parte esattamente dai valori che hai inserito, indica il divario
            rispetto alle linee guida (ESC, OMS, WCRF/AICR) e propone passi pratici concreti. Spunta
            gli obiettivi per simulare la riduzione combinata del rischio.
          </p>
        </div>

        <button
          type="button"
          onClick={onEditParameters}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-[#FAF9F5] border border-stone-300 rounded-lg hover:border-[#0D6E6E] hover:text-[#0D6E6E] transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
          Aggiorna i tuoi dati
        </button>
      </div>

      {/* Optimal State Banner OR Live Combined Impact Simulator */}
      {plan.isAlreadyOptimal ? (
        <div className="px-6 py-6 bg-emerald-50/40 border-b border-stone-200 space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900">
                ● Profilo preventivo già ottimale sui principali fattori modificabili
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                I parametri inseriti rientrano già nelle soglie protettive per tabacco, pressione,
                peso, movimento, alcol e alimentazione. L’obiettivo prioritario è mantenere questa
                continuità nel tempo e rispettare gli screening di fascia d’età.
              </p>
            </div>
          </div>
        </div>
      ) : (
        simulatableCount > 0 && (
          <div
            data-testid="combined-simulation-bar"
            className="px-6 py-5 bg-[#FAF9F5] border-b border-stone-200 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-900">
                  Impatto combinato stimato ({simulation.selectedCount} su {simulatableCount} leve
                  selezionate)
                </p>
                <p className="text-xs text-slate-500">
                  Simulazione ricalcolata dal modello clinico mantenendo invariati età, sesso e
                  familiarità.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedIds(plan.defaultSelectedIds)}
                  className="font-medium text-[#0D6E6E] hover:underline whitespace-nowrap cursor-pointer"
                >
                  Seleziona priorità
                </button>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="font-medium text-slate-600 hover:text-slate-900 hover:underline whitespace-nowrap cursor-pointer"
                >
                  Azzera selezione
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200 bg-white border border-stone-200 rounded-lg">
              <div className="px-4 py-3 space-y-0.5">
                <p className="text-xs text-slate-500">Cardiovascolare (10 anni)</p>
                <div className="flex items-baseline justify-between gap-2 font-mono tabular-nums">
                  <span className="text-sm font-semibold text-slate-900">
                    {simulation.baseCvdPct.toFixed(1)}% → {simulation.projectedCvdPct.toFixed(1)}%
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      simulation.cvdDeltaPct < 0 ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {simulation.cvdDeltaPct < 0
                      ? `${simulation.cvdDeltaPct.toFixed(1)}%`
                      : 'Invariato'}
                  </span>
                </div>
              </div>

              <div className="px-4 py-3 space-y-0.5">
                <p className="text-xs text-slate-500">Diabete Tipo 2 (FINDRISC)</p>
                <div className="flex items-baseline justify-between gap-2 font-mono tabular-nums">
                  <span className="text-sm font-semibold text-slate-900">
                    {simulation.baseFindrisc} pt → {simulation.projectedFindrisc} pt
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      simulation.findriscDeltaPoints < 0 ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {simulation.findriscDeltaPoints < 0
                      ? `${simulation.findriscDeltaPoints} pt`
                      : 'Invariato'}
                  </span>
                </div>
              </div>

              <div className="px-4 py-3 space-y-0.5">
                <p className="text-xs text-slate-500">Indice Oncologico</p>
                <div className="flex items-baseline justify-between gap-2 font-mono tabular-nums">
                  <span className="text-sm font-semibold text-slate-900">
                    {simulation.baseOnco}/100 → {simulation.projectedOnco}/100
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      simulation.oncologicDeltaIndex < 0 ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {simulation.oncologicDeltaIndex < 0
                      ? `${simulation.oncologicDeltaIndex} pt`
                      : 'Invariato'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Segmented Filter Bar */}
      {plan.interventions.length > 1 && (
        <div className="px-6 py-3.5 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Filtra gli interventi per priorità o area"
            className="inline-flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-lg"
          >
            {filterButtons.map((btn) => (
              <button
                key={btn.key}
                type="button"
                onClick={() => setSelectedFilter(btn.key)}
                aria-pressed={selectedFilter === btn.key}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedFilter === btn.key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {btn.label}{' '}
                <span className="font-mono tabular-nums text-slate-400">({btn.count})</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-500 font-mono tabular-nums">
            {visibleInterventions.length}{' '}
            {visibleInterventions.length === 1 ? 'azione mostrata' : 'azioni mostrate'}
          </p>
        </div>
      )}

      {/* Actionable Interventions List */}
      {visibleInterventions.length > 0 && (
        <div className="divide-y divide-stone-200">
          {visibleInterventions.map((item, idx) => {
            const priorityStyle = getPriorityPresentation(item.priority);
            const deltaBadges = formatDeltaSummary(item);
            const isChecked = selectedIds.includes(item.id);
            const editorialIdx = String(idx + 1).padStart(2, '0');

            return (
              <article
                key={item.id}
                data-testid={`intervention-item-${item.factorKey}`}
                className="px-4 sm:px-6 py-5 space-y-4 hover:bg-[#FAF9F5]/40 transition-colors"
              >
                {/* Title Row + Individual Impact */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {item.simulatable ? (
                      <input
                        id={`sim-${item.id}`}
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleIntervention(item.id)}
                        aria-label={`Includi "${item.whereToAct}" nella simulazione`}
                        className="mt-1 h-4 w-4 rounded border-stone-300 text-[#0D6E6E] focus:ring-[#0D6E6E] cursor-pointer shrink-0"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="mt-1.5 w-4 text-center text-xs font-mono text-slate-400 shrink-0"
                      >
                        —
                      </span>
                    )}

                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                        <label
                          htmlFor={item.simulatable ? `sim-${item.id}` : undefined}
                          className={item.simulatable ? 'cursor-pointer' : undefined}
                        >
                          {editorialIdx}. {item.whereToAct}
                        </label>
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                        <span className={`font-semibold ${priorityStyle.className}`}>
                          {priorityStyle.symbol} {priorityStyle.label}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Impatto su: {item.domains.join(', ')}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {item.evidence}
                        </span>
                      </div>

                      {item.historicalContext && (
                        <p
                          className={`text-xs font-medium pt-0.5 ${
                            item.historicalContext.direction === 'worsened'
                              ? 'text-rose-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          Storico: {item.historicalContext.label}
                        </p>
                      )}
                    </div>
                  </div>

                  {deltaBadges.length > 0 && (
                    <div className="sm:pl-7 lg:pl-0 flex flex-wrap items-center gap-2 text-xs font-mono font-semibold tabular-nums text-emerald-700 shrink-0">
                      {deltaBadges.map((text, badgeIdx) => (
                        <span key={text} className="whitespace-nowrap">
                          {badgeIdx > 0 && (
                            <span aria-hidden="true" className="text-slate-300 mr-2">
                              ·
                            </span>
                          )}
                          {text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current vs Target Row */}
                <div className="sm:pl-7 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#FAF9F5] border border-stone-200/80 rounded-lg px-3.5 py-2.5 space-y-0.5">
                    <p className="text-slate-500">Dato inserito oggi</p>
                    <p className="font-mono font-semibold text-slate-900 tabular-nums">
                      {item.currentState}
                    </p>
                  </div>
                  <div className="bg-teal-50/40 border border-teal-200/70 rounded-lg px-3.5 py-2.5 space-y-0.5">
                    <p className="text-[#0D6E6E]">Obiettivo consigliato</p>
                    <p className="font-mono font-semibold text-slate-900 tabular-nums">
                      {item.targetGoal}
                    </p>
                  </div>
                </div>

                {/* Rationale + Practical Steps */}
                <div className="sm:pl-7 space-y-2.5">
                  <p className="text-xs text-slate-600 leading-relaxed">{item.whyItMatters}</p>

                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-slate-800">
                      Come intervenire in pratica:
                    </p>
                    <ol className="space-y-1.5 text-xs text-slate-700 leading-relaxed list-decimal list-inside">
                      {item.howToSteps.map((step, stepIdx) => (
                        <li key={stepIdx}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {item.doctorNote && (
                    <p className="text-xs text-slate-700 bg-stone-50 border border-stone-200 rounded-lg px-3.5 py-2 leading-relaxed">
                      <strong className="font-semibold text-slate-900">Con il tuo medico:</strong>{' '}
                      {item.doctorNote}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Protective Strengths Footer */}
      {plan.protectiveStrengths.length > 0 && (
        <div className="px-6 py-4 bg-emerald-50/30 border-t border-stone-200 space-y-1.5">
          <p className="text-xs font-semibold text-emerald-800">
            ● Punti di forza già attivi nel tuo profilo (da mantenere)
          </p>
          <p className="text-xs text-slate-700 leading-relaxed">
            {plan.protectiveStrengths.join(' · ')}
          </p>
        </div>
      )}
    </section>
  );
}
