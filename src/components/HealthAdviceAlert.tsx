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
import type { ReactNode } from 'react';
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
