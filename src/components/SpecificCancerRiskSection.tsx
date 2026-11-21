import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  CheckCircle2,
  CigaretteOff,
  Info,
  Leaf,
  Ribbon,
  ShieldCheck,
  Stethoscope,
  Sun,
  WineOff,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { BiologicalSex, RiskTier, SpecificCancerSiteId, SpecificCancerSiteProfile } from '../types/clinical';
import type { FactorKey } from '../utils/interventionPlanner';

interface SpecificCancerRiskSectionProps {
  sites: SpecificCancerSiteProfile[];
  sex: BiologicalSex;
  age: number;
  hasBowelRedFlag: boolean;
  onJumpToFactor: (factorKey: FactorKey | 'clinical_evaluation') => void;
}

function getSiteTierStyle(tier: RiskTier): {
  symbol: string;
  badgeTextClass: string;
  barClass: string;
  cardBorderClass: string;
} {
  switch (tier) {
    case 'low':
      return {
        symbol: '●',
        badgeTextClass: 'text-emerald-700',
        barClass: 'bg-emerald-500',
        cardBorderClass: 'border-stone-200',
      };
    case 'moderate':
      return {
        symbol: '▲',
        badgeTextClass: 'text-amber-700',
        barClass: 'bg-amber-500',
        cardBorderClass: 'border-stone-200',
      };
    case 'elevated':
      return {
        symbol: '◆',
        badgeTextClass: 'text-orange-700',
        barClass: 'bg-orange-500',
        cardBorderClass: 'border-orange-200',
      };
    case 'high':
    case 'very_high':
      return {
        symbol: '✖',
        badgeTextClass: 'text-rose-700',
        barClass: 'bg-rose-600',
        cardBorderClass: 'border-rose-200',
      };
  }
}

function getSiteIcon(siteId: SpecificCancerSiteId): { icon: ReactNode; wellClass: string } {
  switch (siteId) {
    case 'colorectal':
      return {
        icon: <Leaf className="w-4 h-4 text-emerald-700" aria-hidden="true" />,
        wellClass: 'bg-emerald-50 border-emerald-200',
      };
    case 'lung':
      return {
        icon: <CigaretteOff className="w-4 h-4 text-rose-700" aria-hidden="true" />,
        wellClass: 'bg-rose-50 border-rose-200',
      };
    case 'breast':
      return {
        icon: <Ribbon className="w-4 h-4 text-rose-600" aria-hidden="true" />,
        wellClass: 'bg-rose-50 border-rose-200',
      };
    case 'prostate':
      return {
        icon: <Activity className="w-4 h-4 text-sky-700" aria-hidden="true" />,
        wellClass: 'bg-sky-50 border-sky-200',
      };
    case 'skin_melanoma':
      return {
        icon: <Sun className="w-4 h-4 text-amber-600" aria-hidden="true" />,
        wellClass: 'bg-amber-50 border-amber-200',
      };
    case 'liver_upper_gi':
      return {
        icon: <WineOff className="w-4 h-4 text-orange-700" aria-hidden="true" />,
        wellClass: 'bg-orange-50 border-orange-200',
      };
  }
}

export function SpecificCancerRiskSection({
  sites,
  sex,
  age,
  hasBowelRedFlag,
  onJumpToFactor,
}: SpecificCancerRiskSectionProps) {
  if (!sites || sites.length === 0) return null;

  return (
    <section
      id="profilo-oncologico-sedi"
      aria-labelledby="specific-cancer-heading"
      data-testid="specific-cancer-risk-section"
      className="scroll-mt-32 bg-white border border-stone-200 rounded-xl p-5 sm:p-6 space-y-5 shadow-[0_1px_4px_rgba(15,23,42,0.03)]"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 border-b border-stone-100 pb-4">
        <div className="space-y-1 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#0D6E6E]">
            <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>WCRF/AICR Continuous Update Project · IARC Gruppo 1 · Screening SSN</span>
          </div>
          <h2
            id="specific-cancer-heading"
            className="text-lg font-bold tracking-tight text-slate-900"
          >
            Profilo di Esposizione Oncologica per Sede &amp; Screening SSN
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Scomposizione dell’indice oncologico preventivo nelle{' '}
            <strong>{sites.length} sedi anatomiche principali</strong> per sesso (
            {sex === 'female' ? 'femminile' : 'maschile'}) ed età ({age} anni), basata
            esclusivamente sulle associazioni causali classificate come{' '}
            <em>Convincing / Probable</em> dal WCRF/AICR e dalle Monografie IARC. Non è una
            diagnosi, ma indica su quali organi pesano i tuoi attuali fattori modificabili.
          </p>
        </div>

        <span className="text-xs font-mono tabular-nums text-slate-500 sm:whitespace-nowrap">
          Scala esposizione: 0–100 (più basso = più protetto)
        </span>
      </div>

      {/* Guideline Clarification Callout: Bowel Regularity vs Clinical Red Flags */}
      <aside
        aria-label="Nota metodologica su regolarità intestinale e segnali d’allarme"
        data-testid="bowel-guideline-note"
        className={`rounded-xl border p-4 flex items-start gap-3 ${
          hasBowelRedFlag
            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
            : 'bg-[#FAF9F5] border-stone-200 text-slate-800'
        }`}
      >
        {hasBowelRedFlag ? (
          <Stethoscope className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" aria-hidden="true" />
        ) : (
          <Info className="w-4 h-4 text-[#0D6E6E] shrink-0 mt-0.5" aria-hidden="true" />
        )}
        <div className="text-xs leading-relaxed space-y-1 min-w-0">
          <p className="font-semibold text-slate-900">
            {hasBowelRedFlag
              ? 'Segnale d’allarme gastrointestinale attivo (Linee Guida NICE NG12 / AIOM)'
              : 'Perché la regolarità intestinale abituale è distinta dai segnali d’allarme (Linee Guida WCRF/AICR & NICE NG12)?'}
          </p>
          <p className="text-slate-600">
            Le meta-analisi gastroenterologiche (<em>Power et al., Am J Gastroenterol 2013</em>) e i
            report <strong>WCRF/AICR</strong> dimostrano che la{' '}
            <strong>stipsi cronica abituale non è una causa indipendente</strong> di tumore del
            colon-retto (per cui nel punteggio contano fibre, carni lavorate, movimento, peso, alcol
            e fumo). Al contrario, una{' '}
            <strong>
              variazione recente e persistente dell’alvo (&gt;4–6 settimane) o la presenza di sangue
              nelle feci
            </strong>{' '}
            è un segnale clinico (<em>red flag</em> NICE NG12 / AIOM) che non va sommato a uno score
            statistico ma valutato direttamente con il Medico di Medicina Generale.
          </p>
        </div>
      </aside>

      {/* Grid of Organ-Specific Cancer Exposure Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sites.map((site) => {
          const tierStyle = getSiteTierStyle(site.tier);
          const siteIcon = getSiteIcon(site.id);

          return (
            <article
              key={site.id}
              data-testid={`specific-cancer-card-${site.id}`}
              className={`bg-white border ${tierStyle.cardBorderClass} rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4`}
            >
              <div className="space-y-3.5">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      aria-hidden="true"
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border shrink-0 mt-0.5 ${siteIcon.wellClass}`}
                    >
                      {siteIcon.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-mono text-slate-500">{site.anatomicalGroup}</p>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{site.name}</h3>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xs font-semibold ${tierStyle.badgeTextClass}`}>
                      {tierStyle.symbol} {site.tierLabel}
                    </span>
                    <p className="text-sm font-mono font-bold tabular-nums text-slate-900">
                      {site.exposureScore}
                      <span className="text-xs font-normal text-slate-500">/100</span>
                    </p>
                  </div>
                </div>

                {/* Exposure Progress Bar */}
                <div
                  aria-label={`Indice esposizione ${site.name}: ${site.exposureScore} su 100`}
                  className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden"
                >
                  <div
                    className={`h-full rounded-full transition-all ${tierStyle.barClass}`}
                    style={{ width: `${Math.min(100, Math.max(6, site.exposureScore))}%` }}
                  />
                </div>

                {/* Active Risk Drivers */}
                {site.activeDrivers.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-slate-700">
                      Fattori di esposizione rilevati nel tuo profilo:
                    </p>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {site.activeDrivers.map((driver) => (
                        <li key={driver} className="flex items-start gap-1.5 leading-snug">
                          <AlertCircle
                            className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>{driver}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    Nessun fattore modificabile fuori target per questa sede.
                  </p>
                )}

                {/* Active Protective Factors */}
                {site.protectiveFactors.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-emerald-800">
                      Fattori protettivi già attivi:
                    </p>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {site.protectiveFactors.map((prot) => (
                        <li key={prot} className="flex items-start gap-1.5 leading-snug">
                          <CheckCircle2
                            className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>{prot}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Modifiable Actions */}
                <div className="rounded-lg bg-stone-50/90 border border-stone-200/80 p-3 space-y-1">
                  <p className="text-[11px] font-semibold text-slate-800">
                    Azioni preventive mirate per questa sede:
                  </p>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {site.modifiableActions.map((act) => (
                      <li key={act} className="flex items-start gap-1.5 leading-snug">
                        <span aria-hidden="true" className="font-bold text-[#0D6E6E]">
                          ›
                        </span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* SSN / Guideline Screening Box */}
                <div
                  className={`rounded-lg border p-3 text-xs leading-relaxed ${
                    site.screeningHighlight
                      ? 'bg-teal-50/60 border-teal-200 text-slate-800'
                      : 'bg-white border-stone-200 text-slate-600'
                  }`}
                >
                  <p className="font-semibold text-slate-900 mb-0.5">
                    Indicazione Screening SSN / Linee Guida:
                  </p>
                  <p>{site.screeningGuideline}</p>
                </div>
              </div>

              {/* Footer with Evidence Citation & Jump to Intervention Plan */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-stone-100">
                <span className="text-[11px] font-mono text-slate-500">{site.evidenceCitation}</span>
                <button
                  type="button"
                  onClick={() => onJumpToFactor(site.primaryFactorKey)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D6E6E] hover:underline whitespace-nowrap cursor-pointer"
                >
                  Simula intervento nel piano
                  <ArrowDownRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
