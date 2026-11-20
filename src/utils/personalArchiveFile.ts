import type { ClinicalAssessmentResult, ClinicalProfileInput } from '../types/clinical';
import { validateClinicalProfile } from './clinicalRiskEngine';

export interface PersonalAnalysisRecord {
  id: string;
  recordedAtIso: string;
  label: string;
  parameterVersion: string;
  profile: ClinicalProfileInput;
  summary: {
    bmi: number;
    cvdPct: number;
    findriscPoints: number;
    oncologicIndex: number;
  };
}

export interface PersonalArchiveFileV1 {
  schemaVersion: 1;
  appName: 'ClinicaPrev';
  disclaimer: string;
  exportedAtIso: string;
  records: PersonalAnalysisRecord[];
}

export function createPersonalAnalysisRecord(
  profile: ClinicalProfileInput,
  result: ClinicalAssessmentResult,
  label?: string,
  recordedAtIso?: string
): PersonalAnalysisRecord {
  const iso = recordedAtIso || result.computedAt || new Date().toISOString();
  const formattedDate = new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return {
    id: `rec_${Date.parse(iso) || Date.now()}`,
    recordedAtIso: iso,
    label: (label && label.trim()) || `Analisi del ${formattedDate}`,
    parameterVersion: result.parameterVersion || 'v1.0',
    profile: { ...profile },
    summary: {
      bmi: result.bmi,
      cvdPct: result.cardiovascular.scoreNumeric,
      findriscPoints: result.metabolic.scoreNumeric,
      oncologicIndex: result.oncologic.scoreNumeric,
    },
  };
}

/**
 * Merges a new record into an existing chronological timeline (avoiding exact duplicate IDs)
 * and builds the portable JSON payload ready for local file download.
 */
export function buildPersonalArchiveFile(
  existingRecords: PersonalAnalysisRecord[],
  newRecord?: PersonalAnalysisRecord
): PersonalArchiveFileV1 {
  const merged = [...existingRecords];
  if (newRecord) {
    const existingIdx = merged.findIndex((r) => r.id === newRecord.id);
    if (existingIdx >= 0) {
      merged[existingIdx] = newRecord;
    } else {
      merged.push(newRecord);
    }
  }
  merged.sort((a, b) => Date.parse(a.recordedAtIso) - Date.parse(b.recordedAtIso));

  return {
    schemaVersion: 1,
    appName: 'ClinicaPrev',
    disclaimer:
      'File personale salvato esclusivamente sul dispositivo dell’utente. Riferimento puramente informativo e divulgativo; non costituisce diagnosi medica.',
    exportedAtIso: new Date().toISOString(),
    records: merged.slice(-50),
  };
}

export function serializePersonalArchiveFile(archive: PersonalArchiveFileV1): string {
  return JSON.stringify(archive, null, 2);
}

export function suggestArchiveFilename(dateIso = new Date().toISOString()): string {
  const day = dateIso.slice(0, 10);
  return `clinicaprev-analisi-${day}.json`;
}

export function parsePersonalArchiveFile(rawJson: string): {
  ok: true;
  archive: PersonalArchiveFileV1;
  latestRecord: PersonalAnalysisRecord;
} | {
  ok: false;
  error: string;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return {
      ok: false,
      error: 'Il file selezionato non è un JSON valido di ClinicaPrev.',
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'Struttura del file non riconosciuta.' };
  }

  const obj = parsed as Partial<PersonalArchiveFileV1>;
  if (obj.appName !== 'ClinicaPrev' || obj.schemaVersion !== 1 || !Array.isArray(obj.records)) {
    return {
      ok: false,
      error:
        'Questo file non sembra essere un salvataggio compatibile esportato da ClinicaPrev (schema v1).',
    };
  }

  if (obj.records.length === 0) {
    return { ok: false, error: 'Il file caricato non contiene alcuna analisi salvata.' };
  }

  const validRecords: PersonalAnalysisRecord[] = [];
  for (const item of obj.records) {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof item.recordedAtIso !== 'string' ||
      !item.profile ||
      typeof item.profile !== 'object'
    ) {
      return { ok: false, error: 'Una delle rilevazioni nel file è incompleta o danneggiata.' };
    }
    const profileErrors = validateClinicalProfile(item.profile);
    if (Object.keys(profileErrors).length > 0) {
      return {
        ok: false,
        error: `I parametri salvati nella rilevazione del ${item.recordedAtIso.slice(
          0,
          10
        )} non superano i controlli di validità clinica.`,
      };
    }
    validRecords.push({
      id: typeof item.id === 'string' && item.id ? item.id : `rec_${Date.parse(item.recordedAtIso) || Date.now()}`,
      recordedAtIso: item.recordedAtIso,
      label: typeof item.label === 'string' && item.label ? item.label : `Analisi del ${item.recordedAtIso.slice(0, 10)}`,
      parameterVersion: typeof item.parameterVersion === 'string' ? item.parameterVersion : 'v1.0',
      profile: { ...item.profile },
      summary: {
        bmi: Number(item.summary?.bmi ?? 0),
        cvdPct: Number(item.summary?.cvdPct ?? 0),
        findriscPoints: Number(item.summary?.findriscPoints ?? 0),
        oncologicIndex: Number(item.summary?.oncologicIndex ?? 0),
      },
    });
  }

  validRecords.sort((a, b) => Date.parse(a.recordedAtIso) - Date.parse(b.recordedAtIso));

  return {
    ok: true,
    archive: {
      schemaVersion: 1,
      appName: 'ClinicaPrev',
      disclaimer:
        typeof obj.disclaimer === 'string'
          ? obj.disclaimer
          : 'File personale salvato localmente sul dispositivo dell’utente.',
      exportedAtIso:
        typeof obj.exportedAtIso === 'string' ? obj.exportedAtIso : new Date().toISOString(),
      records: validRecords,
    },
    latestRecord: validRecords[validRecords.length - 1],
  };
}

export interface LongitudinalDeltaSummary {
  previousRecord: PersonalAnalysisRecord;
  currentRecord: PersonalAnalysisRecord;
  cvdDeltaPct: number;
  findriscDeltaPoints: number;
  oncologicDeltaIndex: number;
  bmiDelta: number;
  daysElapsed: number;
}

export function computeLongitudinalDelta(
  previousRecord: PersonalAnalysisRecord,
  currentRecord: PersonalAnalysisRecord
): LongitudinalDeltaSummary {
  const prevMs = Date.parse(previousRecord.recordedAtIso);
  const currMs = Date.parse(currentRecord.recordedAtIso);
  const daysElapsed =
    Number.isFinite(prevMs) && Number.isFinite(currMs)
      ? Math.max(0, Math.round((currMs - prevMs) / (24 * 60 * 60 * 1000)))
      : 0;

  return {
    previousRecord,
    currentRecord,
    cvdDeltaPct: Number((currentRecord.summary.cvdPct - previousRecord.summary.cvdPct).toFixed(1)),
    findriscDeltaPoints:
      currentRecord.summary.findriscPoints - previousRecord.summary.findriscPoints,
    oncologicDeltaIndex:
      currentRecord.summary.oncologicIndex - previousRecord.summary.oncologicIndex,
    bmiDelta: Number((currentRecord.summary.bmi - previousRecord.summary.bmi).toFixed(1)),
    daysElapsed,
  };
}

export type LongitudinalMetricKey =
  | 'all_normalized'
  | 'cvdPct'
  | 'findriscPoints'
  | 'oncologicIndex'
  | 'bmi';

export interface LongitudinalChartPoint {
  id: string;
  dateLabel: string;
  fullDate: string;
  label: string;
  isCurrent: boolean;
  cvdPct: number;
  findriscPoints: number;
  oncologicIndex: number;
  bmi: number;
  cvdNormalized: number;
  findriscNormalized: number;
  oncologicNormalized: number;
}

function clamp100(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Builds a chronologically ordered series for the RiskDashboard longitudinal LineChart
 * from historical records in the user's uploaded file (optionally appending the live current analysis).
 */
export function buildLongitudinalSeries(
  historicalRecords: PersonalAnalysisRecord[],
  currentRecord?: PersonalAnalysisRecord | null,
  includeCurrent = true
): LongitudinalChartPoint[] {
  const sortedHistory = [...historicalRecords].sort(
    (a, b) => Date.parse(a.recordedAtIso) - Date.parse(b.recordedAtIso)
  );

  const points: LongitudinalChartPoint[] = sortedHistory.map((rec) => {
    const dt = new Date(rec.recordedAtIso);
    const validDate = !Number.isNaN(dt.getTime());
    return {
      id: rec.id,
      dateLabel: validDate
        ? dt.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
          })
        : rec.recordedAtIso.slice(0, 10),
      fullDate: validDate
        ? dt.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })
        : rec.recordedAtIso.slice(0, 10),
      label: rec.label,
      isCurrent: false,
      cvdPct: rec.summary.cvdPct,
      findriscPoints: rec.summary.findriscPoints,
      oncologicIndex: rec.summary.oncologicIndex,
      bmi: rec.summary.bmi,
      cvdNormalized: clamp100(rec.summary.cvdPct * 4),
      findriscNormalized: clamp100((rec.summary.findriscPoints / 26) * 100),
      oncologicNormalized: clamp100(rec.summary.oncologicIndex),
    };
  });

  if (includeCurrent && currentRecord) {
    const alreadyExists = points.some((p) => p.id === currentRecord.id);
    if (!alreadyExists) {
      points.push({
        id: currentRecord.id,
        dateLabel: 'Oggi',
        fullDate: new Date(currentRecord.recordedAtIso).toLocaleDateString('it-IT', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        label: currentRecord.label || 'Analisi attuale',
        isCurrent: true,
        cvdPct: currentRecord.summary.cvdPct,
        findriscPoints: currentRecord.summary.findriscPoints,
        oncologicIndex: currentRecord.summary.oncologicIndex,
        bmi: currentRecord.summary.bmi,
        cvdNormalized: clamp100(currentRecord.summary.cvdPct * 4),
        findriscNormalized: clamp100((currentRecord.summary.findriscPoints / 26) * 100),
        oncologicNormalized: clamp100(currentRecord.summary.oncologicIndex),
      });
    }
  }

  return points;
}

export function triggerArchiveDownload(archive: PersonalArchiveFileV1, filename?: string): void {
  const json = serializePersonalArchiveFile(archive);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || suggestArchiveFilename();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
