import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import {
  BASELINE_EMERGING_TRENDS,
  BASELINE_MONTHLY_SERIES,
  BASELINE_PUBLICATIONS,
} from '../src/data/clinicalProtocols';
import type {
  AcademicPublication,
  EmergingTrendItem,
  MonitoringDigestResponse,
} from '../src/types/clinical';
import {
  computeMonthlyScanEligibility,
  MONTHLY_SCAN_COOLDOWN_DAYS,
} from '../src/utils/scanPolicy';
import {
  extractPubMedAbstractsFromXml,
  parseBatchSummariesJson,
} from '../src/utils/sourceReader';

const CACHE_DIR = path.resolve(process.cwd(), '.cache');
const DIGEST_CACHE_FILE = path.join(CACHE_DIR, 'monthly-monitoring-digest.json');

// Date of the validated curated baseline dataset (PubMed + Google Scholar + Fondazione AIRC).
// Prevents immediate redundant API calls on boot while unlocking on-demand refresh once 30 days elapse.
const BASELINE_VERIFIED_ISO = '2026-11-20T00:00:00.000Z';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'Chiave API non configurata sul server. Configura la chiave nei Secrets per abilitare l’aggiornamento periodico.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface PubMedSummaryDoc {
  uid: string;
  title?: string;
  sortfirstauthor?: string;
  authors?: Array<{ name?: string }>;
  fulljournalname?: string;
  source?: string;
  pubdate?: string;
}

export async function fetchLivePubMedArticles(
  searchTerm: string,
  domain: 'oncology' | 'cardiovascular' | 'metabolic',
  maxResults = 3
): Promise<AcademicPublication[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5500);

    const esearchUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi');
    esearchUrl.searchParams.set('db', 'pubmed');
    esearchUrl.searchParams.set('term', searchTerm);
    esearchUrl.searchParams.set('retmode', 'json');
    esearchUrl.searchParams.set('sort', 'pub_date');
    esearchUrl.searchParams.set('retmax', String(maxResults));

    const searchRes = await fetch(esearchUrl.toString(), { signal: controller.signal });
    if (!searchRes.ok) {
      clearTimeout(timeout);
      return [];
    }
    const searchJson = (await searchRes.json()) as {
      esearchresult?: { idlist?: string[] };
    };
    const ids = searchJson.esearchresult?.idlist ?? [];
    if (ids.length === 0) {
      clearTimeout(timeout);
      return [];
    }

    const summaryUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi');
    summaryUrl.searchParams.set('db', 'pubmed');
    summaryUrl.searchParams.set('id', ids.join(','));
    summaryUrl.searchParams.set('retmode', 'json');

    const efetchUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi');
    efetchUrl.searchParams.set('db', 'pubmed');
    efetchUrl.searchParams.set('id', ids.join(','));
    efetchUrl.searchParams.set('retmode', 'xml');

    const [sumRes, xmlRes] = await Promise.all([
      fetch(summaryUrl.toString(), { signal: controller.signal }),
      fetch(efetchUrl.toString(), { signal: controller.signal }).catch(() => null),
    ]);
    clearTimeout(timeout);
    if (!sumRes.ok) return [];

    const sumJson = (await sumRes.json()) as {
      result?: Record<string, PubMedSummaryDoc>;
    };
    const rawXml = xmlRes && xmlRes.ok ? await xmlRes.text() : '';
    const abstractsByPmid = extractPubMedAbstractsFromXml(rawXml);

    const results: AcademicPublication[] = [];

    for (const id of ids) {
      const doc = sumJson.result?.[id];
      if (!doc || !doc.title) continue;
      const authorNames =
        doc.authors && doc.authors.length > 0
          ? doc.authors
              .slice(0, 3)
              .map((a) => a.name)
              .filter(Boolean)
              .join(', ') + (doc.authors.length > 3 ? ', et al.' : '')
          : doc.sortfirstauthor || 'Autori indicizzati PubMed';

      const abstractText = abstractsByPmid[id];

      results.push({
        id: `pubmed-live-${id}`,
        title: doc.title.replace(/\.$/, ''),
        authors: authorNames,
        journal: doc.fulljournalname || doc.source || 'PubMed Indexed Journal',
        publishedDate: doc.pubdate || 'Recente',
        database: 'PubMed',
        domain,
        pmid: id,
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        keyFinding:
          'Pubblicazione recente recuperata dal database NCBI PubMed E-utilities nell’ultima scansione periodica.',
        clinicalRelevance:
          domain === 'oncology'
            ? 'Aggiornamento epidemiologico per prevenzione oncologica.'
            : domain === 'cardiovascular'
              ? 'Evidenza clinica per prevenzione cardiovascolare.'
              : 'Evidenza clinica per prevenzione metabolica e diabete di tipo 2.',
        abstractSnippet: abstractText ? abstractText.slice(0, 1400) : undefined,
      });
    }

    return results;
  } catch {
    return [];
  }
}

async function enrichLivePublicationsWithBatchBriefs(
  ai: GoogleGenAI,
  livePapers: AcademicPublication[]
): Promise<AcademicPublication[]> {
  if (livePapers.length === 0) return livePapers;

  const batchInput = livePapers
    .slice(0, 12)
    .map((p) => ({
      id: p.id,
      domain: p.domain,
      title: p.title,
      journal: p.journal,
      publishedDate: p.publishedDate,
      pmid: p.pmid ?? '',
      abstract: p.abstractSnippet ?? '(Abstract non disponibile in forma aperta)',
    }));

  try {
    const prompt = `Sei un divulgatore scientifico medico. Per ciascuna pubblicazione PubMed seguente, genera una scheda divulgativa chiara in italiano per cittadini non esperti.
REGOLE RIGOROSE:
1. Basati ESCLUSIVAMENTE sul titolo e sull'abstract forniti. NON inventare mai percentuali, campioni numerici o risultati non presenti nel testo fornito.
2. Se l'abstract non è disponibile, dichiaralo con trasparenza in studyLimits e riassumi fedelmente l'argomento dal titolo/rivista.
3. Mantieni un tono chiaro, rassicurante e informativo (mai diagnostico).
4. Restituisci un array JSON con un oggetto per ogni "id" fornito.

Pubblicazioni da riassumere:
${JSON.stringify(batchInput, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: 'ID esatto della pubblicazione in input' },
              headlineIt: {
                type: Type.STRING,
                description: 'Titolo chiaro e divulgativo in italiano (max 120 caratteri)',
              },
              plainSummary: {
                type: Type.STRING,
                description: 'Spiegazione semplice in 3-4 frasi per non esperti (in italiano)',
              },
              keyTakeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 punti chiave sintetici basati solo sull abstract',
              },
              practicalMeaning: {
                type: Type.STRING,
                description: 'Cosa significa nella pratica preventiva quotidiana (1-2 frasi)',
              },
              studyLimits: {
                type: Type.STRING,
                description: 'Limiti metodologici dello studio o assenza abstract (1-2 frasi)',
              },
              evidenceLevel: {
                type: Type.STRING,
                description: 'Tipo di studio (es. Meta-analisi, Studio di coorte, Trial clinico, Review)',
              },
              readingTimeMinutes: {
                type: Type.INTEGER,
                description: 'Minuti stimati di lettura della scheda (1-3)',
              },
            },
            required: [
              'id',
              'headlineIt',
              'plainSummary',
              'keyTakeaways',
              'practicalMeaning',
              'studyLimits',
              'evidenceLevel',
              'readingTimeMinutes',
            ],
          },
        },
      },
    });

    const briefsById = parseBatchSummariesJson(response.text ?? '[]');
    return livePapers.map((paper) => {
      const generated = briefsById[paper.id];
      if (!generated) return paper;
      return {
        ...paper,
        keyFinding: generated.keyTakeaways[0] || generated.plainSummary,
        clinicalRelevance: generated.practicalMeaning,
        readerBrief: generated,
      };
    });
  } catch {
    // Graceful fallback: keep live papers intact without failing the monthly scan
    return livePapers;
  }
}

function attachLiveEligibility(
  digest: Omit<MonitoringDigestResponse, 'canRunScan' | 'daysUntilNextScan'> & {
    canRunScan?: boolean;
    daysUntilNextScan?: number;
  }
): MonitoringDigestResponse {
  const eligibility = computeMonthlyScanEligibility(digest.lastMonthlyScanIso);
  return {
    ...digest,
    cadenceDays: MONTHLY_SCAN_COOLDOWN_DAYS,
    nextScheduledScanIso: eligibility.nextScheduledScanIso,
    canRunScan: eligibility.canRunScan,
    daysUntilNextScan: eligibility.daysUntilNextScan,
  };
}

function buildDefaultDigest(): MonitoringDigestResponse {
  return attachLiveEligibility({
    lastMonthlyScanIso: BASELINE_VERIFIED_ISO,
    nextScheduledScanIso: BASELINE_VERIFIED_ISO,
    cadenceDays: MONTHLY_SCAN_COOLDOWN_DAYS,
    sourcesTracked: [
      'NCBI PubMed (E-utilities)',
      'Google Scholar (Web Grounding IA)',
      'Fondazione AIRC (Prevenzione Oncologica)',
      'ESC / WCRF / WHO / IDF Guidelines',
    ],
    livePubMedCount: 0,
    aiSynthesisNote: null,
    aiSynthesisError: null,
    monthlySeries: BASELINE_MONTHLY_SERIES,
    emergingTrends: BASELINE_EMERGING_TRENDS,
    publications: BASELINE_PUBLICATIONS,
    groundingSources: [
      {
        title: 'Fondazione AIRC — Prevenzione dei tumori e stili di vita',
        uri: 'https://www.airc.it/cancro/prevenzione-tumore',
      },
      {
        title: 'ESC SCORE2 Risk Prediction Algorithms — PubMed (PMID 34120177)',
        uri: 'https://pubmed.ncbi.nlm.nih.gov/34120177/',
      },
      {
        title: 'FINDRISC Diabetes Risk Score — PubMed (PMID 12610029)',
        uri: 'https://pubmed.ncbi.nlm.nih.gov/12610029/',
      },
      {
        title: 'Daily Step Count & Mortality Meta-Analysis — PubMed (PMID 37555441)',
        uri: 'https://pubmed.ncbi.nlm.nih.gov/37555441/',
      },
    ],
  });
}

let cachedDigest: MonitoringDigestResponse | null = null;
let inFlightScan: Promise<MonitoringDigestResponse> | null = null;

function persistDigest(digest: MonitoringDigestResponse): void {
  cachedDigest = digest;
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(DIGEST_CACHE_FILE, JSON.stringify(digest, null, 2), 'utf-8');
  } catch {
    // Keep in-memory cache if filesystem is read-only
  }
}

export function getStoredMonthlyDigest(): MonitoringDigestResponse {
  if (cachedDigest) {
    return attachLiveEligibility(cachedDigest);
  }
  try {
    if (fs.existsSync(DIGEST_CACHE_FILE)) {
      const parsed = JSON.parse(
        fs.readFileSync(DIGEST_CACHE_FILE, 'utf-8')
      ) as MonitoringDigestResponse;
      if (parsed && Array.isArray(parsed.publications)) {
        const baselinePubMap = new Map(BASELINE_PUBLICATIONS.map((b) => [b.id, b]));
        const baselineTrendMap = new Map(BASELINE_EMERGING_TRENDS.map((t) => [t.id, t]));

        const enrichedExistingPubs = parsed.publications.map((p) => {
          const base = baselinePubMap.get(p.id);
          if (base && !p.readerBrief && base.readerBrief) {
            return { ...p, readerBrief: base.readerBrief };
          }
          return p;
        });

        const seenIds = new Set(enrichedExistingPubs.map((p) => p.id));
        const missingBaseline = BASELINE_PUBLICATIONS.filter((b) => !seenIds.has(b.id));
        const mergedSources = Array.from(
          new Set([
            ...(Array.isArray(parsed.sourcesTracked) ? parsed.sourcesTracked : []),
            'Fondazione AIRC (Prevenzione Oncologica)',
          ])
        );
        const enrichedTrends = Array.isArray(parsed.emergingTrends)
          ? parsed.emergingTrends.map((t) => {
              const base = baselineTrendMap.get(t.id);
              if (base) {
                return {
                  ...t,
                  url: t.url ?? base.url,
                  readerBrief: t.readerBrief ?? base.readerBrief,
                };
              }
              return t;
            })
          : BASELINE_EMERGING_TRENDS;

        const hydrated = attachLiveEligibility({
          ...parsed,
          sourcesTracked: mergedSources,
          emergingTrends: enrichedTrends,
          publications:
            missingBaseline.length > 0
              ? [...enrichedExistingPubs, ...missingBaseline]
              : enrichedExistingPubs,
        });
        cachedDigest = hydrated;
        return hydrated;
      }
    }
  } catch {
    // Ignore corrupt cache and rebuild baseline
  }
  const baseline = buildDefaultDigest();
  cachedDigest = baseline;
  return baseline;
}

/**
 * Lazy on-demand monthly scan guarded by a strict 30-day server cooldown and
 * an in-flight singleton lock. Never makes external API calls if <30 days have passed.
 */
export async function runMonthlyAcademicScanIfDue(): Promise<MonitoringDigestResponse> {
  const existing = getStoredMonthlyDigest();
  if (!existing.canRunScan) {
    return {
      ...existing,
      scanMessage: `I dati scientifici sono già aggiornati. Un nuovo aggiornamento su richiesta sarà disponibile tra ${existing.daysUntilNextScan} ${
        existing.daysUntilNextScan === 1 ? 'giorno' : 'giorni'
      }.`,
    };
  }

  if (inFlightScan) {
    return inFlightScan;
  }

  inFlightScan = (async () => {
    try {
      const [oncoLive, cvdLive, metLive] = await Promise.all([
        fetchLivePubMedArticles(
          '(cancer prevention[Title/Abstract]) AND (lifestyle OR diet OR ultra-processed[Title/Abstract]) AND ("last 1 year"[PDat])',
          'oncology',
          3
        ),
        fetchLivePubMedArticles(
          '(SCORE2 OR cardiovascular risk prediction[Title/Abstract]) AND (primary prevention[Title/Abstract]) AND ("last 1 year"[PDat])',
          'cardiovascular',
          3
        ),
        fetchLivePubMedArticles(
          '(type 2 diabetes prevention[Title/Abstract]) AND (FINDRISC OR lifestyle intervention[Title/Abstract]) AND ("last 1 year"[PDat])',
          'metabolic',
          3
        ),
      ]);

      let livePapers = [...oncoLive, ...cvdLive, ...metLive];

      const nowIso = new Date().toISOString();
      let aiSynthesisNote: string | null = existing.aiSynthesisNote;
      let aiSynthesisError: string | null = null;
      let groundingSources = [...existing.groundingSources];
      let emergingTrends: EmergingTrendItem[] = [...BASELINE_EMERGING_TRENDS];

      try {
        const ai = getGeminiClient();

        // Single batched structured summary call for any newly retrieved PubMed articles (runs ONLY once per 30 days)
        if (livePapers.length > 0) {
          livePapers = await enrichLivePublicationsWithBatchBriefs(ai, livePapers);
        }

        const pubContext = livePapers
          .slice(0, 6)
          .map((p) => `- [${p.domain}] ${p.title} (${p.journal}, ${p.publishedDate}, PMID ${p.pmid})`)
          .join('\n');

        const prompt = `Sei un ricercatore epidemiologo incaricato dell’aggiornamento periodico della letteratura scientifica su PubMed, Google Scholar e Fondazione AIRC (airc.it) per la prevenzione di tumori, malattie cardiovascolari (ESC SCORE2 / AHA) e diabete/malattie metaboliche (FINDRISC / ADA).

Cerca sul web le novità cliniche e le pubblicazioni accademiche più recenti su PubMed, Google Scholar e Fondazione AIRC riguardanti:
1. Fattori di rischio modificabili in oncologia preventiva (AIRC, WCRF/IARC, alimenti ultra-processati, alcol, attività fisica combinata e passi giornalieri)
2. Prevenzione cardiovascolare primaria (ESC SCORE2, Lipoproteina(a), passi giornalieri, ipertensione, dieta)
3. Prevenzione del diabete di tipo 2 e sindrome metabolica

Articoli appena recuperati da NCBI PubMed E-utilities:
${pubContext || '(Nessun articolo live aggiuntivo recuperato nella chiamata corrente)'}

Scrivi una sintesi periodica concisa in italiano (massimo 180 parole) evidenziando i 3 trend emergenti più solidi e verificabili emersi nelle pubblicazioni accademiche recenti, citando riviste peer-reviewed o linee guida (inclusa Fondazione AIRC ove pertinente).`;

        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        aiSynthesisNote = (response.text ?? '').trim() || null;

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (Array.isArray(chunks) && chunks.length > 0) {
          const extracted = chunks
            .map((c) => c.web)
            .filter((w): w is { uri?: string; title?: string } => Boolean(w && w.uri))
            .map((w) => ({
              title: w.title || w.uri || 'Fonte Web Verificata',
              uri: w.uri!,
            }));
          if (extracted.length > 0) {
            const uniqueMap = new Map<string, { title: string; uri: string }>();
            for (const item of [...extracted, ...existing.groundingSources]) {
              if (!uniqueMap.has(item.uri)) {
                uniqueMap.set(item.uri, item);
              }
            }
            groundingSources = Array.from(uniqueMap.values()).slice(0, 10);
          }
        }

        if (livePapers.length > 0) {
          emergingTrends = BASELINE_EMERGING_TRENDS.map((t) => ({ ...t }));
        }
      } catch (err) {
        aiSynthesisError =
          err instanceof Error
            ? err.message
            : 'Errore durante la sintesi IA su PubMed, Google Scholar e AIRC.';
      }

      const mergedPubs: AcademicPublication[] = [...livePapers];
      const seenPmids = new Set(livePapers.map((p) => p.pmid).filter(Boolean));
      for (const base of BASELINE_PUBLICATIONS) {
        if (!base.pmid || !seenPmids.has(base.pmid)) {
          mergedPubs.push(base);
        }
      }

      const updated = attachLiveEligibility({
        lastMonthlyScanIso: nowIso,
        nextScheduledScanIso: nowIso,
        cadenceDays: MONTHLY_SCAN_COOLDOWN_DAYS,
        scanMessage: 'Fonti scientifiche aggiornate con successo per i prossimi 30 giorni.',
        sourcesTracked: [
          'NCBI PubMed (E-utilities)',
          'Google Scholar (Web Grounding IA)',
          'Fondazione AIRC (Prevenzione Oncologica)',
          'ESC / WCRF / WHO / IDF Guidelines',
        ],
        livePubMedCount: livePapers.length,
        aiSynthesisNote,
        aiSynthesisError,
        monthlySeries: BASELINE_MONTHLY_SERIES,
        emergingTrends,
        publications: mergedPubs,
        groundingSources,
      });

      persistDigest(updated);
      return updated;
    } finally {
      inFlightScan = null;
    }
  })();

  return inFlightScan;
}
