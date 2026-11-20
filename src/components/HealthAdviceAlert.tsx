import {
  Activity,
  ArrowDownRight,
  CigaretteOff,
  Droplets,
  FlaskConical,
  HeartPulse,
  Leaf,
  Moon,
  Scale,
  ShieldCheck,
  WineOff,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import type { FactorKey } from '../utils/interventionPlanner';

export type AdviceSeverity = 'urgent' | 'warning' | 'info' | 'positive';

export type AdviceIconCategory =
  | 'hypertension'
  | 'smoking'
  | 'activity'
  | 'weight'
  | 'glucose'
  | 'alcohol'
  | 'nutrition'
  | 'lipids'
  | 'sleep_uv'
  | 'protective';

export interface PersonalizedAdviceItem {
  id: string;
  factorKey: FactorKey | 'maintenance';
  iconCategory: AdviceIconCategory;
  severity: AdviceSeverity;
  severityLabel: string;
  title: string;
  triggerMetric: string;
  suggestedActions: string[];
  actionSummary: string;
  guideline: string;
  domains: string;
}

interface HealthAdviceAlertProps {
  item: PersonalizedAdviceItem;
  onJumpToFactor?: (factorKey: PersonalizedAdviceItem['factorKey']) => void;
}

function renderColoredCategoryIcon(category: AdviceIconCategory): {
  icon: ReactNode;
  wellClass: string;
} {
  switch (category) {
    case 'hypertension':
      return {
        icon: <HeartPulse className="w-4 h-4 text-rose-600" aria-hidden="true" />,
        wellClass: 'bg-rose-100/80 border-rose-200',
      };
    case 'smoking':
      return {
        icon: <CigaretteOff className="w-4 h-4 text-rose-700" aria-hidden="true" />,
        wellClass: 'bg-rose-100/80 border-rose-200',
      };
    case 'activity':
      return {
        icon: <Activity className="w-4 h-4 text-teal-700" aria-hidden="true" />,
        wellClass: 'bg-teal-100/75 border-teal-200',
      };
    case 'weight':
      return {
        icon: <Scale className="w-4 h-4 text-amber-700" aria-hidden="true" />,
        wellClass: 'bg-amber-100/80 border-amber-200',
      };
    case 'glucose':
      return {
        icon: <Droplets className="w-4 h-4 text-orange-600" aria-hidden="true" />,
        wellClass: 'bg-orange-100/80 border-orange-200',
      };
    case 'alcohol':
      return {
        icon: <WineOff className="w-4 h-4 text-rose-600" aria-hidden="true" />,
        wellClass: 'bg-rose-100/80 border-rose-200',
      };
    case 'nutrition':
      return {
        icon: <Leaf className="w-4 h-4 text-emerald-700" aria-hidden="true" />,
        wellClass: 'bg-emerald-100/80 border-emerald-200',
      };
    case 'lipids':
      return {
        icon: <FlaskConical className="w-4 h-4 text-amber-700" aria-hidden="true" />,
        wellClass: 'bg-amber-100/80 border-amber-200',
      };
    case 'sleep_uv':
      return {
        icon: <Moon className="w-4 h-4 text-sky-700" aria-hidden="true" />,
        wellClass: 'bg-sky-100/80 border-sky-200',
      };
    case 'protective':
      return {
        icon: <ShieldCheck className="w-4 h-4 text-emerald-700" aria-hidden="true" />,
        wellClass: 'bg-emerald-100/80 border-emerald-200',
      };
  }
}

const SEVERITY_STYLES: Record<
  AdviceSeverity,
  { container: string; accent: string; symbol: string; bullet: string }
> = {
  urgent: {
    container: 'bg-rose-50/50 border-rose-200',
    accent: 'text-rose-700',
    symbol: '✖',
    bullet: 'text-rose-600',
  },
  warning: {
    container: 'bg-amber-50/50 border-amber-200',
    accent: 'text-amber-800',
    symbol: '▲',
    bullet: 'text-amber-700',
  },
  info: {
    container: 'bg-sky-50/45 border-sky-200',
    accent: 'text-sky-800',
    symbol: '◆',
    bullet: 'text-sky-700',
  },
  positive: {
    container: 'bg-emerald-50/50 border-emerald-200',
    accent: 'text-emerald-800',
    symbol: '●',
    bullet: 'text-emerald-700',
  },
};

export function HealthAdviceAlert({ item, onJumpToFactor }: HealthAdviceAlertProps) {
  const severityStyle = SEVERITY_STYLES[item.severity];
  const categoryIcon = renderColoredCategoryIcon(item.iconCategory);

  return (
    <div
      role={item.severity === 'urgent' ? 'alert' : 'status'}
      data-testid={`health-advice-alert-${item.id}`}
      className={`border rounded-xl p-4 flex items-start gap-3.5 ${severityStyle.container}`}
    >
      <span
        aria-hidden="true"
        className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border shrink-0 mt-0.5 ${categoryIcon.wellClass}`}
      >
        {categoryIcon.icon}
      </span>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span className={`font-semibold ${severityStyle.accent}`}>
            {severityStyle.symbol} {item.severityLabel}
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="text-slate-600">{item.domains}</span>
        </div>

        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-slate-900 leading-snug">{item.title}</h3>
          <p className="text-xs font-mono tabular-nums text-slate-700">{item.triggerMetric}</p>
        </div>

        {item.suggestedActions.length > 0 && (
          <ul className="space-y-1 text-xs text-slate-800">
            {item.suggestedActions.map((action) => (
              <li key={action} className="flex items-start gap-1.5 leading-snug">
                <span aria-hidden="true" className={`font-bold ${severityStyle.bullet}`}>
                  ›
                </span>
                <span className="font-medium">{action}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-slate-600 leading-relaxed">{item.actionSummary}</p>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-black/5">
          <span className="text-[11px] font-mono text-slate-500">{item.guideline}</span>
          {onJumpToFactor && item.factorKey !== 'maintenance' && (
            <button
              type="button"
              onClick={() => onJumpToFactor(item.factorKey)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D6E6E] hover:underline whitespace-nowrap cursor-pointer"
            >
              Vedi nel piano
              <ArrowDownRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type AdviceSeverityFilter = 'all' | AdviceSeverity;

interface HealthAdvicePanelProps {
  items: PersonalizedAdviceItem[];
  onJumpToFactor?: (factorKey: PersonalizedAdviceItem['factorKey']) => void;
}

const SEVERITY_FILTER_LABELS: Record<AdviceSeverity, string> = {
  urgent: 'Prioritarie',
  warning: 'Consigliate',
  info: 'Approfondimenti',
  positive: 'Protettivo',
};

export function HealthAdvicePanel({ items, onJumpToFactor }: HealthAdvicePanelProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<AdviceSeverityFilter>('all');

  const severityCounts = useMemo(() => {
    const counts: Record<AdviceSeverity, number> = {
      urgent: 0,
      warning: 0,
      info: 0,
      positive: 0,
    };
    for (const item of items) {
      counts[item.severity] += 1;
    }
    return counts;
  }, [items]);

  const presentSeverities = useMemo(
    () =>
      (['urgent', 'warning', 'info', 'positive'] as AdviceSeverity[]).filter(
        (sev) => severityCounts[sev] > 0
      ),
    [severityCounts]
  );

  const effectiveFilter: AdviceSeverityFilter =
    selectedSeverity === 'all' || severityCounts[selectedSeverity] > 0
      ? selectedSeverity
      : 'all';

  const visibleItems = useMemo(
    () =>
      effectiveFilter === 'all'
        ? items
        : items.filter((item) => item.severity === effectiveFilter),
    [items, effectiveFilter]
  );

  return (
    <section
      aria-labelledby="personalized-advice-heading"
      data-testid="personalized-advice-section"
      className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6 space-y-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)]"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 border-b border-stone-100 pb-3.5">
        <div className="min-w-0">
          <h2
            id="personalized-advice-heading"
            className="text-base font-bold tracking-tight text-slate-900"
          >
            Azioni Suggerite dal Tuo Profilo
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Avvisi clinici codificati per priorità, generati dai tuoi parametri e dai punteggi di
            rischio secondo le linee guida ESC, OMS, ADA/FINDRISC e WCRF/AICR.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {presentSeverities.length > 1 ? (
            <div
              role="group"
              aria-label="Filtra suggerimenti per priorità clinica"
              data-testid="health-advice-severity-filter"
              className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-stone-50 border border-stone-200"
            >
              <button
                type="button"
                aria-pressed={effectiveFilter === 'all'}
                onClick={() => setSelectedSeverity('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  effectiveFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs border border-stone-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tutte{' '}
                <span className="font-mono tabular-nums text-[11px] text-slate-500">
                  ({items.length})
                </span>
              </button>
              {presentSeverities.map((sev) => {
                const style = SEVERITY_STYLES[sev];
                const isActive = effectiveFilter === sev;
                return (
                  <button
                    key={sev}
                    type="button"
                    aria-pressed={isActive}
                    data-testid={`advice-filter-${sev}`}
                    onClick={() => setSelectedSeverity(sev)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? `bg-white shadow-xs border border-stone-200 ${style.accent}`
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span aria-hidden="true" className={style.accent}>
                      {style.symbol}
                    </span>{' '}
                    {SEVERITY_FILTER_LABELS[sev]}{' '}
                    <span className="font-mono tabular-nums text-[11px] opacity-75">
                      ({severityCounts[sev]})
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
              {items.length} {items.length === 1 ? 'indicazione' : 'indicazioni'}
            </span>
          )}
        </div>
      </div>

      <div
        className={`grid grid-cols-1 gap-3.5 ${
          visibleItems.length > 1 ? 'md:grid-cols-2' : ''
        }`}
      >
        {visibleItems.map((item) => (
          <HealthAdviceAlert
            key={item.id}
            item={item}
            onJumpToFactor={onJumpToFactor}
          />
        ))}
      </div>
    </section>
  );
}
