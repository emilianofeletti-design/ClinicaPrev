import {
  Activity,
  ArrowRight,
  BookOpen,
  FileUp,
  HeartPulse,
  Lock,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useRef } from 'react';
import mediterraneanNutritionImg from '../assets/images/mediterranean_nutrition_art_1795180944779.jpg';
import preventiveHealthImg from '../assets/images/preventive_health_illustration_1795178666156.jpg';
import scientificEvidenceImg from '../assets/images/scientific_evidence_art_1795180945253.jpg';

interface HomePageProps {
  onStartAssessment: () => void;
  onOpenResearch: () => void;
  onOpenGuide: () => void;
  onImportArchiveFile: (file: File) => void;
  importError: string | null;
  importedRecordCount: number;
  activeParamVersion: string;
}

export function HomePage({
  onStartAssessment,
  onOpenResearch,
  onOpenGuide,
  onImportArchiveFile,
  importError,
  importedRecordCount,
  activeParamVersion,
}: HomePageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-12">
      {/* Warm Sunlit Hero Section */}
      <section className="rounded-3xl bg-gradient-to-br from-[#FFFDF8] via-white to-[#F0FDFA] border border-teal-200/70 p-6 sm:p-10 lg:p-12 shadow-[0_6px_28px_rgba(13,110,110,0.06)] overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#0D6E6E] tracking-wide uppercase">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Prevenzione Informata · ESC SCORE2 · FINDRISC · WCRF/AICR &amp; AIRC
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-[1.12]">
              Conosci le tue abitudini,{' '}
              <span className="text-[#0D6E6E]">costruisci la tua prevenzione</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              <strong>ClinicaPrev</strong> è uno spazio chiaro, gratuito e accessibile per capire
              come alimentazione, movimento, fumo e parametri di base influenzano il rischio
              preventivo di malattie cardiovascolari, diabete di tipo 2 e tumori — basato
              esclusivamente su protocolli scientifici riconosciuti a livello internazionale.
            </p>

            {/* Primary & Secondary Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={onStartAssessment}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-[#0D6E6E] rounded-xl hover:bg-[#0A5757] transition-colors shadow-sm cursor-pointer"
              >
                Inizia la Valutazione
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-[#0D6E6E] bg-white border border-teal-200 rounded-xl hover:bg-teal-50/70 transition-colors cursor-pointer"
              >
                <FileUp className="w-4 h-4" />
                Carica un Tuo File Precedente (.json)
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                aria-label="Carica un file personale di analisi ClinicaPrev"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onImportArchiveFile(file);
                    e.target.value = '';
                  }
                }}
              />
            </div>

            {importError && (
              <div
                role="alert"
                className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-900"
              >
                {importError}
              </div>
            )}

            {importedRecordCount > 0 && (
              <p className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 inline-block">
                Storico personale caricato localmente ({importedRecordCount}{' '}
                {importedRecordCount === 1 ? 'rilevazione' : 'rilevazioni'}): aggiorna i tuoi dati
                in Valutazione per vedere i progressi nel tempo.
              </p>
            )}

            {/* Clear Privacy & Educational Disclaimer Card right in the Hero */}
            <div className="rounded-2xl bg-amber-50/75 border border-amber-200/90 p-4 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed space-y-1">
                <p>
                  <strong className="text-slate-900">
                    Nessun dato salvato sul sito · Scopo puramente informativo e divulgativo:
                  </strong>{' '}
                  non serve registrarsi e i tuoi dati personali non vengono mai inviati o salvati
                  sui nostri server. Se desideri monitorare i tuoi miglioramenti nel tempo, puoi
                  scaricare un file personale sul tuo dispositivo e ricaricarlo quando vuoi.
                </p>
                <button
                  type="button"
                  onClick={onOpenGuide}
                  className="font-semibold text-[#0D6E6E] hover:underline cursor-pointer"
                >
                  Leggi il disclaimer medico-legale completo e i protocolli →
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden border border-teal-100/90 bg-[#FAF9F5] shadow-sm">
              <img
                src={preventiveHealthImg}
                alt="Illustrazione di uno stile di vita attivo e sano tra natura mediterranea e benessere preventivo"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What it is & How it works in 3 Steps */}
      <section aria-labelledby="how-it-works-heading" className="space-y-6">
        <div className="max-w-2xl space-y-2">
          <p className="text-xs font-mono font-semibold text-[#0D6E6E] uppercase tracking-wide">
            Come funziona
          </p>
          <h2 id="how-it-works-heading" className="text-2xl sm:text-3xl font-bold text-slate-900">
            Tre passi semplici, trasparenti e 100% privati
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Abbiamo tradotto protocolli medici validati in un percorso chiaro che ti aiuta a capire
            quali abitudini contano di più e a preparare domande utili per il tuo medico.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <article className="bg-white border border-stone-200 border-t-2 border-t-sky-400 rounded-2xl p-6 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-xs font-mono text-sky-700 font-semibold">PASSO 01</p>
            <h3 className="text-lg font-bold text-slate-900">Racconta le tue abitudini</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Inserisci parametri semplici (età, altezza, peso, pressione, dieta, allenamenti e
              passi giornalieri). Colesterolo e passi sono opzionali: se non li conosci, usiamo le
              mediane europee.
            </p>
          </article>

          <article className="bg-white border border-stone-200 border-t-2 border-t-teal-500 rounded-2xl p-6 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D6E6E] flex items-center justify-center">
              <HeartPulse className="w-5 h-5" />
            </div>
            <p className="text-xs font-mono text-[#0D6E6E] font-semibold">PASSO 02</p>
            <h3 className="text-lg font-bold text-slate-900">Confronta e simula miglioramenti</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ottieni i profili Cardiovascolare (ESC SCORE2), Diabete Tipo 2 (FINDRISC) e
              Oncologia Preventiva (WCRF/AICR &amp; AIRC), confrontati graficamente con la
              popolazione europea della tua età.
            </p>
          </article>

          <article className="bg-white border border-stone-200 border-t-2 border-t-orange-400 rounded-2xl p-6 space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-xs font-mono text-orange-700 font-semibold">PASSO 03</p>
            <h3 className="text-lg font-bold text-slate-900">Salva il tuo file e segui i progressi</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Scarica un file personale datato sul tuo dispositivo: tra qualche mese (es. dopo aver
              smesso di fumare o iniziato a fare sport) potrai ricaricarlo e vedere il grafico del
              tuo miglioramento senza salvare nulla sul sito.
            </p>
          </article>
        </div>
      </section>

      {/* Two Illustrated Editorial Feature Blocks */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <article className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="aspect-[4/3] w-full overflow-hidden bg-[#FAF9F5] border-b border-stone-100">
            <img
              src={mediterraneanNutritionImg}
              alt="Illustrazione di alimenti freschi della dieta mediterranea: olio d'oliva, agrumi, verdure a foglia verde, pomodori e cereali integrali"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 sm:p-7 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2.5">
              <p className="text-xs font-mono font-semibold text-emerald-700 uppercase">
                Fattori Modificabili · Dieta &amp; Movimento
              </p>
              <h3 className="text-xl font-bold text-slate-900">
                Oltre il 40% del rischio dipende da scelte quotidiane
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Secondo OMS, WCRF/AICR e Fondazione AIRC, alimentazione mediterranea ricca di fibre,
                riduzione di alcol e alimenti ultra-processati, stop al fumo ed esercizio combinato
                (aerobico + forza) producono riduzioni misurabili del rischio. Il simulatore integrato
                ti mostra subito l’impatto stimato di ciascun cambiamento.
              </p>
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={onStartAssessment}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D6E6E] hover:underline cursor-pointer"
              >
                Prova subito il calcolatore preventivo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </article>

        <article className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="aspect-[4/3] w-full overflow-hidden bg-[#FAF9F5] border-b border-stone-100">
            <img
              src={scientificEvidenceImg}
              alt="Illustrazione di ricerca scientifica verificata con quaderno di grafici e lente d'ingrandimento"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 sm:p-7 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2.5">
              <p className="text-xs font-mono font-semibold text-[#0D6E6E] uppercase">
                Fonti Peer-Reviewed · Parametri {activeParamVersion}
              </p>
              <h3 className="text-xl font-bold text-slate-900">
                Monitoraggio da PubMed, Google Scholar e Fondazione AIRC
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                L’osservatorio scientifico integra pubblicazioni accademiche verificate e una
                tabella parametri versionata con limiti di sicurezza (<em>guardrail</em>), mentre i
                protocolli clinici primari restano ancorati alle linee guida validate.
              </p>
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={onOpenResearch}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D6E6E] hover:underline cursor-pointer"
              >
                Esplora l’Osservatorio Ricerca &amp; Parametri
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </article>
      </section>

      {/* Dedicated Privacy & Legal Clarity Strip */}
      <section
        aria-labelledby="home-privacy-heading"
        className="rounded-2xl bg-white border border-stone-200 p-6 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-start"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-emerald-800 font-semibold text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 id="home-privacy-heading">Privacy by design: i tuoi dati restano tuoi</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            ClinicaPrev non richiede registrazione, non traccia profili sanitari e{' '}
            <strong className="text-slate-900">
              non salva mai i tuoi dati biometrici o le tue risposte sui nostri server
            </strong>
            . Tutti i calcoli avvengono localmente nel tuo browser, senza alcun database remoto
            né salvataggio di dati personali sul sito.
          </p>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-amber-900 font-semibold text-sm">
            <BookOpen className="w-5 h-5 text-amber-600" />
            <h2>Strumento esclusivamente informativo e divulgativo</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            I punteggi mostrati sono stime statistiche basate su coorti di popolazione: non
            costituiscono diagnosi, non sostituiscono la visita del Medico di Medicina Generale o
            dello specialista e non vanno usati per prendere decisioni terapeutiche autonome.
          </p>
        </div>
      </section>
    </div>
  );
}
