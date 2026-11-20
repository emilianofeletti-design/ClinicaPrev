import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASELINE_EMERGING_TRENDS,
  BASELINE_PUBLICATIONS,
  INTERNATIONAL_PROTOCOLS,
} from '../data/clinicalProtocols';
import type { AcademicPublication } from '../types/clinical';
import {
  buildReaderFromProtocol,
  buildReaderFromPublication,
  buildReaderFromTrend,
  extractPubMedAbstractsFromXml,
  parseBatchSummariesJson,
} from './sourceReader';

test('all current publications, trends, and protocols produce complete curated reader documents with valid HTTPS links', () => {
  for (const pub of BASELINE_PUBLICATIONS) {
    const doc = buildReaderFromPublication(pub);
    assert.equal(doc.generatedBy, 'curated');
    assert.ok(doc.headlineIt.length >= 15, `headline missing for ${pub.id}`);
    assert.ok(doc.plainSummary.length >= 80, `plainSummary too short for ${pub.id}`);
    assert.ok(doc.keyTakeaways.length >= 3, `expected >=3 takeaways for ${pub.id}`);
    assert.ok(doc.sourceUrl.startsWith('https://'), `invalid URL for ${pub.id}`);
  }

  for (const trend of BASELINE_EMERGING_TRENDS) {
    const doc = buildReaderFromTrend(trend);
    assert.equal(doc.generatedBy, 'curated');
    assert.ok(doc.plainSummary.length >= 80, `plainSummary too short for ${trend.id}`);
    assert.ok(doc.keyTakeaways.length >= 3, `expected >=3 takeaways for ${trend.id}`);
    assert.ok(doc.sourceUrl.startsWith('https://'), `invalid URL for ${trend.id}`);
    assert.ok(doc.trendStats && doc.trendStats.growthPctYoY > 0);
  }

  for (const proto of INTERNATIONAL_PROTOCOLS) {
    const doc = buildReaderFromProtocol(proto);
    assert.equal(doc.generatedBy, 'curated');
    assert.ok(doc.plainSummary.length >= 80, `plainSummary too short for ${proto.id}`);
    assert.ok(doc.keyTakeaways.length >= 3, `expected >=3 takeaways for ${proto.id}`);
    assert.ok(doc.sourceUrl.startsWith('https://'), `invalid URL for ${proto.id}`);
  }
});

test('future PubMed articles work both with 30-day AI briefs and with metadata fallback when abstract is unavailable', () => {
  const aiSummarizedFuturePub: AcademicPublication = {
    id: 'pubmed-live-99999901',
    title: 'Mediterranean fiber intake and incident type 2 diabetes in European adults',
    authors: 'Rossi M, Bianchi L, et al.',
    journal: 'Diabetologia',
    publishedDate: '2026-12',
    database: 'PubMed',
    domain: 'metabolic',
    pmid: '99999901',
    url: 'https://pubmed.ncbi.nlm.nih.gov/99999901/',
    keyFinding: 'Ogni +10 g/die di fibre integrali riduce il rischio di diabete del 14%.',
    clinicalRelevance: 'Conferma il target alimentare di frutta, verdura e legumi.',
    readerBrief: {
      headlineIt: 'Fibre della dieta mediterranea e prevenzione del diabete di tipo 2',
      plainSummary:
        'Uno studio prospettico europeo mostra che aumentare legumi, verdure e cereali integrali riduce il rischio di diabete di tipo 2.',
      keyTakeaways: [
        'Ogni +10 g/giorno di fibre si associa a −14% di rischio di diabete.',
        'Effetto più marcato con cereali integrali e legumi.',
      ],
      practicalMeaning: 'Rafforza l’obiettivo quotidiano di almeno 5 porzioni vegetali.',
      studyLimits: 'Studio osservazionale basato su questionari alimentari auto-riferiti.',
      evidenceLevel: 'Studio di Coorte Prospettico (PubMed)',
      readingTimeMinutes: 2,
      generatedBy: 'monthly_scan_ai',
    },
  };

  const aiDoc = buildReaderFromPublication(aiSummarizedFuturePub);
  assert.equal(aiDoc.generatedBy, 'monthly_scan_ai');
  assert.equal(aiDoc.headlineIt, 'Fibre della dieta mediterranea e prevenzione del diabete di tipo 2');
  assert.equal(aiDoc.originalTitle, aiSummarizedFuturePub.title);
  assert.equal(aiDoc.sourceUrl, 'https://pubmed.ncbi.nlm.nih.gov/99999901/');

  const fallbackFuturePub: AcademicPublication = {
    id: 'pubmed-live-99999902',
    title: 'Novel cardiovascular risk biomarkers in primary care',
    authors: 'Verdi A, et al.',
    journal: 'Eur J Prev Cardiol',
    publishedDate: '2026-12',
    database: 'PubMed',
    domain: 'cardiovascular',
    pmid: '99999902',
    url: 'https://pubmed.ncbi.nlm.nih.gov/99999902/',
    keyFinding: 'Pubblicazione recente recuperata da PubMed.',
    clinicalRelevance: 'Evidenza clinica per prevenzione cardiovascolare.',
  };

  const fbDoc = buildReaderFromPublication(fallbackFuturePub);
  assert.equal(fbDoc.generatedBy, 'metadata_fallback');
  assert.ok(fbDoc.plainSummary.includes('Pubblicazione recente recuperata'));
  assert.ok(fbDoc.studyLimits.includes('30 giorni'));
  assert.equal(fbDoc.sourceUrl, 'https://pubmed.ncbi.nlm.nih.gov/99999902/');
});

test('extractPubMedAbstractsFromXml extracts labeled and nested XML abstract sections cleanly', () => {
  const sampleXml = `
    <PubmedArticleSet>
      <PubmedArticle>
        <MedlineCitation>
          <PMID Version="1">40123456</PMID>
          <Article>
            <Abstract>
              <AbstractText Label="BACKGROUND">Daily walking &amp; <i>moderate</i> exercise improve health.</AbstractText>
              <AbstractText Label="RESULTS">Risk decreased by 18% (p &lt; 0.01).</AbstractText>
            </Abstract>
          </Article>
        </MedlineCitation>
      </PubmedArticle>
    </PubmedArticleSet>
  `;
  const parsed = extractPubMedAbstractsFromXml(sampleXml);
  assert.ok(parsed['40123456']);
  assert.ok(parsed['40123456'].includes('BACKGROUND: Daily walking & moderate exercise improve health.'));
  assert.ok(parsed['40123456'].includes('RESULTS: Risk decreased by 18% (p < 0.01).'));
});

test('parseBatchSummariesJson validates structured AI batch responses and discards malformed entries', () => {
  const raw = JSON.stringify([
    {
      id: 'pubmed-live-40123456',
      headlineIt: 'Camminare ogni giorno protegge il cuore',
      plainSummary: 'Una nuova analisi conferma che camminare a passo sostenuto ogni giorno riduce gli eventi cardiovascolari.',
      keyTakeaways: ['Riduzione del 18% del rischio cardiovascolare.', 'Beneficio visibile già con 30 minuti al giorno.'],
      practicalMeaning: 'Sostiene l’obiettivo di passi giornalieri nel calcolatore.',
      studyLimits: 'Dati auto-riferiti su una coorte osservazionale.',
      evidenceLevel: 'Studio di Coorte',
      readingTimeMinutes: 2,
    },
    {
      id: '',
      plainSummary: 'too short',
    },
  ]);

  const parsed = parseBatchSummariesJson(raw);
  assert.equal(Object.keys(parsed).length, 1);
  assert.equal(parsed['pubmed-live-40123456'].generatedBy, 'monthly_scan_ai');
  assert.equal(parsed['pubmed-live-40123456'].keyTakeaways.length, 2);
});
