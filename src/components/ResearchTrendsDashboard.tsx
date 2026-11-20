import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { User } from 'firebase/auth';
import {
  BASELINE_EMERGING_TRENDS,
  BASELINE_MONTHLY_SERIES,
  BASELINE_PUBLICATIONS,
} from '../data/clinicalProtocols';
import { isVerifiedCurator } from '../firebase';
import {
  fetchMonitoringDigestFromFirestore,
  saveMonitoringDigestToFirestore,
} from '../services/firestoreClinicalStore';
import type {
  MonitoringDigestResponse,
  ResearchDatabase,
  ResearchDomain,
} from '../types/clinical';
import type {
  ClinicalParameterSet,
  ParameterRevisionRecord,
  ParameterUpdateProposal,
} from '../utils/clinicalParameters';
import {
  computeMonthlyScanEligibility,
  MONTHLY_SCAN_COOLDOWN_DAYS,
} from '../utils/scanPolicy';
import {
  buildReaderFromPublication,
  buildReaderFromTrend,
  type SourceReaderDocument,
} from '../utils/sourceReader';
import { ParameterGovernancePanel } from './ParameterGovernancePanel';

const STATIC_BASELINE_VERIFIED_ISO = '2026-11-20T00:00:00.000Z';

function buildStaticFallbackDigest(): MonitoringDigestResponse {
  const eligibility = computeMonthlyScanEligibility(STATIC_BASELINE_VERIFIED_ISO);
  return {
    lastMonthlyScanIso: STATIC_BASELINE_VERIFIED_ISO,
    nextScheduledScanIso: eligibility.nextScheduledScanIso,
    cadenceDays: MONTHLY_SCAN_COOLDOWN_DAYS,
    canRunScan: eligibility.canRunScan,
    daysUntilNextScan: eligibility.daysUntilNextScan,
    sourcesTracked: ['NCBI PubMed', 'Google Scholar', 'Fondazione AIRC'],
    livePubMedCount: 0,
    aiSynthesisNote: null,
    aiSynthesisError: null,
    monthlySeries: BASELINE_MONTHLY_SERIES,
    emergingTrends: BASELINE_EMERGING_TRENDS,
    publications: BASELINE_PUBLICATIONS,
    groundingSources: [],
  };
}

const DOMAIN_LABELS: Record<ResearchDomain, string> = {
  all: 'Tutte',
  oncology: 'Oncologia',
  cardiovascular: 'Cardio',
  metabolic: 'Metabolico',
};

interface ResearchTrendsDashboardProps {
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
  onSeedFirestore: (digest: MonitoringDigestResponse | null) => void;
  onRunGuardedAutoUpdates: () => void;
  onApproveProposal: (proposal: ParameterUpdateProposal) => void;
  onRejectProposal: (proposal: ParameterUpdateProposal) => void;
  onRollbackRevision: (revision: ParameterRevisionRecord) => void;
  onOpenSourceReader: (doc: SourceReaderDocument) => void;
}

export function ResearchTrendsDashboard({
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
  onOpenSourceReader,
}: ResearchTrendsDashboardProps) {
  const [digest, setDigest] = useState<MonitoringDigestResponse | null>(null);
  const [loadingDigest, setLoadingDigest] = useState(true);
  const [digestError, setDigestError] = useState<string | null>(null);

  const [scanningMonthly, setScanningMonthly] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [domainFilter, setDomainFilter] = useState<ResearchDomain>('all');
  const [dbFilter, setDbFilter] = useState<ResearchDatabase>('all');
  const [pubSearchText, setPubSearchText] = useState('');

  useEffect(() => {
    let active = true;
    const loadDigest = async () => {
      setLoadingDigest(true);
      setDigestError(null);
      try {
        const firestoreDigest = await fetchMonitoringDigestFromFirestore().catch(() => null);
        if (!active) return;
        if (firestoreDigest) {
          setDigest(firestoreDigest);
          return;
        }

        const isStaticHost =
          import.meta.env.VITE_STATIC_ONLY === 'true' ||
          (typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io'));

        const apiResult = isStaticHost
          ? null
          : await fetch('/api/monitoring/digest')
              .then(async (res) => {
                if (!res.ok) return null;
                const contentType = res.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) return null;
                return (await res.json()) as MonitoringDigestResponse;
              })
              .catch(() => null);

        if (!active) return;
        setDigest(apiResult ?? buildStaticFallbackDigest());
      } catch {
        if (active) {
          setDigest(buildStaticFallbackDigest());
        }
      } finally {
        if (active) setLoadingDigest(false);
      }
    };
    void loadDigest();
    return () => {
      active = false;
    };
  }, []);

  const handleRunMonthlyScan = async () => {
    if (!digest?.canRunScan) return;
    setScanningMonthly(true);
    setScanError(null);
    try {
      const res = await fetch('/api/monitoring/run-monthly-scan', { method: 'POST' });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(
          'La scansione live su API esterne richiede il backend Node.js attivo. Su hosting statico (es. GitHub Pages) l’osservatorio mostra l’archivio scientifico validato e gli aggiornamenti pubblicati su Firestore.'
        );
      }
      const data = (await res.json()) as MonitoringDigestResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || 'Scansione periodica non riuscita.');
      }
      setDigest(data);
      if (isVerifiedCurator(curatorUser)) {
        await saveMonitoringDigestToFirestore(data);
      }
    } catch (err) {
      setScanError(
        err instanceof Error
          ? err.message
          : 'Errore durante la scansione periodica su PubMed, Google Scholar e AIRC.'
      );
    } finally {
      setScanningMonthly(false);
    }
  };

  const filteredTrends = useMemo(() => {
    if (!digest) return [];
    if (domainFilter === 'all') return digest.emergingTrends;
    return digest.emergingTrends.filter((t) => t.domain === domainFilter);
  }, [digest, domainFilter]);

  const filteredPublications = useMemo(() => {
    if (!digest) return [];
    return digest.publications.filter((p) => {
      if (domainFilter !== 'all' && p.domain !== domainFilter) return false;
      if (dbFilter !== 'all' && p.database !== dbFilter) return false;
      if (pubSearchText.trim()) {
        const needle = pubSearchText.toLowerCase();
        return (
          p.title.toLowerCase().includes(needle) ||
          p.journal.toLowerCase().includes(needle) ||
          p.keyFinding.toLowerCase().includes(needle) ||
          (p.pmid && p.pmid.includes(needle))
        );
      }
      return true;
    });
  }, [digest, domainFilter, dbFilter, pubSearchText]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  return (
    <div className="space-y-8">
      {/* Header & Monthly Cadence Bar */}
      <section className="bg-gradient-to-r from-[#FFFDF8] via-white to-[#F0FDFA] border border-teal-100 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6 shadow-[0_2px_12px_rgba(13,110,110,0.04)]">
        <div className="space-y-2">
          <p className="text-xs font-mono text-[#0D6E6E]">
            Monitoraggio Accademico Periodico · NCBI PubMed · Google Scholar · Fondazione AIRC
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Osservatorio Ricerca &amp; Trend Emergenti
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Archivio condiviso di pubblicazioni peer-reviewed e trend emergenti da PubMed, Google
            Scholar e Fondazione AIRC. L’aggiornamento tramite API si sblocca su richiesta solo
            trascorsi 30 giorni dall’ultima scansione, evitando chiamate inutili.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunMonthlyScan}
          disabled={loadingDigest || !digest?.canRunScan || scanningMonthly}
          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            digest?.canRunScan
              ? 'text-white bg-[#0D6E6E] hover:bg-[#0A5656] cursor-pointer shadow-xs'
              : 'text-emerald-800 bg-emerald-50 border border-emerald-200 cursor-not-allowed'
          }`}
        >
          {scanningMonthly ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : digest?.canRunScan ? (
            <RefreshCw className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          )}
          {scanningMonthly
            ? 'Aggiornamento in corso...'
            : digest?.canRunScan
              ? 'Aggiorna Fonti Scientifiche Ora'
              : digest
                ? `Dati aggiornati (prossima tra ${digest.daysUntilNextScan} gg)`
                : 'Verifica stato...'}
        </button>
      </section>

      {scanError && (
        <div
          role="alert"
          className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-xs text-rose-900"
        >
          {scanError}
        </div>
      )}

      {/* Monthly Monitoring Schedule & Telemetry Summary (4-column flat row) */}
      {loadingDigest ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="h-24 bg-white border border-slate-200 rounded-lg p-4" />
          ))}
        </div>
      ) : digestError || !digest ? (
        <div
          role="alert"
          className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-sm text-rose-900"
        >
          {digestError || 'Dati di monitoraggio non disponibili.'}
        </div>
      ) : (
        <>
          <section
            aria-label="Stato ciclo mensile PubMed e Google Scholar"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-1">
              <p className="text-xs font-mono text-slate-500">ULTIMO AGGIORNAMENTO</p>
              <p className="text-base font-semibold text-slate-900 tabular-nums">
                {formatDate(digest.lastMonthlyScanIso)}
              </p>
              <p className="text-xs text-slate-500">
                Finestra di validità: {digest.cadenceDays} giorni
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-1">
              <p className="text-xs font-mono text-slate-500">NUOVA SCANSIONE DISPONIBILE</p>
              <p className="text-base font-semibold text-slate-900 tabular-nums flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4 text-[#0D6E6E] shrink-0" />
                {digest.canRunScan ? 'Disponibile ora' : formatDate(digest.nextScheduledScanIso)}
              </p>
              <p className="text-xs text-slate-500">Solo su richiesta (nessuna chiamata a vuoto)</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-1">
              <p className="text-xs font-mono text-slate-500">ARTICOLI INDICIZZATI</p>
              <p className="text-2xl font-mono font-bold tabular-nums text-slate-900">
                {digest.publications.length}
              </p>
              <p className="text-xs text-slate-500">
                {digest.livePubMedCount > 0
                  ? `${digest.livePubMedCount} recuperati live da PubMed`
                  : 'Registro peer-reviewed validato'}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-1">
              <p className="text-xs font-mono text-slate-500">TREND EMERGENTI MONITORATI</p>
              <p className="text-2xl font-mono font-bold tabular-nums text-slate-900">
                {digest.emergingTrends.length}
              </p>
              <p className="text-xs text-slate-500">Oncologia · CVD · Metabolismo</p>
            </div>
          </section>

          {/* AI Monthly Synthesis Box (when scan ran) */}
          {(digest.aiSynthesisNote || digest.aiSynthesisError) && (
            <section className="bg-white border border-slate-300 rounded-lg p-6 space-y-3">
              <h2 className="text-base font-semibold text-slate-900">
                Sintesi Mensile IA (PubMed + Google Scholar Grounding)
              </h2>
              {digest.aiSynthesisNote && (
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {digest.aiSynthesisNote}
                </p>
              )}
              {digest.aiSynthesisError && (
                <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded p-3">
                  Nota sintesi IA: {digest.aiSynthesisError}
                </p>
              )}
              {digest.groundingSources.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-1.5">
                    Fonti web citate nel ciclo corrente:
                  </p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                    {digest.groundingSources.slice(0, 6).map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#0D6E6E] hover:underline"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="max-w-xs truncate">{src.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Freshness & 30-Day On-Demand Policy Banner */}
          <section
            aria-label="Stato aggiornamento fonti scientifiche"
            className={`rounded-lg p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              digest.canRunScan
                ? 'bg-sky-50/70 border-sky-200'
                : 'bg-emerald-50/60 border-emerald-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {digest.canRunScan ? (
                <RefreshCw className="w-5 h-5 text-[#0D6E6E] shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <h2 className="text-sm font-semibold text-slate-900">
                  {digest.canRunScan
                    ? 'Aggiornamento periodico delle fonti disponibile'
                    : 'Dati scientifici aggiornati'}
                </h2>
                <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                  {digest.scanMessage ? (
                    digest.scanMessage
                  ) : digest.canRunScan ? (
                    `Sono trascorsi almeno ${digest.cadenceDays} giorni dall’ultimo controllo (${formatDate(
                      digest.lastMonthlyScanIso
                    )}). Cliccando “Aggiorna Fonti Scientifiche Ora” verrà eseguita una singola scansione su PubMed, Google Scholar e Fondazione AIRC valida per i successivi 30 giorni.`
                  ) : (
                    `Le fonti e i protocolli (PubMed, Google Scholar e Fondazione AIRC) risultano aggiornati al ${formatDate(
                      digest.lastMonthlyScanIso
                    )}. Per evitare chiamate API inutili, una nuova scansione su richiesta si sbloccherà dal ${formatDate(
                      digest.nextScheduledScanIso
                    )} (tra ${digest.daysUntilNextScan} ${
                      digest.daysUntilNextScan === 1 ? 'giorno' : 'giorni'
                    }).`
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* Hybrid Clinical Parameter Governance (Guarded Auto-Updates + Manual Review + Firestore) */}
          <ParameterGovernancePanel
            activeParams={activeParams}
            proposals={proposals}
            revisions={revisions}
            firestoreSynced={firestoreSynced}
            curatorUser={curatorUser}
            busyAction={busyAction}
            statusBanner={statusBanner}
            errorBanner={errorBanner}
            onCuratorSignIn={onCuratorSignIn}
            onCuratorSignOut={onCuratorSignOut}
            onSeedFirestore={() => onSeedFirestore(digest)}
            onRunGuardedAutoUpdates={onRunGuardedAutoUpdates}
            onApproveProposal={onApproveProposal}
            onRejectProposal={onRejectProposal}
            onRollbackRevision={onRollbackRevision}
          />

          {/* Emerging Trends Volume Chart + Sector Trends */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Volume Mensile Pubblicazioni Preventive (12 Mesi)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Trend delle pubblicazioni indicizzate su PubMed e Google Scholar per area
                  epidemiologica preventiva.
                </p>
              </div>

              <div className="w-full h-72" data-testid="trends-area-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={digest.monthlySeries}
                    margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E2E8F0',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area
                      type="monotone"
                      dataKey="oncology"
                      name="Oncologia Preventiva"
                      stroke="#0D6E6E"
                      fill="#0D6E6E"
                      fillOpacity={0.16}
                      strokeWidth={2.25}
                    />
                    <Area
                      type="monotone"
                      dataKey="cardiovascular"
                      name="Cardiovascolare"
                      stroke="#F97316"
                      fill="#F97316"
                      fillOpacity={0.12}
                      strokeWidth={2.25}
                    />
                    <Area
                      type="monotone"
                      dataKey="metabolic"
                      name="Metabolico / Diabete"
                      stroke="#0284C7"
                      fill="#0284C7"
                      fillOpacity={0.1}
                      strokeWidth={2.25}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Domain Filter + Top Emerging Trends */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 space-y-4">
              <div className="flex flex-col gap-3">
                <h2 className="text-base font-semibold text-slate-900">
                  Trend Emergenti del Settore
                </h2>
                <div
                  role="tablist"
                  aria-label="Filtra trend per area clinica"
                  className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-md"
                >
                  {(['all', 'oncology', 'cardiovascular', 'metabolic'] as ResearchDomain[]).map(
                    (dom) => (
                      <button
                        key={dom}
                        type="button"
                        role="tab"
                        aria-selected={domainFilter === dom}
                        onClick={() => setDomainFilter(dom)}
                        className={`px-2 py-1.5 text-xs font-medium rounded text-center transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          domainFilter === dom
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {DOMAIN_LABELS[dom]}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="divide-y divide-slate-200 max-h-[360px] overflow-y-auto pr-1">
                {filteredTrends.map((trend) => (
                  <article key={trend.id} className="py-1.5 first:pt-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => onOpenSourceReader(buildReaderFromTrend(trend))}
                      className="w-full text-left rounded-lg p-2.5 -mx-1 hover:bg-teal-50/55 transition-colors space-y-1.5 group cursor-pointer"
                    >
                      <div className="flex items-baseline justify-between gap-2 text-xs">
                        <span className="font-mono text-slate-500">
                          {DOMAIN_LABELS[trend.domain]} · {trend.monthlyPublications} studi/mese
                        </span>
                        <span className="font-mono font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                          +{trend.growthPctYoY}% YoY
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-[#0D6E6E] leading-snug transition-colors">
                        {trend.topic}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{trend.summary}</p>
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="text-[11px] font-mono text-slate-400 truncate">
                          {trend.keyCitation}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-[#0D6E6E] shrink-0">
                          Leggi riassunto
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </button>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* Monitored Publications Table */}
          <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Pubblicazioni e Fonti Monitorate (PubMed, Google Scholar &amp; AIRC)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {filteredPublications.length} pubblicazioni corrispondenti ai filtri attivi ·
                  Clicca su una scheda per leggere il riassunto semplice in italiano.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
                  {(['all', 'PubMed', 'Google Scholar', 'AIRC'] as ResearchDatabase[]).map((db) => (
                    <button
                      key={db}
                      type="button"
                      onClick={() => setDbFilter(db)}
                      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        dbFilter === db
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {db === 'all' ? 'Tutte' : db}
                    </button>
                  ))}
                </div>

                <label htmlFor="pubFilterSearch" className="sr-only">
                  Filtra pubblicazioni per titolo o rivista
                </label>
                <input
                  id="pubFilterSearch"
                  type="search"
                  value={pubSearchText}
                  onChange={(e) => setPubSearchText(e.target.value)}
                  placeholder="Filtra per parola chiave o PMID..."
                  className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D6E6E]/20 focus:border-[#0D6E6E] w-56"
                />
              </div>
            </div>

            {filteredPublications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Nessuna pubblicazione corrisponde ai filtri correnti. Prova a rimuovere i filtri di
                ricerca.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredPublications.map((pub) => (
                  <article
                    key={pub.id}
                    className="p-5 sm:px-6 flex flex-col lg:flex-row lg:items-start justify-between gap-4 hover:bg-teal-50/35 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenSourceReader(buildReaderFromPublication(pub))}
                      className="text-left space-y-1.5 max-w-3xl flex-1 group cursor-pointer"
                    >
                      <p className="text-xs font-mono text-slate-500">
                        {pub.database} · {DOMAIN_LABELS[pub.domain]} · {pub.journal} ·{' '}
                        {pub.publishedDate}
                        {pub.pmid ? ` · PMID ${pub.pmid}` : ''}
                      </p>
                      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-[#0D6E6E] group-hover:underline leading-snug transition-colors">
                        {pub.readerBrief?.headlineIt || pub.title}
                      </h3>
                      {pub.readerBrief?.headlineIt &&
                        pub.readerBrief.headlineIt.toLowerCase() !== pub.title.toLowerCase() && (
                          <p className="text-[11px] text-slate-400 italic line-clamp-1">
                            {pub.title}
                          </p>
                        )}
                      <p className="text-xs text-slate-500">{pub.authors}</p>
                      <p className="text-xs text-slate-700 leading-relaxed pt-0.5">
                        {pub.keyFinding}
                      </p>
                    </button>

                    <div className="shrink-0 flex flex-wrap items-center lg:flex-col lg:items-end gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenSourceReader(buildReaderFromPublication(pub))}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0D6E6E] rounded-md hover:bg-[#0A5656] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Leggi Riassunto
                      </button>
                      <a
                        href={pub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#0D6E6E] hover:underline whitespace-nowrap shrink-0"
                      >
                        Fonte originale
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
