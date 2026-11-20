import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, isVerifiedCurator, OperationType } from '../firebase';
import type { MonitoringDigestResponse } from '../types/clinical';
import {
  BASELINE_PARAMETER_PROPOSALS,
  BASELINE_PARAMETER_REVISIONS,
  DEFAULT_CLINICAL_PARAMETERS,
  extractNumericParameterMap,
  type ClinicalParameterSet,
  type ParameterRevisionRecord,
  type ParameterUpdateProposal,
} from '../utils/clinicalParameters';
import { computeMonthlyScanEligibility, MONTHLY_SCAN_COOLDOWN_DAYS } from '../utils/scanPolicy';

const ACTIVE_PARAMS_PATH = 'clinical_parameters/active';
const PROPOSALS_COLLECTION = 'parameter_proposals';
const REVISIONS_COLLECTION = 'parameter_revisions';
const DIGEST_PATH = 'monitoring_digests/latest';

function timestampToIso(value: unknown, fallbackIso: string): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (typeof value === 'string' && value.length >= 10) {
    return value;
  }
  return fallbackIso;
}

export async function fetchActiveClinicalParametersFromFirestore(): Promise<{
  params: ClinicalParameterSet;
  fromFirestore: boolean;
}> {
  try {
    const snap = await getDoc(doc(db, 'clinical_parameters', 'active'));
    if (!snap.exists()) {
      return { params: DEFAULT_CLINICAL_PARAMETERS, fromFirestore: false };
    }
    const d = snap.data();
    return {
      fromFirestore: true,
      params: {
        version: String(d.version ?? DEFAULT_CLINICAL_PARAMETERS.version),
        updatedAtIso: timestampToIso(d.updatedAt, DEFAULT_CLINICAL_PARAMETERS.updatedAtIso),
        updatedBy: String(d.updatedBy ?? DEFAULT_CLINICAL_PARAMETERS.updatedBy),
        updateMode: (d.updateMode ?? 'baseline') as ClinicalParameterSet['updateMode'],
        changeSummary: String(d.changeSummary ?? DEFAULT_CLINICAL_PARAMETERS.changeSummary),
        dailyStepsOptimalThreshold: Number(
          d.dailyStepsOptimalThreshold ?? DEFAULT_CLINICAL_PARAMETERS.dailyStepsOptimalThreshold
        ),
        dailyStepsLowThreshold: Number(
          d.dailyStepsLowThreshold ?? DEFAULT_CLINICAL_PARAMETERS.dailyStepsLowThreshold
        ),
        whoWeeklyMinutesTarget: Number(
          d.whoWeeklyMinutesTarget ?? DEFAULT_CLINICAL_PARAMETERS.whoWeeklyMinutesTarget
        ),
        upfHighRiskOncoPoints: Number(
          d.upfHighRiskOncoPoints ?? DEFAULT_CLINICAL_PARAMETERS.upfHighRiskOncoPoints
        ),
        redMeatWeeklyLimit: Number(
          d.redMeatWeeklyLimit ?? DEFAULT_CLINICAL_PARAMETERS.redMeatWeeklyLimit
        ),
        fruitVegDailyTarget: Number(
          d.fruitVegDailyTarget ?? DEFAULT_CLINICAL_PARAMETERS.fruitVegDailyTarget
        ),
        alcoholLowRiskWeeklyLimit: Number(
          d.alcoholLowRiskWeeklyLimit ?? DEFAULT_CLINICAL_PARAMETERS.alcoholLowRiskWeeklyLimit
        ),
        euDefaultTotalCholMgDl: Number(
          d.euDefaultTotalCholMgDl ?? DEFAULT_CLINICAL_PARAMETERS.euDefaultTotalCholMgDl
        ),
        euPopCvdMedianMultiplier: Number(
          d.euPopCvdMedianMultiplier ?? DEFAULT_CLINICAL_PARAMETERS.euPopCvdMedianMultiplier
        ),
        euPopOncoMedianOffset: Number(
          d.euPopOncoMedianOffset ?? DEFAULT_CLINICAL_PARAMETERS.euPopOncoMedianOffset
        ),
        score2RegionCalibrationFactor: Number(
          d.score2RegionCalibrationFactor ??
            DEFAULT_CLINICAL_PARAMETERS.score2RegionCalibrationFactor
        ),
        findriscHighRiskCutoff: Number(
          d.findriscHighRiskCutoff ?? DEFAULT_CLINICAL_PARAMETERS.findriscHighRiskCutoff
        ),
        wcrfRelativeRiskSlope: Number(
          d.wcrfRelativeRiskSlope ?? DEFAULT_CLINICAL_PARAMETERS.wcrfRelativeRiskSlope
        ),
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('permission')) {
      handleFirestoreError(error, OperationType.GET, ACTIVE_PARAMS_PATH);
    }
    return { params: DEFAULT_CLINICAL_PARAMETERS, fromFirestore: false };
  }
}

export async function fetchParameterProposalsFromFirestore(): Promise<{
  proposals: ParameterUpdateProposal[];
  fromFirestore: boolean;
}> {
  try {
    const q = query(
      collection(db, PROPOSALS_COLLECTION),
      where('governanceTier', 'in', ['guarded_auto', 'manual_review']),
      orderBy('updatedAt', 'desc')
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      return { proposals: BASELINE_PARAMETER_PROPOSALS, fromFirestore: false };
    }
    const items: ParameterUpdateProposal[] = snap.docs.map((docSnap) => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        parameterKey: d.parameterKey,
        parameterLabel: String(d.parameterLabel ?? ''),
        governanceTier: d.governanceTier,
        status: d.status,
        currentValue: Number(d.currentValue ?? 0),
        proposedValue: Number(d.proposedValue ?? 0),
        unit: String(d.unit ?? ''),
        sourceAuthority: String(d.sourceAuthority ?? ''),
        pmidOrReference: String(d.pmidOrReference ?? ''),
        sourceUrl: String(d.sourceUrl ?? 'https://pubmed.ncbi.nlm.nih.gov/'),
        rationale: String(d.rationale ?? ''),
        createdAtIso: timestampToIso(d.createdAt, new Date().toISOString()),
        updatedAtIso: timestampToIso(d.updatedAt, new Date().toISOString()),
        reviewedBy: d.reviewedBy ? String(d.reviewedBy) : undefined,
      };
    });
    return { proposals: items, fromFirestore: true };
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('permission')) {
      handleFirestoreError(error, OperationType.LIST, PROPOSALS_COLLECTION);
    }
    return { proposals: BASELINE_PARAMETER_PROPOSALS, fromFirestore: false };
  }
}

export async function fetchParameterRevisionsFromFirestore(): Promise<{
  revisions: ParameterRevisionRecord[];
  fromFirestore: boolean;
}> {
  try {
    const q = query(
      collection(db, REVISIONS_COLLECTION),
      where('updateMode', 'in', ['baseline', 'guarded_auto', 'manual_review', 'rollback']),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      return { revisions: BASELINE_PARAMETER_REVISIONS, fromFirestore: false };
    }
    const items: ParameterRevisionRecord[] = snap.docs.map((docSnap) => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        version: String(d.version ?? 'v1.0'),
        createdAtIso: timestampToIso(d.createdAt, new Date().toISOString()),
        actorEmail: String(d.actorEmail ?? ''),
        updateMode: d.updateMode,
        changeSummary: String(d.changeSummary ?? ''),
        snapshot: {
          ...extractNumericParameterMap(DEFAULT_CLINICAL_PARAMETERS),
          ...(d.snapshot ?? {}),
        },
      };
    });
    return { revisions: items, fromFirestore: true };
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('permission')) {
      handleFirestoreError(error, OperationType.LIST, REVISIONS_COLLECTION);
    }
    return { revisions: BASELINE_PARAMETER_REVISIONS, fromFirestore: false };
  }
}

export async function fetchMonitoringDigestFromFirestore(): Promise<MonitoringDigestResponse | null> {
  try {
    const snap = await getDoc(doc(db, 'monitoring_digests', 'latest'));
    if (!snap.exists()) return null;
    const d = snap.data();
    const lastScanIso = String(d.lastMonthlyScanIso ?? '2026-11-20T00:00:00.000Z');
    const eligibility = computeMonthlyScanEligibility(lastScanIso);
    return {
      lastMonthlyScanIso: lastScanIso,
      nextScheduledScanIso: eligibility.nextScheduledScanIso,
      cadenceDays: Number(d.cadenceDays ?? MONTHLY_SCAN_COOLDOWN_DAYS),
      canRunScan: eligibility.canRunScan,
      daysUntilNextScan: eligibility.daysUntilNextScan,
      sourcesTracked: Array.isArray(d.sourcesTracked) ? d.sourcesTracked : [],
      livePubMedCount: Number(d.livePubMedCount ?? 0),
      aiSynthesisNote: typeof d.aiSynthesisNote === 'string' ? d.aiSynthesisNote : null,
      aiSynthesisError: null,
      monthlySeries: Array.isArray(d.monthlySeries) ? d.monthlySeries : [],
      emergingTrends: Array.isArray(d.emergingTrends) ? d.emergingTrends : [],
      publications: Array.isArray(d.publications) ? d.publications : [],
      groundingSources: Array.isArray(d.groundingSources) ? d.groundingSources : [],
    };
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes('permission')) {
      handleFirestoreError(error, OperationType.GET, DIGEST_PATH);
    }
    return null;
  }
}

function assertCuratorSignedIn(): string {
  const user = auth.currentUser;
  if (!isVerifiedCurator(user) || !user?.email) {
    throw new Error(
      'Accesso Curatore verificato richiesto per salvare modifiche permanenti su Firebase Firestore.'
    );
  }
  return user.email;
}

function toFirestoreClinicalParamsPayload(params: ClinicalParameterSet, actorEmail: string) {
  return {
    version: params.version.slice(0, 24),
    updatedAt: serverTimestamp(),
    updatedBy: actorEmail.slice(0, 120),
    updateMode: params.updateMode,
    changeSummary: params.changeSummary.slice(0, 500),
    ...extractNumericParameterMap(params),
  };
}

export async function seedBaselineToFirestore(digest: MonitoringDigestResponse | null): Promise<void> {
  const actorEmail = assertCuratorSignedIn();
  const batch = writeBatch(db);

  batch.set(
    doc(db, 'clinical_parameters', 'active'),
    toFirestoreClinicalParamsPayload(DEFAULT_CLINICAL_PARAMETERS, actorEmail)
  );

  const baseRev = BASELINE_PARAMETER_REVISIONS[0];
  batch.set(doc(db, REVISIONS_COLLECTION, baseRev.id), {
    version: baseRev.version,
    createdAt: serverTimestamp(),
    actorEmail,
    updateMode: 'baseline',
    changeSummary: baseRev.changeSummary.slice(0, 500),
    snapshot: baseRev.snapshot,
  });

  for (const prop of BASELINE_PARAMETER_PROPOSALS) {
    batch.set(doc(db, PROPOSALS_COLLECTION, prop.id), {
      parameterKey: prop.parameterKey,
      parameterLabel: prop.parameterLabel.slice(0, 140),
      governanceTier: prop.governanceTier,
      status: prop.status,
      currentValue: prop.currentValue,
      proposedValue: prop.proposedValue,
      unit: prop.unit.slice(0, 40),
      sourceAuthority: prop.sourceAuthority.slice(0, 140),
      pmidOrReference: prop.pmidOrReference.slice(0, 120),
      sourceUrl: prop.sourceUrl.slice(0, 300),
      rationale: prop.rationale.slice(0, 700),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  if (digest) {
    batch.set(doc(db, 'monitoring_digests', 'latest'), {
      lastMonthlyScanIso: digest.lastMonthlyScanIso.slice(0, 40),
      cadenceDays: digest.cadenceDays,
      livePubMedCount: digest.livePubMedCount,
      aiSynthesisNote: digest.aiSynthesisNote ? digest.aiSynthesisNote.slice(0, 4000) : null,
      sourcesTracked: digest.sourcesTracked.slice(0, 12),
      monthlySeries: digest.monthlySeries.slice(0, 24),
      emergingTrends: digest.emergingTrends.slice(0, 20),
      publications: digest.publications.slice(0, 60),
      groundingSources: digest.groundingSources.slice(0, 20),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, ACTIVE_PARAMS_PATH);
  }
}

export async function publishParameterChangeToFirestore(
  nextParams: ClinicalParameterSet,
  revision: ParameterRevisionRecord,
  updatedProposals: ParameterUpdateProposal[] = []
): Promise<void> {
  const actorEmail = assertCuratorSignedIn();
  const batch = writeBatch(db);

  batch.set(
    doc(db, 'clinical_parameters', 'active'),
    toFirestoreClinicalParamsPayload(nextParams, actorEmail)
  );

  batch.set(doc(db, REVISIONS_COLLECTION, revision.id), {
    version: revision.version.slice(0, 24),
    createdAt: serverTimestamp(),
    actorEmail: actorEmail.slice(0, 120),
    updateMode: revision.updateMode,
    changeSummary: revision.changeSummary.slice(0, 500),
    snapshot: revision.snapshot,
  });

  for (const prop of updatedProposals) {
    const propRef = doc(db, PROPOSALS_COLLECTION, prop.id);
    const existingSnap = await getDoc(propRef);
    if (existingSnap.exists()) {
      batch.update(propRef, {
        status: prop.status,
        updatedAt: serverTimestamp(),
        reviewedBy: actorEmail.slice(0, 120),
      });
    } else {
      batch.set(propRef, {
        parameterKey: prop.parameterKey,
        parameterLabel: prop.parameterLabel.slice(0, 140),
        governanceTier: prop.governanceTier,
        status: prop.status,
        currentValue: prop.currentValue,
        proposedValue: prop.proposedValue,
        unit: prop.unit.slice(0, 40),
        sourceAuthority: prop.sourceAuthority.slice(0, 140),
        pmidOrReference: prop.pmidOrReference.slice(0, 120),
        sourceUrl: prop.sourceUrl.slice(0, 300),
        rationale: prop.rationale.slice(0, 700),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        reviewedBy: actorEmail.slice(0, 120),
      });
    }
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, ACTIVE_PARAMS_PATH);
  }
}

export async function rejectProposalInFirestore(proposal: ParameterUpdateProposal): Promise<void> {
  const actorEmail = assertCuratorSignedIn();
  const propPath = `${PROPOSALS_COLLECTION}/${proposal.id}`;
  try {
    const propRef = doc(db, PROPOSALS_COLLECTION, proposal.id);
    const existingSnap = await getDoc(propRef);
    if (existingSnap.exists()) {
      await updateDoc(propRef, {
        status: 'rejected',
        updatedAt: serverTimestamp(),
        reviewedBy: actorEmail.slice(0, 120),
      });
    } else {
      await setDoc(propRef, {
        parameterKey: proposal.parameterKey,
        parameterLabel: proposal.parameterLabel.slice(0, 140),
        governanceTier: proposal.governanceTier,
        status: 'rejected',
        currentValue: proposal.currentValue,
        proposedValue: proposal.proposedValue,
        unit: proposal.unit.slice(0, 40),
        sourceAuthority: proposal.sourceAuthority.slice(0, 140),
        pmidOrReference: proposal.pmidOrReference.slice(0, 120),
        sourceUrl: proposal.sourceUrl.slice(0, 300),
        rationale: proposal.rationale.slice(0, 700),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        reviewedBy: actorEmail.slice(0, 120),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, propPath);
  }
}

export async function saveMonitoringDigestToFirestore(
  digest: MonitoringDigestResponse
): Promise<void> {
  assertCuratorSignedIn();
  try {
    await setDoc(doc(db, 'monitoring_digests', 'latest'), {
      lastMonthlyScanIso: digest.lastMonthlyScanIso.slice(0, 40),
      cadenceDays: digest.cadenceDays,
      livePubMedCount: digest.livePubMedCount,
      aiSynthesisNote: digest.aiSynthesisNote ? digest.aiSynthesisNote.slice(0, 4000) : null,
      sourcesTracked: digest.sourcesTracked.slice(0, 12),
      monthlySeries: digest.monthlySeries.slice(0, 24),
      emergingTrends: digest.emergingTrends.slice(0, 20),
      publications: digest.publications.slice(0, 60),
      groundingSources: digest.groundingSources.slice(0, 20),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, DIGEST_PATH);
  }
}
