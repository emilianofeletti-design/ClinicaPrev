import { BookOpen, ExternalLink } from 'lucide-react';
import { INTERNATIONAL_PROTOCOLS } from '../data/clinicalProtocols';
import {
  buildReaderFromProtocol,
  type SourceReaderDocument,
} from '../utils/sourceReader';

interface GuideAndLegalViewProps {
  onReturnToAssessment: () => void;
  onOpenSourceReader: (doc: SourceReaderDocument) => void;
}

export function GuideAndLegalView({
  onReturnToAssessment,
  onOpenSourceReader,
}: GuideAndLegalViewProps) {
  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="rounded-2xl bg-gradient-to-br from-[#FFFDF8] via-white to-[#F0FDFA] border border-teal-200/70 p-6 sm:p-8 shadow-sm space-y-3">
        <p className="text-xs font-semibold text-[#0D6E6E] tracking-wide uppercase">
          Trasparenza Clinica · Metodologia Epidemiologica · Conformità Informativa
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Guida ai Risultati e Disclaimer Legale
        </h1>
        <p className="text-base text-slate-600 max-w-3xl leading-relaxed">
          Documentazione chiara e trasparente su come leggere i tuoi punteggi, quali protocolli
          clinici internazionali vengono applicati e quali sono i confini informativi degli
          strumenti di prevenzione epidemiologica.
        </p>
      </section>

      {/* Mandatory Clear Legal Disclaimer */}
      <section
        aria-labelledby="legal-disclaimer-heading"
        className="bg-amber-50/45 border border-amber-200/80 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm"
      >
        <h2 id="legal-disclaimer-heading" className="text-xl font-bold text-slate-900">
          01. Disclaimer Legale e Avvertenza Sanitaria
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-700 leading-relaxed">
          <div className="space-y-3">
            <p>
              <strong className="text-slate-900">Natura esclusivamente informativa:</strong>{' '}
              ClinicaPrev è uno strumento digitale di educazione sanitaria e supporto informativo
              basato su algoritmi e raccomandazioni pubblicate nella letteratura medica
              internazionale e nazionale (ESC, IDF, OMS, WCRF/AICR, IARC, Fondazione AIRC). Non è
              classificato come dispositivo medico ai sensi del
              Regolamento (UE) 2017/745 (MDR) e non fornisce diagnosi mediche, valutazioni
              cliniche individuali o prescrizioni terapeutiche.
            </p>
            <p>
              <strong className="text-slate-900">Non sostituzione del medico curante:</strong> I
              risultati generati rappresentano stime probabilistiche derivate da coorti di
              popolazione e non possono mai sostituire la visita, l’anamnesi completa, gli esami
              diagnostici o il giudizio clinico del Medico di Medicina Generale (MMG) o dello
              specialista (cardiologo, diabetologo, oncologo).
            </p>
          </div>
          <div className="space-y-3">
            <p>
              <strong className="text-slate-900">Urgenze e sintomi clinici:</strong> In presenza di
              sintomi acuti (es. dolore toracico, dispnea, deficit neurologici, calo ponderale
              inspiegato, sanguinamenti anomali), non fare affidamento su calcolatori statistici ma
              contattare immediatamente il 112/118 o rivolgersi al Pronto Soccorso o al proprio
              medico.
            </p>
            <p>
              <strong className="text-slate-900">Privacy e gestione dei dati:</strong> Tutti i
              parametri biometrici e di stile di vita inseriti nella valutazione vengono elaborati
              esclusivamente nel browser dell’utente e non vengono mai inviati a server esterni né
              associati a nominativi o dati anagrafici. L’aggiornamento delle fonti scientifiche
              avviene in modo anonimo e condiviso al massimo una volta ogni 30 giorni su richiesta.
            </p>
          </div>
        </div>
      </section>

      {/* Guide to Interpreting Results */}
      <section aria-labelledby="results-guide-heading" className="space-y-6">
        <div className="space-y-1">
          <h2 id="results-guide-heading" className="text-xl font-bold text-slate-900">
            02. Come Interpretare i Risultati Ottenuti
          </h2>
          <p className="text-sm text-slate-600">
            Differenza tra rischio assoluto a 10 anni, punteggio clinico validato e indice di
            rischio relativo preventivo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <article className="bg-white border border-stone-200 border-t-2 border-t-rose-400 rounded-2xl p-6 space-y-3 shadow-sm">
            <p className="text-xs font-mono font-semibold text-rose-700">CARDIOVASCOLARE · ESC SCORE2</p>
            <h3 className="text-base font-semibold text-slate-900">
              Rischio Assoluto a 10 Anni (%)
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Esprime la percentuale stimata di persone con caratteristiche analoghe che potrebbe
              manifestare un evento cardiovascolare fatale o non fatale (infarto miocardico, ictus)
              entro 10 anni. Le soglie ESC variano per fascia di età:
            </p>
            <dl className="text-xs space-y-1.5 pt-2 border-t border-slate-100 font-mono tabular-nums">
              <div className="flex justify-between">
                <dt className="text-slate-600">&lt;50 anni (Basso / Mod / Alto)</dt>
                <dd className="text-slate-900">&lt;2,5% · 2,5–7,4% · ≥7,5%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">50–69 anni (Basso / Mod / Alto)</dt>
                <dd className="text-slate-900">&lt;5% · 5–9,9% · ≥10%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">≥70 anni (Basso / Mod / Alto)</dt>
                <dd className="text-slate-900">&lt;7,5% · 7,5–14,9% · ≥15%</dd>
              </div>
            </dl>
          </article>

          <article className="bg-white border border-stone-200 border-t-2 border-t-amber-400 rounded-2xl p-6 space-y-3 shadow-sm">
            <p className="text-xs font-mono font-semibold text-amber-700">METABOLICO · FINDRISC (0–26 PT)</p>
            <h3 className="text-base font-semibold text-slate-900">
              Punteggio Diabete Tipo 2
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Il questionario FINDRISC è lo standard europeo (IDF/OMS) per lo screening non
              invasivo del Diabete di Tipo 2. Ogni fascia corrisponde a una probabilità validata a
              10 anni:
            </p>
            <dl className="text-xs space-y-1.5 pt-2 border-t border-slate-100 font-mono tabular-nums">
              <div className="flex justify-between">
                <dt className="text-slate-600">0–6 punti (Basso)</dt>
                <dd className="text-slate-900">&lt;1% (1 su 100)</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">7–11 punti (Lieve/Moderato)</dt>
                <dd className="text-slate-900">~4% (1 su 25)</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">12–14 punti (Moderato-Elevato)</dt>
                <dd className="text-slate-900">~17% (1 su 6)</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">15–20 punti (Alto)</dt>
                <dd className="text-slate-900">~33% (1 su 3)</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">&gt;20 punti (Molto Alto)</dt>
                <dd className="text-slate-900">~50% (1 su 2)</dd>
              </div>
            </dl>
          </article>

          <article className="bg-white border border-stone-200 border-t-2 border-t-teal-500 rounded-2xl p-6 space-y-3 shadow-sm">
            <p className="text-xs font-mono font-semibold text-teal-700">ONCOLOGICO · WCRF/AICR &amp; AIRC</p>
            <h3 className="text-base font-semibold text-slate-900">
              Indice Preventivo &amp; Rischio Relativo
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              A differenza delle malattie CV, i tumori hanno incidenze distinte per organo. Questo
              indice (0–100) misura il carico cumulativo di fattori modificabili validati dal{' '}
              <em>WCRF/AICR Third Expert Report</em>, dal <em>Codice Europeo Contro il Cancro</em> e
              dalle guide <em>Fondazione AIRC</em>, insieme allo score di aderenza (0–7).
            </p>
            <p className="text-xs text-slate-500 pt-2 border-t border-slate-100 leading-relaxed">
              Un indice basso non garantisce assenza di rischio (esistono fattori genetici e
              casuali); gli screening organizzati SSN restano indispensabili per fascia d’età.
            </p>
          </article>
        </div>
      </section>

      {/* International Clinical Protocols Registry */}
      <section aria-labelledby="protocols-table-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 id="protocols-table-heading" className="text-xl font-bold text-slate-900">
              03. Protocolli Clinici Internazionali di Riferimento
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Tutte le formule impiegate derivano da pubblicazioni peer-reviewed indicizzate su
              PubMed e linee guida ufficiali.
            </p>
          </div>
          <button
            type="button"
            onClick={onReturnToAssessment}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-[#0D6E6E] rounded-xl hover:bg-[#0A5757] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
          >
            Torna alla Valutazione
          </button>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-[#FAF9F5] text-xs font-semibold text-slate-600">
                <th className="py-3 px-4">Protocollo &amp; Ente</th>
                <th className="py-3 px-4">Area Clinica</th>
                <th className="py-3 px-4">Variabili Integrate</th>
                <th className="py-3 px-4">Validazione &amp; PMID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {INTERNATIONAL_PROTOCOLS.map((proto) => (
                <tr key={proto.id} className="align-top hover:bg-teal-50/40 transition-colors">
                  <td className="py-4 px-4">
                    <button
                      type="button"
                      onClick={() => onOpenSourceReader(buildReaderFromProtocol(proto))}
                      className="text-left group cursor-pointer"
                    >
                      <p className="font-semibold text-slate-900 group-hover:text-[#0D6E6E] group-hover:underline transition-colors">
                        {proto.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{proto.organization}</p>
                    </button>
                  </td>
                  <td className="py-4 px-4 text-slate-700 whitespace-nowrap">{proto.domain}</td>
                  <td className="py-4 px-4">
                    <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                      {proto.variablesUsed.map((v, idx) => (
                        <li key={idx}>{v}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-4 px-4 space-y-2.5 max-w-xs">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {proto.validationScope}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenSourceReader(buildReaderFromProtocol(proto))}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#0D6E6E] bg-teal-50/80 border border-teal-200 rounded-md hover:bg-teal-100/80 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Leggi riassunto
                      </button>
                      <a
                        href={proto.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono font-medium text-slate-600 hover:text-[#0D6E6E] hover:underline"
                      >
                        PMID {proto.pmid}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
