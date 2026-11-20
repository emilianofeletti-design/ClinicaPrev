import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');
const rulesText = fs.readFileSync(rulesPath, 'utf-8');
const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf-8')) as {
  firestore: Record<string, unknown>;
};

test('firestore.rules starts with default-deny catch-all and enforces rules_version 2', () => {
  assert.match(rulesText, /rules_version = '2';/);
  assert.match(rulesText, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;/);
});

test('every collection declared in firebase-blueprint.json has an explicit match block', () => {
  const collections = Object.keys(blueprint.firestore).map((p) => p.split('/')[1]);
  for (const col of collections) {
    assert.ok(
      rulesText.includes(`match /${col}/`),
      `Expected explicit match block for collection /${col}`
    );
  }
});

test('Dirty Dozen security invariants: verified admin email, strict keys, guardrails, server timestamps, immutable revisions', () => {
  // Email verification required (blocks unverified email spoofing)
  assert.match(rulesText, /request\.auth\.token\.email_verified == true/);
  // Shadow field protection via hasOnly on every entity blueprint
  assert.ok(rulesText.includes('data.keys().hasOnly('));
  // Guardrails enforced inside rules
  assert.ok(rulesText.includes('data.dailyStepsOptimalThreshold >= 6000 && data.dailyStepsOptimalThreshold <= 10000'));
  assert.ok(rulesText.includes('data.score2RegionCalibrationFactor >= 0.75 && data.score2RegionCalibrationFactor <= 1.05'));
  // Server timestamp enforcement
  assert.ok(rulesText.includes('data.updatedAt == request.time'));
  assert.ok(rulesText.includes('data.createdAt == request.time'));
  // URL protocol protection
  assert.ok(rulesText.includes("data.sourceUrl.matches('^https://.*$')"));
  // Revisions are immutable (no update, no delete)
  assert.match(rulesText, /match \/parameter_revisions\/\{revisionId\}[\s\S]*allow update: if false;[\s\S]*allow delete: if false;/);
  // Admin registry strictly isolated
  assert.match(rulesText, /match \/admins\/\{adminUid\}\s*\{\s*allow read, write: if false;/);
});
