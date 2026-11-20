import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lightbulb,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import type { SourceReaderDocument } from '../utils/sourceReader';

interface SourceReaderViewProps {
  doc: SourceReaderDocument;
  backLabel: string;
  onBack: () => void;
  onGoToAssessment: () => void;
}

export function SourceReaderView({
  doc,
  backLabel,
  onBack,
  onGoToAssessment,
}: SourceReaderViewProps) {
  return (
    <article className="max-w-3xl mx-auto space-y-6">
      {/* Top Return Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-stone-200 rounded-xl hover:border-[#0D6E6E] hover:text-[#0D6E6E] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5 text-[#0D6E6E]" />
          <span>~{doc.readingTimeMinutes} min di lettura semplice</span>
        </div>
      </div>

      {/* Main Editorial Reading Sheet */}
      <div className="bg-white border border-stone-200/90 rounded-2xl shadow-[0_4px_24px_rgba(15,23,42,0.04)] overflow-hidden">
        {/* Header Band */}
        <header className="bg-gradient-to-br from-[#FFFDF8] via-white to-[#F0FDFA] border-b border-teal-100/80 p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#0D6E6E] bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded-md">
              <BookOpen className="w-3.5 h-3.5" />
              {doc.kindLabel}
            </span>
            <span className="font-mono text-slate-600 bg-stone-100 px-2.5 py-1 rounded-md">
              {doc.domainLabel}
            </span>
            {doc.pmid && (
              <span className="font-mono text-slate-500">PMID {doc.pmid}</span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-snug">
            {doc.headlineIt}
          </h1>

          {doc.originalTitle && (
            <p className="text-xs text-slate-500 italic leading-relaxed">
              Titolo originale: “{doc.originalTitle}”
            </p>
          )}

          <div className="pt-2 border-t border-stone-200/70 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="space-y-0.5">
              <p className="font-medium text-slate-800">{doc.journalOrVenue}</p>
              <p className="text-slate-500">
                {doc.authorsOrOrg} · {doc.publishedDateOrScope}
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50/80 border border-emerald-200/80 px-2.5 py-1 rounded-md font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>{doc.evidenceLevel}</span>
            </div>
          </div>

          {doc.trendStats && (
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-mono text-slate-700">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                +{doc.trendStats.growthPctYoY}% pubblicazioni nell’ultimo anno
              </span>
              <span className="text-slate-500">
                ~{doc.trendStats.monthlyPublications} studi/mese nel settore
              </span>
            </div>
          )}
        </header>

        {/* Body Sections */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* 1. In 30 Seconds */}
          <section aria-labelledby="reader-summary-heading" className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wide text-[#0D6E6E]">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 id="reader-summary-heading">In 30 secondi · Di cosa si tratta</h2>
            </div>
            <div className="rounded-xl bg-[#F4FBFB] border border-teal-100 p-5">
              <p className="text-base text-slate-800 leading-relaxed">{doc.plainSummary}</p>
            </div>
          </section>

          {/* 2. Key Takeaways in Numbers */}
          <section aria-labelledby="reader-takeaways-heading" className="space-y-3">
            <h2
              id="reader-takeaways-heading"
              className="text-base font-bold text-slate-900 flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              I punti chiave da ricordare
            </h2>
            <ul className="space-y-3">
              {doc.keyTakeaways.map((point, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-xl bg-[#FAF9F5] border border-stone-200/80 p-4 text-sm text-slate-700 leading-relaxed"
                >
                  <span className="w-6 h-6 rounded-full bg-teal-50 text-[#0D6E6E] font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 border border-teal-200/80">
                    {idx + 1}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 3. Practical Meaning for Lifestyle & ClinicaPrev */}
          <section aria-labelledby="reader-practical-heading" className="space-y-3">
            <h2
              id="reader-practical-heading"
              className="text-base font-bold text-slate-900 flex items-center gap-2"
            >
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
              Cosa significa nella pratica (e su ClinicaPrev)
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
              {doc.practicalMeaning}
            </p>
            <div>
              <button
                type="button"
                onClick={onGoToAssessment}
                className="text-xs font-semibold text-[#0D6E6E] hover:underline cursor-pointer"
              >
                Verifica come questo fattore incide sul tuo profilo nella Valutazione →
              </button>
            </div>
          </section>

          {/* 4. Study Limits & Scientific Balance */}
          <section
            aria-labelledby="reader-limits-heading"
            className="rounded-xl bg-amber-50/55 border border-amber-200/80 p-5 space-y-2"
          >
            <h2
              id="reader-limits-heading"
              className="text-sm font-bold text-slate-900 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              Limiti dello studio e avvertenza divulgativa
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{doc.studyLimits}</p>
            <p className="text-xs text-slate-600 pt-1 border-t border-amber-200/60">
              {doc.generatedBy === 'monthly_scan_ai'
                ? 'Riassunto divulgativo generato durante l’aggiornamento periodico (ogni 30 giorni) a partire dall’abstract ufficiale della fonte.'
                : doc.generatedBy === 'metadata_fallback'
                  ? 'Scheda sintetica costruita dai metadati ufficiali della pubblicazione.'
                  : 'Scheda divulgativa curata sulla base della pubblicazione scientifica citata.'}{' '}
              Riferimento puramente informativo: non sostituisce la lettura integrale né il parere
              del medico.
            </p>
          </section>

          {/* 5. Original Publication Link Footer */}
          <footer className="pt-4 border-t border-stone-200 space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-mono uppercase tracking-wide text-slate-500">
                Fonte Scientifica Originale
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">{doc.citationText}</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <a
                href={doc.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#0D6E6E] rounded-xl hover:bg-[#0A5656] transition-colors shadow-xs"
              >
                {doc.sourceCtaLabel}
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-stone-100 hover:bg-stone-200/80 rounded-xl transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {backLabel}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </article>
  );
}
