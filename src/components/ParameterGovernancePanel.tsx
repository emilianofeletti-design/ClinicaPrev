import {
  CheckCircle2,
  Database,
  ExternalLink,
  History,
  Lock,
  LogIn,
  LogOut,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  XCircle,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { useState } from 'react';
import { isVerifiedCurator } from '../firebase';
import {
  CLINICAL_PARAMETER_KEYS,
  PARAMETER_GUARDRAILS,
  type ClinicalParameterSet,
  type ParameterRevisionRecord,
  type ParameterUpdateProposal,
} from '../utils/clinicalParameters';

interface ParameterGovernancePanelProps {
  activeParams: ClinicalParameterSet;
  proposals: ParameterUpdateProposal[];
  revisions: ParameterRevisionRecord[];
  firestoreSynced: boolean;
  curatorUser: User | null;
  busyAction: boolean;
  statusBanner: string | null;
  errorBanner: string | null;
  onCuratorSignIn: () => void;
  onCuratorSignOut: () => void;
  onSeedFirestore: () => void;
  onRunGuardedAutoUpdates: () => void;
  onApproveProposal: (proposal: ParameterUpdateProposal) => void;
  onRejectProposal: (proposal: ParameterUpdateProposal) => void;
  onRollbackRevision: (revision: ParameterRevisionRecord) => void;
}

export function ParameterGovernancePanel({
  activeParams,
  proposals,
  revisions,
  firestoreSynced,
  curatorUser,
  busyAction,
  statusBanner,
  errorBanner,
  onCuratorSignIn,
  onCuratorSignOut,
  onSeedFirestore,
  onRunGuardedAutoUpdates,
  onApproveProposal,
  onRejectProposal,
  onRollbackRevision,
}: ParameterGovernancePanelProps) {
  const [showAllGuardrails, setShowAllGuardrails] = useState(false);

  const isCurator = isVerifiedCurator(curatorUser);
  const guardedAutoPending = proposals.filter(
    (p) => p.governanceTier === 'guarded_auto' && p.status === 'pending'
  );
  const manualReviewProposals = proposals.filter((p) => p.governanceTier === 'manual_review');
  const guardedAutoProposals = proposals.filter((p) => p.governanceTier === 'guarded_auto');

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <section
      aria-labelledby="parameter-governance-heading"
      className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-7 space-y-6 shadow-sm"
    >
      {/* Header + Firestore & Curator Status */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-stone-200 pb-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#0D6E6E]">
              <Database className="w-3.5 h-3.5" />
              Firebase Firestore · Parametri {activeParams.version}
            </span>
            <span className="text-slate-400">·</span>
            <span className={firestoreSynced ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
              {firestoreSynced
                ? 'Sincronizzato su database condiviso'
                : 'Configurazione baseline attiva (pronta per sincronizzazione)'}
            </span>
          </div>
          <h2 id="parameter-governance-heading" className="text-lg font-bold text-slate-900">
            Aggiornamento Parametri di Calcolo (Auto-Guardrail + Revisione Manuale)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            I coefficienti clinici sono separati dal codice e versionati. I{' '}
            <strong>fattori modificabili e i benchmark europei</strong> possono aggiornarsi in
            automatico entro limiti di sicurezza rigidi (<em>guardrail</em>), mentre i{' '}
            <strong>protocolli clinici primari</strong> (ESC SCORE2, FINDRISC, WCRF) restano
            bloccati finché non ricevono approvazione manuale esplicita.
          </p>
        </div>

        {/* Optional Curator Auth (Visitors NEVER need to sign in) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {curatorUser ? (
            <>
              <span className="text-xs text-slate-600 bg-[#FAF9F5] border border-stone-200 rounded-lg px-3 py-1.5">
                {isCurator ? 'Curatore verificato: ' : 'Account ospite: '}
                <strong className="text-slate-900">{curatorUser.email}</strong>
              </span>
              {isCurator && !firestoreSynced && (
                <button
                  type="button"
                  disabled={busyAction}
                  onClick={onSeedFirestore}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0D6E6E] rounded-lg hover:bg-[#0A5757] transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Database className="w-3.5 h-3.5" />
                  Inizializza Firestore
                </button>
              )}
              <button
                type="button"
                onClick={onCuratorSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-stone-300 rounded-lg hover:border-slate-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Esci
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onCuratorSignIn}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0D6E6E] bg-teal-50/70 border border-teal-200 rounded-xl hover:bg-teal-100/70 transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              Accesso Curatore (per pubblicare su Firestore)
            </button>
          )}
        </div>
      </div>

      {statusBanner && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{statusBanner}</span>
        </div>
      )}

      {errorBanner && (
        <div
          role="alert"
          className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-900 flex items-center gap-2"
        >
          <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Dual-Track Governance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Track 1: Guarded Auto-Updates */}
        <div className="rounded-2xl bg-[#FAF9F5] border border-stone-200 p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-800">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                LIVELLO 1 · AUTOMATICO CON GUARDRAIL
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Fattori Modificabili &amp; Benchmark Popolazione UE
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aggiornabili automaticamente solo se rientrano nei limiti numerici di sicurezza e
                citano fonti primarie HTTPS verificate (PubMed, OMS, WCRF, AIRC).
              </p>
            </div>
            <button
              type="button"
              disabled={busyAction || guardedAutoPending.length === 0}
              onClick={onRunGuardedAutoUpdates}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                guardedAutoPending.length > 0
                  ? 'text-white bg-[#0D6E6E] hover:bg-[#0A5757] cursor-pointer shadow-xs'
                  : 'text-slate-500 bg-white border border-stone-200 cursor-not-allowed'
              }`}
            >
              {guardedAutoPending.length > 0
                ? `Applica Auto-Guardrail (${guardedAutoPending.length})`
                : 'Tutti già applicati'}
            </button>
          </div>

          <div className="space-y-3">
            {guardedAutoProposals.map((prop) => {
              const rule = PARAMETER_GUARDRAILS[prop.parameterKey];
              return (
                <article
                  key={prop.id}
                  className="bg-white border border-stone-200 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{prop.parameterLabel}</p>
                      <p className="text-[11px] font-mono text-slate-500">
                        {prop.sourceAuthority} · {prop.pmidOrReference}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md whitespace-nowrap ${
                        prop.status === 'auto_applied' || prop.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : prop.status === 'rejected'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-sky-50 text-sky-800 border border-sky-200'
                      }`}
                    >
                      {prop.status === 'auto_applied'
                        ? 'Auto-applicato'
                        : prop.status === 'approved'
                          ? 'Approvato'
                          : prop.status === 'rejected'
                            ? 'Rifiutato'
                            : 'Pronto (Guardrail OK)'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums bg-stone-50 rounded-lg px-3 py-2 border border-stone-100">
                    <span className="text-slate-600">
                      Attuale: <strong className="text-slate-900">{activeParams[prop.parameterKey]}</strong>
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="text-[#0D6E6E]">
                      Proposto: <strong>{prop.proposedValue}</strong> {prop.unit}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-auto">
                      Guardrail: {rule.min}–{rule.max}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{prop.rationale}</p>

                  <div className="flex items-center justify-between pt-1">
                    <a
                      href={prop.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#0D6E6E] hover:underline"
                    >
                      Verifica fonte
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    {prop.status === 'pending' && (
                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={() => onRejectProposal(prop)}
                        className="text-[11px] font-medium text-slate-500 hover:text-rose-700 cursor-pointer"
                      >
                        Scarta
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Track 2: Manual Human-in-the-Loop Core Protocol Review */}
        <div className="rounded-2xl bg-[#FAF9F5] border border-stone-200 p-5 space-y-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-800">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              LIVELLO 2 · REVISIONE MANUALE OBBLIGATORIA
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Protocolli Clinici Primari (ESC SCORE2 · FINDRISC · WCRF)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Questi coefficienti non vengono mai modificati automaticamente dall’IA: ogni proposta
              resta in attesa di validazione manuale esplicita.
            </p>
          </div>

          <div className="space-y-3">
            {manualReviewProposals.map((prop) => {
              const rule = PARAMETER_GUARDRAILS[prop.parameterKey];
              return (
                <article
                  key={prop.id}
                  className="bg-white border border-amber-200/80 rounded-xl p-4 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{prop.parameterLabel}</p>
                      <p className="text-[11px] font-mono text-slate-500">
                        {prop.sourceAuthority} · {prop.pmidOrReference}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md whitespace-nowrap ${
                        prop.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : prop.status === 'rejected'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}
                    >
                      {prop.status === 'approved'
                        ? 'Approvato'
                        : prop.status === 'rejected'
                          ? 'Rifiutato'
                          : 'In attesa revisione'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums bg-amber-50/40 rounded-lg px-3 py-2 border border-amber-100">
                    <span className="text-slate-600">
                      Attuale: <strong className="text-slate-900">{activeParams[prop.parameterKey]}</strong>
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="text-amber-900">
                      Proposto: <strong>{prop.proposedValue}</strong> {prop.unit}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-auto">
                      Guardrail: {rule.min}–{rule.max}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{prop.rationale}</p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <a
                      href={prop.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#0D6E6E] hover:underline"
                    >
                      Verifica fonte
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {prop.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() => onApproveProposal(prop)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#0D6E6E] rounded-lg hover:bg-[#0A5757] transition-colors cursor-pointer disabled:opacity-60"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Approva e Pubblica
                        </button>
                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() => onRejectProposal(prop)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-stone-300 rounded-lg hover:border-rose-300 hover:text-rose-700 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Rifiuta
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {/* Version History & Instant Rollback + Guardrail Matrix Toggle */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 border-t border-stone-200">
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#0D6E6E]" />
            <h3 className="text-sm font-bold text-slate-900">
              Cronologia Versioni &amp; Ripristino Immediato (Rollback)
            </h3>
          </div>
          <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden">
            {revisions.slice(0, 6).map((rev, idx) => (
              <div
                key={rev.id}
                className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-mono">
                    <span className="font-bold text-slate-900">{rev.version}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-[#0D6E6E]">
                      {rev.updateMode === 'baseline'
                        ? 'Baseline'
                        : rev.updateMode === 'guarded_auto'
                          ? 'Auto-Guardrail'
                          : rev.updateMode === 'manual_review'
                            ? 'Revisione Manuale'
                            : 'Rollback'}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">{formatDate(rev.createdAtIso)}</span>
                  </div>
                  <p className="text-slate-600 leading-snug">{rev.changeSummary}</p>
                </div>

                {idx === 0 ? (
                  <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
                    Versione attiva
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busyAction}
                    onClick={() => onRollbackRevision(rev)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-stone-300 rounded-lg hover:border-[#0D6E6E] hover:text-[#0D6E6E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Ripristina
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#0D6E6E]" />
              <h3 className="text-sm font-bold text-slate-900">Parametri Attivi ({activeParams.version})</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowAllGuardrails((v) => !v)}
              className="text-xs font-semibold text-[#0D6E6E] hover:underline cursor-pointer"
            >
              {showAllGuardrails ? 'Mostra principali' : `Mostra tutti (${CLINICAL_PARAMETER_KEYS.length})`}
            </button>
          </div>
          <div className="bg-[#FAF9F5] border border-stone-200 rounded-xl divide-y divide-stone-200/70 text-xs">
            {(showAllGuardrails ? CLINICAL_PARAMETER_KEYS : CLINICAL_PARAMETER_KEYS.slice(0, 6)).map(
              (key) => {
                const rule = PARAMETER_GUARDRAILS[key];
                return (
                  <div key={key} className="px-3.5 py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">{rule.label}</p>
                      <p className="text-[11px] font-mono text-slate-500">
                        {rule.governanceTier === 'guarded_auto' ? 'Auto-guardrail' : 'Solo manuale'}{' '}
                        · [{rule.min}–{rule.max}]
                      </p>
                    </div>
                    <span className="font-mono font-bold text-[#0D6E6E] tabular-nums whitespace-nowrap">
                      {activeParams[key]} {rule.unit}
                    </span>
                  </div>
                );
              }
            )}
          </div>
          {!isCurator && (
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Nota: senza accesso curatore puoi comunque simulare e testare i parametri in questa
              sessione locale; per salvarli in modo permanente su Firebase Firestore per tutti i
              visitatori, usa «Accesso Curatore».
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
