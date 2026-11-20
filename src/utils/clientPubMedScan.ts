import {
  BASELINE_EMERGING_TRENDS,
  BASELINE_MONTHLY_SERIES,
  BASELINE_PUBLICATIONS,
} from '../data/clinicalProtocols';
import type { AcademicPublication, MonitoringDigestResponse } from '../types/clinical';
import {
  computeMonthlyScanEligibility,
  MONTHLY_SCAN_COOLDOWN_DAYS,
} from './scanPolicy';
import { extractPubMedAbstractsFromXml } from './sourceReader';

export const STATIC_BASELINE_VERIFIED_ISO = '2026-11-20T00:00:00.000Z';
export const LOCAL_DIGEST_STORAGE_KEY = 'clinicaprev_public_digest_v1';

interface PubMedSummaryDoc {
  uid: string;
  title?: string;
  sortfirstauthor?: string;
  authors?: Array<{ name?: string }>;
  fulljournalname?: string;
  source?: string;
  pubdate?: string;
}

const DOMAIN_QUERIES: Array<{
  domain: 'oncology' | 'cardiovascular' | 'metabolic';
  term: string;
}> = [
  {
    domain: 'oncology',
    term: '(cancer prevention[Title/Abstract]) AND (lifestyle OR diet OR screening) AND (meta-analysis[Publication Type] OR guideline[Publication Type] OR review[Publication Type])',
  },
  {
    domain: 'cardiovascular',
    term: '(cardiovascular risk[Title/Abstract]) AND (SCORE2 OR primary prevention) AND (2024:2026[DP])',
  },
  {
    domain: 'metabolic',
    term: '(type 2 diabetes prevention[Title/Abstract]) AND (FINDRISC OR lifestyle intervention OR physical activity) AND (2024:2026[DP])',
  },
];

export function buildStaticBaselineDigest(nowMs: number = Date.now()): MonitoringDigestResponse {
  const eligibility = computeMonthlyScanEligibility(STATIC_BASELINE_VERIFIED_ISO, nowMs);
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

/**
 * Picks the most recent digest across available sources (Firestore, local cache, baseline)
 * and recomputes the live 30-day manual click cooldown.
 */
export function selectFreshestDigest(
  candidates: Array<MonitoringDigestResponse | null | undefined>,
  nowMs: number = Date.now()
): MonitoringDigestResponse {
  const valid = candidates.filter(
    (c): c is MonitoringDigestResponse =>
      Boolean(c && typeof c.lastMonthlyScanIso === 'string' && Array.isArray(c.publications))
  );

  if (valid.length === 0) {
    return buildStaticBaselineDigest(nowMs);
  }

  let newest = valid[0];
  let newestMs = new Date(newest.lastMonthlyScanIso).getTime() || 0;

  for (let i = 1; i < valid.length; i += 1) {
    const candidateMs = new Date(valid[i].lastMonthlyScanIso).getTime() || 0;
    if (candidateMs > newestMs) {
      newest = valid[i];
      newestMs = candidateMs;
    }
  }

  const eligibility = computeMonthlyScanEligibility(newest.lastMonthlyScanIso, nowMs);
  return {
    ...newest,
    cadenceDays: MONTHLY_SCAN_COOLDOWN_DAYS,
    canRunScan: eligibility.canRunScan,
    daysUntilNextScan: eligibility.daysUntilNextScan,
    nextScheduledScanIso: eligibility.nextScheduledScanIso,
  };
}

/**
 * Pure builder that merges freshly retrieved PubMed articles with the validated baseline
 * and locks the next manual check for 30 days.
 */
export function buildClientMonthlyDigestFromArticles(
  liveArticles: AcademicPublication[],
  nowMs: number = Date.now()
): MonitoringDigestResponse {
  const nowIso = new Date(nowMs).toISOString();
  const eligibility = computeMonthlyScanEligibility(nowIso, nowMs);

  const seenPmids = new Set<string>();
  const seenTitles = new Set<string>();
  const merged: AcademicPublication[] = [];

  for (const pub of [...liveArticles, ...BASELINE_PUBLICATIONS]) {
    const normTitle = pub.title.trim().toLowerCase();
    if (pub.pmid && seenPmids.has(pub.pmid)) continue;
    if (seenTitles.has(normTitle)) continue;
    if (pub.pmid) seenPmids.add(pub.pmid);
    seenTitles.add(normTitle);
    merged.push(pub);
  }

  return {
    lastMonthlyScanIso: nowIso,
    nextScheduledScanIso: eligibility.nextScheduledScanIso,
    cadenceDays: MONTHLY_SCAN_COOLDOWN_DAYS,
    canRunScan: eligibility.canRunScan,
    daysUntilNextScan: eligibility.daysUntilNextScan,
    scanMessage:
      liveArticles.length > 0
        ? `Controllo manuale completato su NCBI PubMed (${liveArticles.length} articoli recenti verificati). Prossimo controllo sbloccabile tra ${MONTHLY_SCAN_COOLDOWN_DAYS} giorni.`
        : `Controllo manuale completato: nessuna nuova pubblicazione extra rispetto all’archivio validato. Prossimo controllo sbloccabile tra ${MONTHLY_SCAN_COOLDOWN_DAYS} giorni.`,
    sourcesTracked: ['NCBI PubMed', 'Google Scholar', 'Fondazione AIRC'],
    livePubMedCount: liveArticles.length,
    aiSynthesisNote: null,
    aiSynthesisError: null,
    monthlySeries: BASELINE_MONTHLY_SERIES,
    emergingTrends: BASELINE_EMERGING_TRENDS,
    publications: merged,
    groundingSources: [],
  };
}

export function readCachedLocalDigest(): MonitoringDigestResponse | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(LOCAL_DIGEST_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MonitoringDigestResponse;
    if (
      !parsed ||
      typeof parsed.lastMonthlyScanIso !== 'string' ||
      !Array.isArray(parsed.publications)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeCachedLocalDigest(digest: MonitoringDigestResponse): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(LOCAL_DIGEST_STORAGE_KEY, JSON.stringify(digest));
  } catch {
    // Ignore storage quota or private browsing restrictions
  }
}

async function fetchBrowserPubMedDomain(
  searchTerm: string,
  domain: 'oncology' | 'cardiovascular' | 'metabolic',
  fetchImpl: typeof fetch,
  maxResults = 2
): Promise<AcademicPublication[]> {
  try {
    const esearchUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi');
    esearchUrl.searchParams.set('db', 'pubmed');
    esearchUrl.searchParams.set('term', searchTerm);
    esearchUrl.searchParams.set('retmode', 'json');
    esearchUrl.searchParams.set('sort', 'pub_date');
    esearchUrl.searchParams.set('retmax', String(maxResults));

    const searchRes = await fetchImpl(esearchUrl.toString());
    if (!searchRes.ok) return [];
    const searchJson = (await searchRes.json()) as {
      esearchresult?: { idlist?: string[] };
    };
    const ids = searchJson.esearchresult?.idlist ?? [];
    if (ids.length === 0) return [];

    const summaryUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi');
    summaryUrl.searchParams.set('db', 'pubmed');
    summaryUrl.searchParams.set('id', ids.join(','));
    summaryUrl.searchParams.set('retmode', 'json');

    const efetchUrl = new URL('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi');
    efetchUrl.searchParams.set('db', 'pubmed');
    efetchUrl.searchParams.set('id', ids.join(','));
    efetchUrl.searchParams.set('retmode', 'xml');

    const [sumRes, xmlRes] = await Promise.all([
      fetchImpl(summaryUrl.toString()),
      fetchImpl(efetchUrl.toString()).catch(() => null),
    ]);
    if (!sumRes.ok) return [];

    const sumJson = (await sumRes.json()) as {
      result?: Record<string, PubMedSummaryDoc>;
    };
    const rawXml = xmlRes && xmlRes.ok ? await xmlRes.text() : '';
    const abstractsByPmid = extractPubMedAbstractsFromXml(rawXml);

    const items: AcademicPublication[] = [];
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
      items.push({
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
          'Pubblicazione recente recuperata su richiesta manuale dal database pubblico NCBI PubMed.',
        clinicalRelevance:
          domain === 'oncology'
            ? 'Aggiornamento epidemiologico per prevenzione oncologica.'
            : domain === 'cardiovascular'
              ? 'Evidenza clinica per prevenzione cardiovascolare.'
              : 'Evidenza clinica per prevenzione metabolica e diabete di tipo 2.',
        abstractSnippet: abstractText ? abstractText.slice(0, 1400) : undefined,
      });
    }
    return items;
  } catch {
    return [];
  }
}

/**
 * Manual-click-only 30-day PubMed check that runs directly in the browser (works on GitHub Pages
 * with zero backend). Enforces strict 30-day cooldown before performing any external request.
 */
export async function runBrowserPubMedMonthlyScan(
  currentDigest: MonitoringDigestResponse,
  options?: { nowMs?: number; fetchImpl?: typeof fetch }
): Promise<MonitoringDigestResponse> {
  const nowMs = options?.nowMs ?? Date.now();
  const eligibility = computeMonthlyScanEligibility(currentDigest.lastMonthlyScanIso, nowMs);

  // Strict 30-day lock: zero network requests if <30 days have elapsed
  if (!eligibility.canRunScan) {
    return {
      ...currentDigest,
      canRunScan: false,
      daysUntilNextScan: eligibility.daysUntilNextScan,
      nextScheduledScanIso: eligibility.nextScheduledScanIso,
      scanMessage: `Controllo già eseguito di recente. Il prossimo controllo manuale sarà sbloccato tra ${eligibility.daysUntilNextScan} ${
        eligibility.daysUntilNextScan === 1 ? 'giorno' : 'giorni'
      }.`,
    };
  }

  const fetchImpl = options?.fetchImpl ?? fetch;
  const results = await Promise.all(
    DOMAIN_QUERIES.map((q) => fetchBrowserPubMedDomain(q.term, q.domain, fetchImpl, 2))
  );
  const liveArticles = results.flat();
  return buildClientMonthlyDigestFromArticles(liveArticles, nowMs);
}
