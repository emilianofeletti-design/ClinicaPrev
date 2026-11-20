import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildClientMonthlyDigestFromArticles,
  buildStaticBaselineDigest,
  runBrowserPubMedMonthlyScan,
  selectFreshestDigest,
} from './clientPubMedScan';
import { DAY_MS } from './scanPolicy';

test('runBrowserPubMedMonthlyScan strictly blocks requests before 30 days elapse', async () => {
  const baseMs = Date.parse('2026-11-20T00:00:00.000Z');
  const current = buildStaticBaselineDigest(baseMs);

  let fetchCalls = 0;
  const mockFetch = (async () => {
    fetchCalls += 1;
    return new Response('{}', { status: 200 });
  }) as unknown as typeof fetch;

  // Only 10 days elapsed -> MUST NOT call fetch
  const result = await runBrowserPubMedMonthlyScan(current, {
    nowMs: baseMs + 10 * DAY_MS,
    fetchImpl: mockFetch,
  });

  assert.equal(fetchCalls, 0);
  assert.equal(result.canRunScan, false);
  assert.equal(result.daysUntilNextScan, 20);
});

test('runBrowserPubMedMonthlyScan runs after 30 days and re-locks for another 30 days', async () => {
  const baseMs = Date.parse('2026-11-20T00:00:00.000Z');
  const current = buildStaticBaselineDigest(baseMs);
  const after31Days = baseMs + 31 * DAY_MS;

  const mockFetch = (async (input: string | URL) => {
    const url = String(input);
    if (url.includes('esearch.fcgi')) {
      return new Response(JSON.stringify({ esearchresult: { idlist: ['99900011'] } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (url.includes('esummary.fcgi')) {
      return new Response(
        JSON.stringify({
          result: {
            '99900011': {
              uid: '99900011',
              title: 'Mediterranean diet and preventive cardiology cohort update.',
              authors: [{ name: 'Rossi M' }],
              fulljournalname: 'European Heart Journal',
              pubdate: '2026 Dec',
            },
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }
    return new Response(
      '<PubmedArticleSet><PubmedArticle><MedlineCitation><PMID>99900011</PMID><Article><Abstract><AbstractText>Observed 18% lower cardiovascular risk over 8 years.</AbstractText></Abstract></Article></MedlineCitation></PubmedArticle></PubmedArticleSet>',
      { status: 200, headers: { 'content-type': 'application/xml' } }
    );
  }) as unknown as typeof fetch;

  const updated = await runBrowserPubMedMonthlyScan(current, {
    nowMs: after31Days,
    fetchImpl: mockFetch,
  });

  assert.equal(updated.canRunScan, false);
  assert.equal(updated.daysUntilNextScan, 30);
  assert.ok(updated.publications.some((p) => p.pmid === '99900011'));
  const added = updated.publications.find((p) => p.pmid === '99900011');
  assert.ok(added?.abstractSnippet?.includes('18% lower cardiovascular risk'));
});

test('selectFreshestDigest picks the newest timestamp across sources and recalculates 30-day lock', () => {
  const older = buildClientMonthlyDigestFromArticles([], Date.parse('2026-10-01T00:00:00.000Z'));
  const newer = buildClientMonthlyDigestFromArticles([], Date.parse('2026-11-15T00:00:00.000Z'));

  const picked = selectFreshestDigest(
    [null, older, newer],
    Date.parse('2026-11-20T00:00:00.000Z')
  );

  assert.equal(picked.lastMonthlyScanIso, newer.lastMonthlyScanIso);
  assert.equal(picked.canRunScan, false);
  assert.equal(picked.daysUntilNextScan, 25);
});
