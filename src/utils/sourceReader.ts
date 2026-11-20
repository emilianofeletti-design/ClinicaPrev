import type {
  AcademicPublication,
  EmergingTrendItem,
  ReaderBrief,
} from '../types/clinical';
import {
  BASELINE_EMERGING_TRENDS,
  BASELINE_PUBLICATIONS,
  type ProtocolMetadata,
} from '../data/clinicalProtocols';

export type SourceKind = 'publication' | 'trend' | 'protocol';

export interface SourceReaderDocument {
  id: string;
  kind: SourceKind;
  kindLabel: string;
  domainLabel: string;
  sourceLabel: string;
  headlineIt: string;
  originalTitle?: string;
  authorsOrOrg: string;
  journalOrVenue: string;
  publishedDateOrScope: string;
  pmid?: string;
  citationText: string;
  sourceUrl: string;
  sourceCtaLabel: string;
  evidenceLevel: string;
  readingTimeMinutes: number;
  plainSummary: string;
  keyTakeaways: string[];
  practicalMeaning: string;
  studyLimits: string;
  generatedBy: ReaderBrief['generatedBy'];
  trendStats?: {
    growthPctYoY: number;
    monthlyPublications: number;
  };
}

const DOMAIN_ITALIAN_LABELS: Record<'oncology' | 'cardiovascular' | 'metabolic', string> = {
  oncology: 'Oncologia Preventiva',
  cardiovascular: 'Prevenzione Cardiovascolare',
  metabolic: 'Diabete & Metabolismo',
};

function getSourceCtaLabel(url: string, databaseOrOrg: string): string {
  if (url.includes('pubmed.ncbi.nlm.nih.gov')) {
    return 'Leggi la pubblicazione originale su PubMed';
  }
  if (url.includes('airc.it')) {
    return 'Leggi la guida completa su Fondazione AIRC';
  }
  if (databaseOrOrg.toLowerCase().includes('scholar')) {
    return 'Apri la fonte accademica originale';
  }
  return 'Leggi la pubblicazione originale';
}

function normalizeBrief(brief: ReaderBrief): ReaderBrief {
  return {
    headlineIt: brief.headlineIt.trim(),
    plainSummary: brief.plainSummary.trim(),
    keyTakeaways: brief.keyTakeaways.map((k) => k.trim()).filter(Boolean),
    practicalMeaning: brief.practicalMeaning.trim(),
    studyLimits: brief.studyLimits.trim(),
    evidenceLevel: brief.evidenceLevel.trim() || 'Letteratura peer-reviewed',
    readingTimeMinutes: Math.max(1, Math.min(8, Math.round(brief.readingTimeMinutes || 2))),
    generatedBy: brief.generatedBy,
  };
}

export function buildReaderFromPublication(pub: AcademicPublication): SourceReaderDocument {
  const baselineMatch = BASELINE_PUBLICATIONS.find(
    (b) => b.id === pub.id || (pub.pmid && b.pmid === pub.pmid)
  );
  const rawBrief = pub.readerBrief ?? baselineMatch?.readerBrief;

  const brief: ReaderBrief = rawBrief
    ? normalizeBrief(rawBrief)
    : {
        headlineIt: pub.title,
        plainSummary: pub.abstractSnippet
          ? `${pub.keyFinding} Sintesi dell’abstract originale: ${pub.abstractSnippet}`
          : `${pub.keyFinding} Questa pubblicazione recente è stata indicizzata da ${pub.database} (${pub.journal}) nell’area ${DOMAIN_ITALIAN_LABELS[pub.domain]}.`,
        keyTakeaways: [
          pub.keyFinding,
          pub.clinicalRelevance,
          `Pubblicato su ${pub.journal} (${pub.publishedDate})${pub.pmid ? ` · Codice identificativo PubMed PMID ${pub.pmid}` : ''}.`,
        ],
        practicalMeaning: pub.clinicalRelevance,
        studyLimits:
          'Scheda generata dai metadati ufficiali della fonte: l’abstract integrale in lingua italiana verrà sintetizzato al prossimo ciclo di aggiornamento periodico (ogni 30 giorni). Per dettagli su campione e metodologia consulta lo studio originale tramite il link in fondo.',
        evidenceLevel:
          pub.database === 'AIRC'
            ? 'Guida Istituzionale Peer-Reviewed (AIRC)'
            : 'Articolo Scientifico Indicizzato (PubMed / Rivista Peer-Reviewed)',
        readingTimeMinutes: 2,
        generatedBy: 'metadata_fallback',
      };

  const isTitleDifferent =
    brief.headlineIt.toLowerCase() !== pub.title.trim().toLowerCase();

  return {
    id: pub.id,
    kind: 'publication',
    kindLabel: 'Pubblicazione Scientifica',
    domainLabel: DOMAIN_ITALIAN_LABELS[pub.domain],
    sourceLabel: pub.database,
    headlineIt: brief.headlineIt,
    originalTitle: isTitleDifferent ? pub.title : undefined,
    authorsOrOrg: pub.authors,
    journalOrVenue: pub.journal,
    publishedDateOrScope: pub.publishedDate,
    pmid: pub.pmid,
    citationText: `${pub.authors} (${pub.publishedDate}). "${pub.title}". ${pub.journal}.${pub.pmid ? ` PMID: ${pub.pmid}.` : ''}`,
    sourceUrl: pub.url,
    sourceCtaLabel: getSourceCtaLabel(pub.url, pub.database),
    evidenceLevel: brief.evidenceLevel,
    readingTimeMinutes: brief.readingTimeMinutes,
    plainSummary: brief.plainSummary,
    keyTakeaways: brief.keyTakeaways,
    practicalMeaning: brief.practicalMeaning,
    studyLimits: brief.studyLimits,
    generatedBy: brief.generatedBy,
  };
}

export function buildReaderFromTrend(trend: EmergingTrendItem): SourceReaderDocument {
  const baselineMatch = BASELINE_EMERGING_TRENDS.find((b) => b.id === trend.id);
  const rawBrief = trend.readerBrief ?? baselineMatch?.readerBrief;
  const resolvedUrl =
    trend.url ??
    baselineMatch?.url ??
    extractUrlFromCitation(trend.keyCitation);

  const brief: ReaderBrief = rawBrief
    ? normalizeBrief(rawBrief)
    : {
        headlineIt: trend.topic,
        plainSummary: trend.summary,
        keyTakeaways: [
          `Crescita dell’interesse scientifico: +${trend.growthPctYoY}% nell’ultimo anno con circa ${trend.monthlyPublications} studi al mese.`,
          trend.summary,
          trend.protocolImpact,
        ],
        practicalMeaning: trend.protocolImpact,
        studyLimits:
          'I trend emergenti fotografano la direzione della ricerca più recente: alcune evidenze richiedono ulteriori studi di conferma prima di modificare i protocolli clinici primari.',
        evidenceLevel: trend.evidenceLevel,
        readingTimeMinutes: 2,
        generatedBy: 'metadata_fallback',
      };

  return {
    id: trend.id,
    kind: 'trend',
    kindLabel: 'Trend Scientifico Emergente',
    domainLabel: DOMAIN_ITALIAN_LABELS[trend.domain],
    sourceLabel: trend.evidenceLevel,
    headlineIt: brief.headlineIt,
    authorsOrOrg: trend.evidenceLevel,
    journalOrVenue: 'Osservatorio PubMed · Google Scholar · AIRC',
    publishedDateOrScope: `+${trend.growthPctYoY}% pubblicazioni/anno · ${trend.monthlyPublications} studi/mese`,
    citationText: trend.keyCitation,
    sourceUrl: resolvedUrl,
    sourceCtaLabel: getSourceCtaLabel(resolvedUrl, trend.evidenceLevel),
    evidenceLevel: brief.evidenceLevel,
    readingTimeMinutes: brief.readingTimeMinutes,
    plainSummary: brief.plainSummary,
    keyTakeaways: brief.keyTakeaways,
    practicalMeaning: brief.practicalMeaning,
    studyLimits: brief.studyLimits,
    generatedBy: brief.generatedBy,
    trendStats: {
      growthPctYoY: trend.growthPctYoY,
      monthlyPublications: trend.monthlyPublications,
    },
  };
}

export function buildReaderFromProtocol(proto: ProtocolMetadata): SourceReaderDocument {
  const brief: ReaderBrief = proto.readerBrief
    ? normalizeBrief(proto.readerBrief)
    : {
        headlineIt: proto.name,
        plainSummary: proto.validationScope,
        keyTakeaways: proto.variablesUsed.slice(0, 4),
        practicalMeaning: `Questo protocollo guida il calcolo nell’area "${proto.domain}" integrando: ${proto.variablesUsed.join('; ')}.`,
        studyLimits:
          'I punteggi di popolazione stimano probabilità statistiche medie e non sostituiscono esami clinici mirati o la valutazione del medico.',
        evidenceLevel: `Protocollo Internazionale Validato (${proto.organization})`,
        readingTimeMinutes: 2,
        generatedBy: 'curated',
      };

  return {
    id: proto.id,
    kind: 'protocol',
    kindLabel: 'Protocollo Clinico di Riferimento',
    domainLabel: proto.domain,
    sourceLabel: proto.organization,
    headlineIt: brief.headlineIt,
    originalTitle:
      brief.headlineIt.toLowerCase() !== proto.name.toLowerCase() ? proto.name : undefined,
    authorsOrOrg: proto.organization,
    journalOrVenue: proto.domain,
    publishedDateOrScope: proto.pmid && proto.pmid !== 'AIRC-IT' ? `PMID ${proto.pmid}` : 'Linee Guida Ufficiali',
    pmid: proto.pmid && proto.pmid !== 'AIRC-IT' ? proto.pmid : undefined,
    citationText: proto.citation,
    sourceUrl: proto.url,
    sourceCtaLabel: getSourceCtaLabel(proto.url, proto.organization),
    evidenceLevel: brief.evidenceLevel,
    readingTimeMinutes: brief.readingTimeMinutes,
    plainSummary: brief.plainSummary,
    keyTakeaways: brief.keyTakeaways,
    practicalMeaning: brief.practicalMeaning,
    studyLimits: brief.studyLimits,
    generatedBy: brief.generatedBy,
  };
}

function extractUrlFromCitation(citation: string): string {
  const pmidMatch = citation.match(/PMID\s*(\d{6,10})/i);
  if (pmidMatch) {
    return `https://pubmed.ncbi.nlm.nih.gov/${pmidMatch[1]}/`;
  }
  return `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(citation)}`;
}

function decodeXmlEntities(raw: string): string {
  return raw
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Pure deterministic parser for NCBI PubMed E-utilities efetch XML responses.
 * Extracts plain-text abstracts keyed by PMID without external XML dependencies.
 */
export function extractPubMedAbstractsFromXml(xml: string): Record<string, string> {
  const abstracts: Record<string, string> = {};
  if (!xml || typeof xml !== 'string') return abstracts;

  const articleRegex = /<PubmedArticle\b[^>]*>([\s\S]*?)<\/PubmedArticle>/gi;
  let articleMatch: RegExpExecArray | null;

  while ((articleMatch = articleRegex.exec(xml)) !== null) {
    const block = articleMatch[1];
    const pmidMatch = block.match(/<PMID\b[^>]*>(\d+)<\/PMID>/i);
    if (!pmidMatch) continue;
    const pmid = pmidMatch[1];

    const abstractBlockMatch = block.match(/<Abstract\b[^>]*>([\s\S]*?)<\/Abstract>/i);
    if (!abstractBlockMatch) continue;

    const textParts: string[] = [];
    const absTextRegex = /<AbstractText\b([^>]*)>([\s\S]*?)<\/AbstractText>/gi;
    let textMatch: RegExpExecArray | null;

    while ((textMatch = absTextRegex.exec(abstractBlockMatch[1])) !== null) {
      const attrs = textMatch[1] || '';
      const labelMatch = attrs.match(/\bLabel="([^"]+)"/i);
      const innerClean = decodeXmlEntities(textMatch[2].replace(/<[^>]+>/g, ' '));
      if (!innerClean) continue;
      if (labelMatch && labelMatch[1] && labelMatch[1].toUpperCase() !== 'UNASSIGNED') {
        textParts.push(`${labelMatch[1]}: ${innerClean}`);
      } else {
        textParts.push(innerClean);
      }
    }

    if (textParts.length > 0) {
      abstracts[pmid] = textParts.join(' ').slice(0, 2600);
    }
  }

  return abstracts;
}

export interface BatchBriefEntry {
  id: string;
  headlineIt: string;
  plainSummary: string;
  keyTakeaways: string[];
  practicalMeaning: string;
  studyLimits: string;
  evidenceLevel: string;
  readingTimeMinutes: number;
}

/**
 * Safely parses and validates the batched JSON response generated during the 30-day scan.
 */
export function parseBatchSummariesJson(rawJson: string): Record<string, ReaderBrief> {
  const result: Record<string, ReaderBrief> = {};
  if (!rawJson || typeof rawJson !== 'string') return result;

  try {
    const cleaned = rawJson
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '');
    const parsed = JSON.parse(cleaned) as unknown;
    const list: unknown[] = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object' && Array.isArray((parsed as { items?: unknown[] }).items)
        ? (parsed as { items: unknown[] }).items
        : [];

    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const obj = item as Partial<BatchBriefEntry>;
      if (
        typeof obj.id !== 'string' ||
        !obj.id.trim() ||
        typeof obj.plainSummary !== 'string' ||
        obj.plainSummary.trim().length < 20
      ) {
        continue;
      }

      const takeaways = Array.isArray(obj.keyTakeaways)
        ? obj.keyTakeaways
            .filter((t): t is string => typeof t === 'string' && t.trim().length > 4)
            .map((t) => t.trim())
            .slice(0, 4)
        : [];

      result[obj.id.trim()] = {
        headlineIt:
          typeof obj.headlineIt === 'string' && obj.headlineIt.trim().length > 4
            ? obj.headlineIt.trim()
            : obj.id.trim(),
        plainSummary: obj.plainSummary.trim(),
        keyTakeaways:
          takeaways.length > 0
            ? takeaways
            : [obj.plainSummary.trim()],
        practicalMeaning:
          typeof obj.practicalMeaning === 'string' && obj.practicalMeaning.trim().length > 8
            ? obj.practicalMeaning.trim()
            : 'Contribuisce all’aggiornamento del quadro informativo sulla prevenzione basata sugli stili di vita.',
        studyLimits:
          typeof obj.studyLimits === 'string' && obj.studyLimits.trim().length > 8
            ? obj.studyLimits.trim()
            : 'Sintesi basata esclusivamente sull’abstract pubblicato; per approfondimenti metodologici consultare l’articolo integrale.',
        evidenceLevel:
          typeof obj.evidenceLevel === 'string' && obj.evidenceLevel.trim().length > 3
            ? obj.evidenceLevel.trim()
            : 'Pubblicazione Peer-Reviewed (PubMed)',
        readingTimeMinutes:
          typeof obj.readingTimeMinutes === 'number' && Number.isFinite(obj.readingTimeMinutes)
            ? Math.max(1, Math.min(6, Math.round(obj.readingTimeMinutes)))
            : 2,
        generatedBy: 'monthly_scan_ai',
      };
    }
  } catch {
    return result;
  }

  return result;
}
