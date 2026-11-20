import type {
  ActivityType,
  ClinicalAssessmentResult,
  ClinicalProfileDraft,
  ClinicalProfileInput,
  DomainRiskResult,
  GuidanceAction,
  ModifiableScenario,
  PathologyPopulationComparison,
  PillarRadarDatum,
  RiskFactorDriver,
  RiskTier,
  ValidationErrors,
} from '../types/clinical';
import {
  DEFAULT_CLINICAL_PARAMETERS,
  type ClinicalParameterSet,
} from './clinicalParameters';

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  combined: 'Combinata (aerobico + forza/pesi)',
  aerobic_vigorous: 'Aerobica vigorosa (corsa, ciclismo intenso, nuoto, HIIT)',
  aerobic_moderate: 'Aerobica moderata (camminata veloce, bici leggera)',
  strength_only: 'Solo forza / contro resistenza (palestra, pesi)',
  light: 'Attività leggera (camminata lenta, yoga, mobilità)',
};

export const DEFAULT_CLINICAL_PROFILE: ClinicalProfileInput = {
  age: 48,
  sex: 'male',
  heightCm: 176,
  weightKg: 82,
  waistCm: 95,
  systolicBp: 128,
  onHypertensionMeds: false,
  totalCholesterolMgDl: 205,
  hdlCholesterolMgDl: 52,
  priorHighBloodGlucose: false,
  smokingStatus: 'former',
  packYears: 8,
  alcoholUnitsPerWeek: 5,
  workoutsPerWeek: 2,
  minutesPerWorkout: 45,
  activityType: 'aerobic_moderate',
  dailySteps: 5800,
  sedentaryHoursPerDay: 8,
  fruitVegServingsPerDay: 3,
  redProcessedMeatServingsPerWeek: 4,
  ultraProcessedIntake: 'moderate',
  sleepHoursPerNight: 7,
  uvProtection: 'occasional',
  familyHistoryCvdEarly: false,
  familyHistoryDiabetes: 'second_degree',
  familyHistoryCancerFirstDegree: false,
};

export const EMPTY_CLINICAL_DRAFT: ClinicalProfileDraft = {
  age: null,
  sex: '',
  heightCm: null,
  weightKg: null,
  waistCm: null,
  systolicBp: null,
  onHypertensionMeds: false,
  totalCholesterolMgDl: null,
  hdlCholesterolMgDl: null,
  priorHighBloodGlucose: false,
  smokingStatus: '',
  packYears: null,
  alcoholUnitsPerWeek: null,
  workoutsPerWeek: null,
  minutesPerWorkout: null,
  activityType: '',
  dailySteps: null,
  sedentaryHoursPerDay: null,
  fruitVegServingsPerDay: null,
  redProcessedMeatServingsPerWeek: null,
  ultraProcessedIntake: '',
  sleepHoursPerNight: null,
  uvProtection: '',
  familyHistoryCvdEarly: false,
  familyHistoryDiabetes: '',
  familyHistoryCancerFirstDegree: false,
};

export function profileToDraft(profile: ClinicalProfileInput): ClinicalProfileDraft {
  return {
    age: Number.isFinite(profile.age) ? profile.age : null,
    sex: profile.sex,
    heightCm: Number.isFinite(profile.heightCm) ? profile.heightCm : null,
    weightKg: Number.isFinite(profile.weightKg) ? profile.weightKg : null,
    waistCm: Number.isFinite(profile.waistCm) ? profile.waistCm : null,
    systolicBp: Number.isFinite(profile.systolicBp) ? profile.systolicBp : null,
    onHypertensionMeds: profile.onHypertensionMeds,
    totalCholesterolMgDl: normalizeOptionalLipid(profile.totalCholesterolMgDl),
    hdlCholesterolMgDl: normalizeOptionalLipid(profile.hdlCholesterolMgDl),
    priorHighBloodGlucose: profile.priorHighBloodGlucose,
    smokingStatus: profile.smokingStatus,
    packYears: Number.isFinite(profile.packYears) ? profile.packYears : null,
    alcoholUnitsPerWeek: Number.isFinite(profile.alcoholUnitsPerWeek)
      ? profile.alcoholUnitsPerWeek
      : null,
    workoutsPerWeek: Number.isFinite(profile.workoutsPerWeek) ? profile.workoutsPerWeek : null,
    minutesPerWorkout: Number.isFinite(profile.minutesPerWorkout)
      ? profile.minutesPerWorkout
      : null,
    activityType: profile.activityType,
    dailySteps: normalizeOptionalSteps(profile.dailySteps),
    sedentaryHoursPerDay: Number.isFinite(profile.sedentaryHoursPerDay)
      ? profile.sedentaryHoursPerDay
      : null,
    fruitVegServingsPerDay: Number.isFinite(profile.fruitVegServingsPerDay)
      ? profile.fruitVegServingsPerDay
      : null,
    redProcessedMeatServingsPerWeek: Number.isFinite(profile.redProcessedMeatServingsPerWeek)
      ? profile.redProcessedMeatServingsPerWeek
      : null,
    ultraProcessedIntake: profile.ultraProcessedIntake,
    sleepHoursPerNight: Number.isFinite(profile.sleepHoursPerNight)
      ? profile.sleepHoursPerNight
      : null,
    uvProtection: profile.uvProtection,
    familyHistoryCvdEarly: profile.familyHistoryCvdEarly,
    familyHistoryDiabetes: profile.familyHistoryDiabetes,
    familyHistoryCancerFirstDegree: profile.familyHistoryCancerFirstDegree,
  };
}

export interface ClinicalPreset {
  id: string;
  name: string;
  subtitle: string;
  profile: ClinicalProfileInput;
}

export const CLINICAL_PRESETS: ClinicalPreset[] = [
  {
    id: 'standard',
    name: 'Profilo Intermedio (48 anni)',
    subtitle: 'Sovrappeso lieve · Ex-fumatore · 2 allenamenti/sett · 5.800 passi/die',
    profile: DEFAULT_CLINICAL_PROFILE,
  },
  {
    id: 'protective',
    name: 'Stile di Vita Protettivo (42 anni)',
    subtitle: 'Dieta mediterranea · 4×50 min combinati · 9.500 passi/die',
    profile: {
      age: 42,
      sex: 'female',
      heightCm: 166,
      weightKg: 60,
      waistCm: 74,
      systolicBp: 114,
      onHypertensionMeds: false,
      totalCholesterolMgDl: 178,
      hdlCholesterolMgDl: 66,
      priorHighBloodGlucose: false,
      smokingStatus: 'never',
      packYears: 0,
      alcoholUnitsPerWeek: 1,
      workoutsPerWeek: 4,
      minutesPerWorkout: 50,
      activityType: 'combined',
      dailySteps: 9500,
      sedentaryHoursPerDay: 5,
      fruitVegServingsPerDay: 5,
      redProcessedMeatServingsPerWeek: 1,
      ultraProcessedIntake: 'rare',
      sleepHoursPerNight: 7.5,
      uvProtection: 'consistent',
      familyHistoryCvdEarly: false,
      familyHistoryDiabetes: 'none',
      familyHistoryCancerFirstDegree: false,
    },
  },
  {
    id: 'high_cardiometabolic',
    name: 'Rischio Cardiometabolico Elevato (61 anni)',
    subtitle: 'Fumatore attivo · Ipertensione · 1 allenamento/sett · 3.200 passi/die',
    profile: {
      age: 61,
      sex: 'male',
      heightCm: 175,
      weightKg: 98,
      waistCm: 109,
      systolicBp: 148,
      onHypertensionMeds: true,
      totalCholesterolMgDl: 248,
      hdlCholesterolMgDl: 39,
      priorHighBloodGlucose: true,
      smokingStatus: 'current_heavy',
      packYears: 28,
      alcoholUnitsPerWeek: 16,
      workoutsPerWeek: 1,
      minutesPerWorkout: 30,
      activityType: 'light',
      dailySteps: 3200,
      sedentaryHoursPerDay: 10,
      fruitVegServingsPerDay: 1,
      redProcessedMeatServingsPerWeek: 8,
      ultraProcessedIntake: 'frequent',
      sleepHoursPerNight: 5.5,
      uvProtection: 'rare',
      familyHistoryCvdEarly: true,
      familyHistoryDiabetes: 'first_degree',
      familyHistoryCancerFirstDegree: true,
    },
  },
];

export function normalizeOptionalLipid(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value) || value === 0) {
    return null;
  }
  return value;
}

export function normalizeOptionalSteps(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value) || value === 0) {
    return null;
  }
  return Math.round(value);
}

/**
 * Computes raw weekly workout minutes and WHO-equivalent moderate activity minutes,
 * incorporating modality multiplier (WHO 2020; Momma et al. BJSM 2022) and daily step count
 * (Banach et al. EJPC 2023; Paluch et al. Lancet Public Health 2022).
 */
export function computeEffectiveActivityMetrics(
  input: {
    workoutsPerWeek: number | null;
    minutesPerWorkout: number | null;
    activityType: ActivityType | '';
    dailySteps: number | null;
    physicalActivityMinPerWeek?: number;
  },
  params: ClinicalParameterSet = DEFAULT_CLINICAL_PARAMETERS
): {
  rawWorkoutMinutes: number;
  whoEquivalentMinutes: number;
  stepsBonusMinutes: number;
  dailySteps: number | null;
  hasCombinedModality: boolean;
  meetsWhoTarget: boolean;
} {
  const workouts =
    input.workoutsPerWeek !== null && Number.isFinite(input.workoutsPerWeek)
      ? Math.max(0, input.workoutsPerWeek)
      : 0;
  const duration =
    workouts > 0 && input.minutesPerWorkout !== null && Number.isFinite(input.minutesPerWorkout)
      ? Math.max(0, input.minutesPerWorkout)
      : 0;

  const rawWorkoutMinutes =
    workouts > 0 || duration > 0
      ? Math.round(workouts * duration)
      : Math.round(input.physicalActivityMinPerWeek ?? 0);

  const activityType: ActivityType = input.activityType || 'aerobic_moderate';
  const modalityMultiplier: Record<ActivityType, number> = {
    aerobic_vigorous: 1.8, // WHO 2020: vigorous counts ~2x moderate
    combined: 1.35, // Momma et al. BJSM 2022: aerobic + resistance synergy
    aerobic_moderate: 1.0,
    strength_only: 0.9,
    light: 0.55,
  };

  const dailySteps = normalizeOptionalSteps(input.dailySteps);
  let stepsBonusMinutes = 0;
  if (dailySteps !== null) {
    if (dailySteps >= 10000) stepsBonusMinutes = 90;
    else if (dailySteps >= Math.round(params.dailyStepsOptimalThreshold * 0.94)) stepsBonusMinutes = 60;
    else if (dailySteps >= 5000) stepsBonusMinutes = 25;
  }

  const whoEquivalentMinutes = Math.round(
    rawWorkoutMinutes * modalityMultiplier[activityType] + stepsBonusMinutes
  );

  const hasCombinedModality = activityType === 'combined' && rawWorkoutMinutes >= 90;
  const meetsWhoTarget =
    whoEquivalentMinutes >= params.whoWeeklyMinutesTarget ||
    (dailySteps !== null && dailySteps >= params.dailyStepsOptimalThreshold);

  return {
    rawWorkoutMinutes,
    whoEquivalentMinutes,
    stepsBonusMinutes,
    dailySteps,
    hasCombinedModality,
    meetsWhoTarget,
  };
}

export function validateClinicalProfile(input: ClinicalProfileInput): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!Number.isFinite(input.age) || input.age < 18 || input.age > 95) {
    errors.age = 'Inserire un’età valida compresa tra 18 e 95 anni.';
  }
  if (!Number.isFinite(input.heightCm) || input.heightCm < 120 || input.heightCm > 230) {
    errors.heightCm = 'Altezza richiesta tra 120 e 230 cm.';
  }
  if (!Number.isFinite(input.weightKg) || input.weightKg < 30 || input.weightKg > 250) {
    errors.weightKg = 'Peso richiesto tra 30 e 250 kg.';
  }
  if (!Number.isFinite(input.waistCm) || input.waistCm < 50 || input.waistCm > 180) {
    errors.waistCm = 'Circonferenza vita richiesta tra 50 e 180 cm.';
  }
  if (!Number.isFinite(input.systolicBp) || input.systolicBp < 80 || input.systolicBp > 240) {
    errors.systolicBp = 'Pressione sistolica richiesta tra 80 e 240 mmHg.';
  }

  const totalChol = normalizeOptionalLipid(input.totalCholesterolMgDl);
  const hdlChol = normalizeOptionalLipid(input.hdlCholesterolMgDl);

  if (totalChol !== null && (totalChol < 100 || totalChol > 450)) {
    errors.totalCholesterolMgDl = 'Colesterolo totale tra 100 e 450 mg/dL (oppure lasciare vuoto).';
  }
  if (hdlChol !== null && (hdlChol < 20 || hdlChol > 130)) {
    errors.hdlCholesterolMgDl = 'Colesterolo HDL tra 20 e 130 mg/dL (oppure lasciare vuoto).';
  }
  if (totalChol !== null && hdlChol !== null && hdlChol >= totalChol) {
    errors.hdlCholesterolMgDl = 'Il colesterolo HDL deve essere inferiore al colesterolo totale.';
  }

  if (!Number.isFinite(input.workoutsPerWeek) || input.workoutsPerWeek < 0 || input.workoutsPerWeek > 14) {
    errors.workoutsPerWeek = 'Inserire tra 0 e 14 allenamenti a settimana.';
  }
  if (
    input.workoutsPerWeek > 0 &&
    (!Number.isFinite(input.minutesPerWorkout) ||
      input.minutesPerWorkout < 5 ||
      input.minutesPerWorkout > 240)
  ) {
    errors.minutesPerWorkout = 'Durata singolo allenamento tra 5 e 240 minuti.';
  }

  const safeSteps = normalizeOptionalSteps(input.dailySteps);
  if (safeSteps !== null && (safeSteps < 500 || safeSteps > 50000)) {
    errors.dailySteps = 'Passi giornalieri tra 500 e 50.000 (oppure lasciare vuoto).';
  }

  if (!Number.isFinite(input.alcoholUnitsPerWeek) || input.alcoholUnitsPerWeek < 0 || input.alcoholUnitsPerWeek > 100) {
    errors.alcoholUnitsPerWeek = 'Inserire unità alcoliche settimanali tra 0 e 100.';
  }

  return errors;
}

export function validateClinicalDraft(draft: ClinicalProfileDraft): ValidationErrors {
  const errors: ValidationErrors = {};

  if (draft.age === null || !Number.isFinite(draft.age)) {
    errors.age = 'Campo obbligatorio: inserisci l’età (18–95 anni).';
  } else if (draft.age < 18 || draft.age > 95) {
    errors.age = 'Inserire un’età valida compresa tra 18 e 95 anni.';
  }

  if (!draft.sex) {
    errors.sex = 'Campo obbligatorio: seleziona il sesso biologico.';
  }

  if (draft.heightCm === null || !Number.isFinite(draft.heightCm)) {
    errors.heightCm = 'Campo obbligatorio: inserisci l’altezza (cm).';
  } else if (draft.heightCm < 120 || draft.heightCm > 230) {
    errors.heightCm = 'Altezza richiesta tra 120 e 230 cm.';
  }

  if (draft.weightKg === null || !Number.isFinite(draft.weightKg)) {
    errors.weightKg = 'Campo obbligatorio: inserisci il peso corporeo (kg).';
  } else if (draft.weightKg < 30 || draft.weightKg > 250) {
    errors.weightKg = 'Peso richiesto tra 30 e 250 kg.';
  }

  if (draft.waistCm === null || !Number.isFinite(draft.waistCm)) {
    errors.waistCm = 'Campo obbligatorio: inserisci la circonferenza vita (cm).';
  } else if (draft.waistCm < 50 || draft.waistCm > 180) {
    errors.waistCm = 'Circonferenza vita richiesta tra 50 e 180 cm.';
  }

  if (draft.systolicBp === null || !Number.isFinite(draft.systolicBp)) {
    errors.systolicBp = 'Campo obbligatorio: inserisci la pressione sistolica (mmHg).';
  } else if (draft.systolicBp < 80 || draft.systolicBp > 240) {
    errors.systolicBp = 'Pressione sistolica richiesta tra 80 e 240 mmHg.';
  }

  // Colesterolo: opzionale
  const totalChol = normalizeOptionalLipid(draft.totalCholesterolMgDl);
  const hdlChol = normalizeOptionalLipid(draft.hdlCholesterolMgDl);

  if (totalChol !== null && (totalChol < 100 || totalChol > 450)) {
    errors.totalCholesterolMgDl = 'Colesterolo totale tra 100 e 450 mg/dL (oppure lasciare vuoto).';
  }
  if (hdlChol !== null && (hdlChol < 20 || hdlChol > 130)) {
    errors.hdlCholesterolMgDl = 'Colesterolo HDL tra 20 e 130 mg/dL (oppure lasciare vuoto).';
  }
  if (totalChol !== null && hdlChol !== null && hdlChol >= totalChol) {
    errors.hdlCholesterolMgDl = 'Il colesterolo HDL deve essere inferiore al colesterolo totale.';
  }

  // Alimentazione
  if (draft.fruitVegServingsPerDay === null || !Number.isFinite(draft.fruitVegServingsPerDay)) {
    errors.fruitVegServingsPerDay =
      'Campo obbligatorio: inserisci le porzioni giornaliere di frutta/verdura (0–15).';
  } else if (draft.fruitVegServingsPerDay < 0 || draft.fruitVegServingsPerDay > 15) {
    errors.fruitVegServingsPerDay = 'Valore richiesto tra 0 e 15 porzioni al giorno.';
  }

  if (
    draft.redProcessedMeatServingsPerWeek === null ||
    !Number.isFinite(draft.redProcessedMeatServingsPerWeek)
  ) {
    errors.redProcessedMeatServingsPerWeek =
      'Campo obbligatorio: inserisci le porzioni settimanali di carni rosse/lavorate (0–21).';
  } else if (
    draft.redProcessedMeatServingsPerWeek < 0 ||
    draft.redProcessedMeatServingsPerWeek > 21
  ) {
    errors.redProcessedMeatServingsPerWeek = 'Valore richiesto tra 0 e 21 porzioni a settimana.';
  }

  if (!draft.ultraProcessedIntake) {
    errors.ultraProcessedIntake =
      'Campo obbligatorio: seleziona il consumo di alimenti ultra-processati.';
  }

  if (draft.alcoholUnitsPerWeek === null || !Number.isFinite(draft.alcoholUnitsPerWeek)) {
    errors.alcoholUnitsPerWeek =
      'Campo obbligatorio: inserisci le unità alcoliche a settimana (0 se astemio).';
  } else if (draft.alcoholUnitsPerWeek < 0 || draft.alcoholUnitsPerWeek > 100) {
    errors.alcoholUnitsPerWeek = 'Inserire unità alcoliche settimanali tra 0 e 100.';
  }

  // Stile di vita, fumo e attività fisica
  if (!draft.smokingStatus) {
    errors.smokingStatus = 'Campo obbligatorio: seleziona l’abitudine al fumo.';
  } else if (draft.smokingStatus !== 'never') {
    if (draft.packYears === null || !Number.isFinite(draft.packYears)) {
      errors.packYears =
        'Campo obbligatorio per fumatori/ex-fumatori: inserisci i pacchetti-anno.';
    } else if (draft.packYears < 0 || draft.packYears > 100) {
      errors.packYears = 'Inserire un valore compreso tra 0 e 100 pacchetti-anno.';
    }
  }

  if (draft.workoutsPerWeek === null || !Number.isFinite(draft.workoutsPerWeek)) {
    errors.workoutsPerWeek =
      'Campo obbligatorio: inserisci gli allenamenti a settimana (0 se nessuno).';
  } else if (draft.workoutsPerWeek < 0 || draft.workoutsPerWeek > 14) {
    errors.workoutsPerWeek = 'Inserire tra 0 e 14 allenamenti a settimana.';
  }

  if (draft.workoutsPerWeek !== null && draft.workoutsPerWeek > 0) {
    if (draft.minutesPerWorkout === null || !Number.isFinite(draft.minutesPerWorkout)) {
      errors.minutesPerWorkout =
        'Campo obbligatorio: inserisci la durata del singolo allenamento (min).';
    } else if (draft.minutesPerWorkout < 5 || draft.minutesPerWorkout > 240) {
      errors.minutesPerWorkout = 'Durata singolo allenamento tra 5 e 240 minuti.';
    }

    if (!draft.activityType) {
      errors.activityType =
        'Campo obbligatorio: seleziona la tipologia prevalente di attività fisica.';
    }
  }

  // Passi giornalieri: opzionale
  const safeSteps = normalizeOptionalSteps(draft.dailySteps);
  if (safeSteps !== null && (safeSteps < 500 || safeSteps > 50000)) {
    errors.dailySteps = 'Passi giornalieri tra 500 e 50.000 (oppure lasciare vuoto).';
  }

  if (draft.sedentaryHoursPerDay === null || !Number.isFinite(draft.sedentaryHoursPerDay)) {
    errors.sedentaryHoursPerDay =
      'Campo obbligatorio: inserisci le ore medie seduti al giorno (0–20).';
  } else if (draft.sedentaryHoursPerDay < 0 || draft.sedentaryHoursPerDay > 20) {
    errors.sedentaryHoursPerDay = 'Inserire un valore tra 0 e 20 ore al giorno.';
  }

  if (draft.sleepHoursPerNight === null || !Number.isFinite(draft.sleepHoursPerNight)) {
    errors.sleepHoursPerNight =
      'Campo obbligatorio: inserisci le ore medie di sonno notturno (3–14).';
  } else if (draft.sleepHoursPerNight < 3 || draft.sleepHoursPerNight > 14) {
    errors.sleepHoursPerNight = 'Inserire un valore tra 3 e 14 ore per notte.';
  }

  if (!draft.uvProtection) {
    errors.uvProtection = 'Campo obbligatorio: seleziona il livello di protezione solare UV.';
  }

  // Familiarità
  if (!draft.familyHistoryDiabetes) {
    errors.familyHistoryDiabetes =
      'Campo obbligatorio: seleziona la familiarità per diabete.';
  }

  return errors;
}

export function draftToClinicalProfile(draft: ClinicalProfileDraft): ClinicalProfileInput {
  const workouts = draft.workoutsPerWeek ?? 0;
  return {
    age: draft.age ?? 45,
    sex: draft.sex || 'male',
    heightCm: draft.heightCm ?? 170,
    weightKg: draft.weightKg ?? 70,
    waistCm: draft.waistCm ?? 85,
    systolicBp: draft.systolicBp ?? 120,
    onHypertensionMeds: draft.onHypertensionMeds,
    totalCholesterolMgDl: normalizeOptionalLipid(draft.totalCholesterolMgDl),
    hdlCholesterolMgDl: normalizeOptionalLipid(draft.hdlCholesterolMgDl),
    priorHighBloodGlucose: draft.priorHighBloodGlucose,
    smokingStatus: draft.smokingStatus || 'never',
    packYears: draft.smokingStatus === 'never' ? 0 : (draft.packYears ?? 0),
    alcoholUnitsPerWeek: draft.alcoholUnitsPerWeek ?? 0,
    workoutsPerWeek: workouts,
    minutesPerWorkout: workouts === 0 ? 0 : (draft.minutesPerWorkout ?? 0),
    activityType: draft.activityType || 'light',
    dailySteps: normalizeOptionalSteps(draft.dailySteps),
    sedentaryHoursPerDay: draft.sedentaryHoursPerDay ?? 6,
    fruitVegServingsPerDay: draft.fruitVegServingsPerDay ?? 0,
    redProcessedMeatServingsPerWeek: draft.redProcessedMeatServingsPerWeek ?? 0,
    ultraProcessedIntake: draft.ultraProcessedIntake || 'moderate',
    sleepHoursPerNight: draft.sleepHoursPerNight ?? 7,
    uvProtection: draft.uvProtection || 'occasional',
    familyHistoryCvdEarly: draft.familyHistoryCvdEarly,
    familyHistoryDiabetes: draft.familyHistoryDiabetes || 'none',
    familyHistoryCancerFirstDegree: draft.familyHistoryCancerFirstDegree,
  };
}

export function calculateBmi(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  if (heightM <= 0) return 0;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function classifyBmi(bmi: number): string {
  if (bmi < 18.5) return 'Sottopeso (OMS <18,5)';
  if (bmi < 25) return 'Normopeso (OMS 18,5–24,9)';
  if (bmi < 30) return 'Sovrappeso (OMS 25,0–29,9)';
  if (bmi < 35) return 'Obesità Classe I (OMS 30,0–34,9)';
  return 'Obesità Classe II–III (OMS ≥35,0)';
}

/**
 * Validated FINDRISC (Finnish Diabetes Risk Score)
 * Reference: Lindström J, Tuomilehto J. Diabetes Care. 2003;26(3):725-731. PMID: 12610029.
 * Exact point allocation (0–26) and validated 10-year Type 2 Diabetes incidence bands.
 */
export function calculateFindriscScore(
  input: ClinicalProfileInput,
  bmi: number,
  params: ClinicalParameterSet = DEFAULT_CLINICAL_PARAMETERS
): {
  points: number;
  tenYearProbabilityPct: number;
  tier: RiskTier;
  tierLabel: string;
} {
  let points = 0;

  // 1. Age
  if (input.age >= 65) points += 4;
  else if (input.age >= 55) points += 3;
  else if (input.age >= 45) points += 2;

  // 2. BMI
  if (bmi > 30) points += 3;
  else if (bmi >= 25) points += 1;

  // 3. Waist circumference (sex-specific WHO/IDF thresholds)
  if (input.sex === 'male') {
    if (input.waistCm > 102) points += 4;
    else if (input.waistCm >= 94) points += 3;
  } else {
    if (input.waistCm > 88) points += 4;
    else if (input.waistCm >= 80) points += 3;
  }

  // 4. Daily physical activity (>=WHO target or >=optimal steps)
  const activity = computeEffectiveActivityMetrics(input, params);
  if (
    !activity.meetsWhoTarget &&
    (activity.dailySteps === null ||
      activity.dailySteps < Math.round(params.dailyStepsOptimalThreshold * 0.94))
  ) {
    points += 2;
  }

  // 5. Daily fruit & vegetable consumption (FINDRISC daily = >=3 servings/day)
  if (input.fruitVegServingsPerDay < 3) {
    points += 1;
  }

  // 6. Regular antihypertensive medication
  if (input.onHypertensionMeds) {
    points += 2;
  }

  // 7. History of high blood glucose (prediabetes, gestational, fasting hyperglycemia)
  if (input.priorHighBloodGlucose) {
    points += 5;
  }

  // 8. Family history of diabetes
  if (input.familyHistoryDiabetes === 'first_degree') points += 5;
  else if (input.familyHistoryDiabetes === 'second_degree') points += 3;

  // Validated FINDRISC 10-year probability mapping
  if (points < 7) {
    return { points, tenYearProbabilityPct: 1, tier: 'low', tierLabel: 'Basso' };
  }
  if (points <= 11) {
    return { points, tenYearProbabilityPct: 4, tier: 'moderate', tierLabel: 'Lieve / Moderato' };
  }
  if (points <= 14) {
    return { points, tenYearProbabilityPct: 17, tier: 'elevated', tierLabel: 'Moderato-Elevato' };
  }
  if (points <= 20) {
    return { points, tenYearProbabilityPct: 33, tier: 'high', tierLabel: 'Alto' };
  }
  return { points, tenYearProbabilityPct: 50, tier: 'very_high', tierLabel: 'Molto Alto' };
}

/**
 * Calibrated 10-Year Cardiovascular Event Risk Estimator
 * Grounded in ESC SCORE2 / SCORE2-OP (Eur Heart J 2021;42:2439-2454, PMID: 34120177)
 * European low-to-moderate risk region (Italy is classified as Low-Risk in ESC SCORE2 2021,
 * with risk-modifier adjustments from ESC Prevention Guidelines 2021 for family history & lifestyle).
 */
export function calculateCardiovascularRisk(
  input: ClinicalProfileInput,
  bmi: number,
  params: ClinicalParameterSet = DEFAULT_CLINICAL_PARAMETERS
): {
  tenYearRiskPct: number;
  tier: RiskTier;
  tierLabel: string;
  assumptionsUsed: string[];
} {
  const assumptionsUsed: string[] = [];
  const rawTotal = normalizeOptionalLipid(input.totalCholesterolMgDl);
  const rawHdl = normalizeOptionalLipid(input.hdlCholesterolMgDl);
  const totalChol = rawTotal ?? params.euDefaultTotalCholMgDl;
  const hdlChol = rawHdl ?? (input.sex === 'male' ? 48 : 58);

  if (rawTotal === null || rawHdl === null) {
    assumptionsUsed.push(
      `Profilo lipidico parziale o assente: applicate mediane epidemiologiche europee di riferimento (Col. Totale ${params.euDefaultTotalCholMgDl} mg/dL, HDL 48/58 mg/dL).`
    );
  }
  if (input.age < 40) {
    assumptionsUsed.push(
      'Età <40 anni: SCORE2 è calibrato da 40 anni; la stima rappresenta una proiezione basata su fattori di rischio relativi.'
    );
  }

  // Convert mg/dL to mmol/L (divide by 38.67) for non-HDL cholesterol (ESC SCORE2 primary lipid predictor)
  const nonHdlMmol = Math.max(1.5, (totalChol - hdlChol) / 38.67);
  const isCurrentSmoker =
    input.smokingStatus === 'current_light' || input.smokingStatus === 'current_heavy';

  // Centered predictors (SCORE2 methodology: age centered at 60, SBP at 120 mmHg, non-HDL at 3.8 mmol/L)
  const cAge = (Math.max(input.age, 35) - 60) / 5;
  const cSbp = (input.systolicBp - 120) / 20;
  const cNonHdl = nonHdlMmol - 3.8;
  const smokerTerm = isCurrentSmoker ? 1 : input.smokingStatus === 'former' ? 0.22 : 0;

  let linearPredictor: number;
  let baselineSurvival: number;

  if (input.sex === 'male') {
    linearPredictor =
      0.3742 * cAge +
      0.6012 * smokerTerm +
      0.2777 * cSbp +
      0.1458 * cNonHdl -
      0.0755 * cAge * smokerTerm -
      0.0255 * cAge * cSbp -
      0.0281 * cAge * cNonHdl;
    baselineSurvival = 0.9605;
  } else {
    linearPredictor =
      0.4648 * cAge +
      0.7744 * smokerTerm +
      0.3131 * cSbp +
      0.1002 * cNonHdl -
      0.1088 * cAge * smokerTerm -
      0.0277 * cAge * cSbp -
      0.0226 * cAge * cNonHdl;
    baselineSurvival = 0.9776;
  }

  // Validated ESC 2021 clinical risk modifiers (not directly in base equation)
  if (input.priorHighBloodGlucose) linearPredictor += 0.38;
  if (input.onHypertensionMeds) linearPredictor += 0.14;
  if (input.familyHistoryCvdEarly) linearPredictor += 0.34;
  if (bmi >= 30) linearPredictor += 0.16;
  else if (bmi >= 25) linearPredictor += 0.06;
  const activity = computeEffectiveActivityMetrics(input, params);
  if (activity.meetsWhoTarget) {
    linearPredictor -= 0.14;
    if (activity.hasCombinedModality) linearPredictor -= 0.05;
  } else if (activity.whoEquivalentMinutes < 60) {
    linearPredictor += 0.12;
  }
  // Daily step count modifier (Banach et al. EJPC 2023, PMID 37555441)
  if (activity.dailySteps !== null) {
    if (activity.dailySteps >= params.dailyStepsOptimalThreshold) linearPredictor -= 0.07;
    else if (activity.dailySteps < params.dailyStepsLowThreshold) linearPredictor += 0.08;
  }
  if (
    input.fruitVegServingsPerDay >= params.fruitVegDailyTarget &&
    input.ultraProcessedIntake === 'rare'
  ) {
    linearPredictor -= 0.1;
  }
  if (input.alcoholUnitsPerWeek > 14) linearPredictor += 0.12;

  // Low-risk region calibration (Italy / Southern Europe ESC SCORE2 — governed by manual_review)
  const rawRisk = 1 - Math.pow(baselineSurvival, Math.exp(linearPredictor));
  const calibratedPct = Math.min(
    55,
    Math.max(0.5, Number((rawRisk * 100 * params.score2RegionCalibrationFactor).toFixed(1)))
  );

  // ESC 2021 age-stratified clinical risk thresholds (<50 yrs, 50-69 yrs, >=70 yrs)
  let tier: RiskTier;
  let tierLabel: string;

  if (input.age < 50) {
    if (calibratedPct < 2.5) {
      tier = 'low';
      tierLabel = 'Basso';
    } else if (calibratedPct < 7.5) {
      tier = 'moderate';
      tierLabel = 'Moderato';
    } else {
      tier = 'high';
      tierLabel = 'Alto';
    }
  } else if (input.age < 70) {
    if (calibratedPct < 5.0) {
      tier = 'low';
      tierLabel = 'Basso';
    } else if (calibratedPct < 10.0) {
      tier = 'moderate';
      tierLabel = 'Moderato';
    } else if (calibratedPct < 15.0) {
      tier = 'high';
      tierLabel = 'Alto';
    } else {
      tier = 'very_high';
      tierLabel = 'Molto Alto';
    }
  } else {
    if (calibratedPct < 7.5) {
      tier = 'low';
      tierLabel = 'Basso';
    } else if (calibratedPct < 15.0) {
      tier = 'moderate';
      tierLabel = 'Moderato';
    } else {
      tier = 'high';
      tierLabel = 'Alto';
    }
  }

  return {
    tenYearRiskPct: calibratedPct,
    tier,
    tierLabel,
    assumptionsUsed,
  };
}

/**
 * Preventive Oncologic Risk Index
 * Grounded in WCRF/AICR Third Expert Report (2018, Diet, Nutrition, Physical Activity and Cancer),
 * Shams-White et al. Standardized WCRF/AICR Score (Nutrients 2019, PMID: 31295900),
 * and IARC European Code Against Cancer (4th Ed.).
 * Computes:
 * - Preventive Risk Index (0–100, lower is better)
 * - Estimated Modifiable Relative Risk multiplier vs optimal WCRF/IARC adherence (1.00x baseline)
 * - WCRF/AICR Adherence Score (0–7)
 */
export function calculateOncologicRiskIndex(
  input: ClinicalProfileInput,
  bmi: number,
  params: ClinicalParameterSet = DEFAULT_CLINICAL_PARAMETERS
): {
  riskIndex: number;
  relativeRiskMultiplier: number;
  wcrfAdherenceScore: number;
  tier: RiskTier;
  tierLabel: string;
} {
  // Normalized additive exposure model (exact theoretical range 6–100; zero ceiling saturation)
  let burden = 6; // Baseline biological exposure floor
  let wcrfPoints = 0;

  const safePackYears = Number.isFinite(input.packYears) ? Math.max(0, input.packYears) : 0;

  // 1. Tobacco (IARC Group 1 carcinogen — max 27 pts)
  if (input.smokingStatus === 'never') {
    wcrfPoints += 1;
  } else if (input.smokingStatus === 'former') {
    burden += Math.min(10, 3 + safePackYears * 0.2);
    wcrfPoints += 0.5;
  } else if (input.smokingStatus === 'current_light') {
    burden += 16 + Math.min(4, safePackYears * 0.15);
  } else {
    burden += 22 + Math.min(5, safePackYears * 0.15);
  }

  // 2. Alcohol (IARC Group 1 carcinogen — max 14 pts)
  if (input.alcoholUnitsPerWeek === 0) {
    wcrfPoints += 1;
  } else if (input.alcoholUnitsPerWeek <= 3) {
    burden += 2;
    wcrfPoints += 0.75;
  } else if (input.alcoholUnitsPerWeek <= params.alcoholLowRiskWeeklyLimit) {
    burden += 5;
    wcrfPoints += 0.5;
  } else if (input.alcoholUnitsPerWeek <= 14) {
    burden += 9;
  } else {
    burden += 14;
  }

  // 3. Body fatness (WCRF Strong Evidence for 12+ cancer sites — max 10 pts)
  if (bmi >= 18.5 && bmi < 25) {
    wcrfPoints += 1;
  } else if (bmi >= 25 && bmi < 30) {
    burden += 5;
    wcrfPoints += 0.5;
  } else if (bmi >= 30) {
    burden += 10;
  } else {
    burden += 2;
    wcrfPoints += 0.5;
  }

  // 4. Physical Activity, Modality, Daily Steps & Sedentary behavior (WCRF/AIRC + JAMA Intern Med 2022 — max 10 pts)
  const activity = computeEffectiveActivityMetrics(input, params);
  if (activity.meetsWhoTarget) {
    wcrfPoints += 1;
    if (
      activity.hasCombinedModality &&
      activity.dailySteps !== null &&
      activity.dailySteps >= params.dailyStepsOptimalThreshold
    ) {
      burden = Math.max(6, burden - 2);
    }
  } else if (activity.whoEquivalentMinutes >= Math.round(params.whoWeeklyMinutesTarget / 2)) {
    burden += 4;
    wcrfPoints += 0.5;
  } else {
    burden += 8;
  }
  if (input.sedentaryHoursPerDay >= 9) {
    burden += 2;
  }

  // 5. Plant-based diet / fiber (max 6 pts)
  if (input.fruitVegServingsPerDay >= params.fruitVegDailyTarget) {
    wcrfPoints += 1;
  } else if (input.fruitVegServingsPerDay >= 3) {
    burden += 3;
    wcrfPoints += 0.5;
  } else {
    burden += 6;
  }

  // 6. Red & processed meat (IARC Group 1/2A — max 7 pts)
  if (input.redProcessedMeatServingsPerWeek <= Math.max(1, params.redMeatWeeklyLimit - 1)) {
    wcrfPoints += 1;
  } else if (input.redProcessedMeatServingsPerWeek <= params.redMeatWeeklyLimit + 1) {
    burden += 3;
    wcrfPoints += 0.5;
  } else {
    burden += 7;
  }

  // 7. Ultra-processed foods & refined sugars (governed by guarded_auto parameter)
  if (input.ultraProcessedIntake === 'rare') {
    wcrfPoints += 1;
  } else if (input.ultraProcessedIntake === 'moderate') {
    burden += Number((params.upfHighRiskOncoPoints / 2).toFixed(1));
    wcrfPoints += 0.5;
  } else {
    burden += params.upfHighRiskOncoPoints;
  }

  // 8. UV Protection (IARC Group 1 — max 4 pts)
  if (input.uvProtection === 'occasional') burden += 2;
  else if (input.uvProtection === 'rare') burden += 4;

  // 9. Non-modifiable biological & familial modifiers (max 10 pts)
  if (input.age >= 65) burden += 5;
  else if (input.age >= 50) burden += 3;
  if (input.familyHistoryCancerFirstDegree) {
    burden += 5;
  }

  const riskIndex = Math.min(100, Math.max(6, Math.round(burden)));
  // Approximate epidemiological relative risk vs optimal reference adherence (1.00x)
  const relativeRiskMultiplier = Number(
    (0.82 + (riskIndex / 100) * params.wcrfRelativeRiskSlope).toFixed(2)
  );
  const roundedWcrf = Number(wcrfPoints.toFixed(1));

  let tier: RiskTier;
  let tierLabel: string;

  if (riskIndex < 24) {
    tier = 'low';
    tierLabel = 'Basso';
  } else if (riskIndex < 44) {
    tier = 'moderate';
    tierLabel = 'Moderato';
  } else if (riskIndex < 64) {
    tier = 'elevated';
    tierLabel = 'Elevato';
  } else {
    tier = 'high';
    tierLabel = 'Alto';
  }

  return {
    riskIndex,
    relativeRiskMultiplier,
    wcrfAdherenceScore: roundedWcrf,
    tier,
    tierLabel,
  };
}

function buildRadarData(input: ClinicalProfileInput, bmi: number): PillarRadarDatum[] {
  const smokeScore =
    input.smokingStatus === 'never'
      ? 100
      : input.smokingStatus === 'former'
        ? 72
        : input.smokingStatus === 'current_light'
          ? 30
          : 10;

  const activity = computeEffectiveActivityMetrics(input);
  const modalityBonus = activity.hasCombinedModality ? 10 : 0;
  const activityScore = Math.min(
    100,
    Math.round((activity.whoEquivalentMinutes / 180) * 90) + modalityBonus
  );

  let dietScore = 40;
  dietScore += Math.min(30, input.fruitVegServingsPerDay * 6);
  dietScore += input.redProcessedMeatServingsPerWeek <= 2 ? 15 : input.redProcessedMeatServingsPerWeek <= 4 ? 8 : 0;
  dietScore += input.ultraProcessedIntake === 'rare' ? 15 : input.ultraProcessedIntake === 'moderate' ? 7 : 0;
  dietScore = Math.min(100, dietScore);

  const bmiScore =
    bmi >= 18.5 && bmi < 25 ? 100 : bmi >= 25 && bmi < 28 ? 72 : bmi >= 28 && bmi < 31 ? 45 : 22;

  const bpScore =
    input.systolicBp < 120 ? 100 : input.systolicBp < 130 ? 82 : input.systolicBp < 140 ? 58 : 28;
  const metabolicScore = input.priorHighBloodGlucose ? Math.max(20, bpScore - 28) : bpScore;

  const alcoholUvScore = Math.max(
    15,
    100 -
      Math.min(60, input.alcoholUnitsPerWeek * 4) -
      (input.uvProtection === 'rare' ? 25 : input.uvProtection === 'occasional' ? 10 : 0)
  );

  return [
    { pillar: 'Assenza Fumo', userScore: smokeScore, guidelineTarget: 100 },
    { pillar: 'Attività Fisica', userScore: activityScore, guidelineTarget: 85 },
    { pillar: 'Qualità Dieta', userScore: dietScore, guidelineTarget: 90 },
    { pillar: 'Peso & Vita', userScore: bmiScore, guidelineTarget: 95 },
    { pillar: 'Pressione & Glicemia', userScore: metabolicScore, guidelineTarget: 90 },
    { pillar: 'Alcol & UV', userScore: alcoholUvScore, guidelineTarget: 90 },
  ];
}

function buildDrivers(input: ClinicalProfileInput, bmi: number): RiskFactorDriver[] {
  const drivers: RiskFactorDriver[] = [];

  if (input.smokingStatus === 'current_light' || input.smokingStatus === 'current_heavy') {
    drivers.push({
      id: 'smoking',
      label: 'Fumo di tabacco attivo',
      domain: 'multi',
      impact: 'high_risk',
      modifiable: true,
      currentValue:
        input.smokingStatus === 'current_heavy'
          ? `Fumatore intenso (${input.packYears} pacchetti-anno)`
          : `Fumatore attivo (${input.packYears} pacchetti-anno)`,
      clinicalTarget: 'Cessazione completa (0 sigarette)',
      citation: 'IARC Monograph 100E · ESC 2021 Guidelines',
    });
  } else if (input.smokingStatus === 'never') {
    drivers.push({
      id: 'smoking_ok',
      label: 'Assenza di esposizione al tabacco',
      domain: 'multi',
      impact: 'protective',
      modifiable: true,
      currentValue: 'Non fumatore',
      clinicalTarget: 'Mantenimento astensione',
      citation: 'Codice Europeo Contro il Cancro (4ª ed.)',
    });
  }

  if (input.systolicBp >= 140) {
    drivers.push({
      id: 'sbp_high',
      label: 'Pressione arteriosa sistolica elevata',
      domain: 'cardiovascular',
      impact: 'high_risk',
      modifiable: true,
      currentValue: `${input.systolicBp} mmHg`,
      clinicalTarget: '< 130 mmHg (target ESC 2024)',
      citation: 'ESC/ESH Hypertension Guidelines 2024',
    });
  } else if (input.systolicBp >= 130) {
    drivers.push({
      id: 'sbp_mod',
      label: 'Pressione arteriosa normale-alta',
      domain: 'cardiovascular',
      impact: 'moderate_risk',
      modifiable: true,
      currentValue: `${input.systolicBp} mmHg`,
      clinicalTarget: '< 120–129 mmHg',
      citation: 'ESC 2024 Elevated BP Classification',
    });
  }

  const waistThreshold = input.sex === 'male' ? 94 : 80;
  const waistHigh = input.sex === 'male' ? 102 : 88;
  if (bmi >= 30 || input.waistCm > waistHigh) {
    drivers.push({
      id: 'adiposity_high',
      label: 'Adiposità viscerale / BMI elevato',
      domain: 'multi',
      impact: 'high_risk',
      modifiable: true,
      currentValue: `BMI ${bmi} kg/m² · Vita ${input.waistCm} cm`,
      clinicalTarget: `BMI 18,5–24,9 · Vita < ${waistThreshold} cm`,
      citation: 'WHO Adiposity · WCRF/AICR 2018 · IDF FINDRISC',
    });
  } else if (bmi >= 25 || input.waistCm >= waistThreshold) {
    drivers.push({
      id: 'adiposity_mod',
      label: 'Sovrappeso / Circonferenza vita sopra soglia',
      domain: 'metabolic',
      impact: 'moderate_risk',
      modifiable: true,
      currentValue: `BMI ${bmi} kg/m² · Vita ${input.waistCm} cm`,
      clinicalTarget: `BMI < 25 · Vita < ${waistThreshold} cm`,
      citation: 'IDF Metabolic Syndrome Criteria',
    });
  }

  if (input.priorHighBloodGlucose) {
    drivers.push({
      id: 'glucose_history',
      label: 'Pregressa iperglicemia / prediabete',
      domain: 'metabolic',
      impact: 'high_risk',
      modifiable: true,
      currentValue: 'Anamnesi positiva',
      clinicalTarget: 'Monitoraggio HbA1c e glicemia a digiuno (<100 mg/dL)',
      citation: 'ADA Standards of Care 2025 · FINDRISC',
    });
  }

  const activity = computeEffectiveActivityMetrics(input);
  const stepsSummary =
    activity.dailySteps !== null
      ? ` · ${activity.dailySteps.toLocaleString('it-IT')} passi/die`
      : '';
  const activitySummary = `${input.workoutsPerWeek}×${input.minutesPerWorkout} min (${activity.whoEquivalentMinutes} eq. OMS/sett)${stepsSummary}`;

  if (!activity.meetsWhoTarget) {
    drivers.push({
      id: 'activity_low',
      label: 'Attività fisica o passi giornalieri sotto la soglia preventiva',
      domain: 'multi',
      impact: activity.whoEquivalentMinutes < 60 ? 'high_risk' : 'moderate_risk',
      modifiable: true,
      currentValue: activitySummary,
      clinicalTarget: '≥150 min/sett combinati (aerobico + forza) e ≥7.500–8.000 passi/die',
      citation: 'WHO 2020 · EJPC 2023 (PMID 37555441) · AIRC',
    });
  } else {
    drivers.push({
      id: 'activity_ok',
      label: activity.hasCombinedModality
        ? 'Attività fisica combinata (aerobico + forza) ottimale'
        : 'Aderenza attività fisica OMS / passi giornalieri',
      domain: 'multi',
      impact: 'protective',
      modifiable: true,
      currentValue: activitySummary,
      clinicalTarget: '≥150 min/sett combinati · ≥7.500 passi/die',
      citation: 'WHO 2020 · Momma BJSM 2022 · AIRC',
    });
  }

  if (input.alcoholUnitsPerWeek > 7) {
    drivers.push({
      id: 'alcohol',
      label: 'Consumo alcolico superiore alla soglia preventiva',
      domain: 'oncologic',
      impact: input.alcoholUnitsPerWeek > 14 ? 'high_risk' : 'moderate_risk',
      modifiable: true,
      currentValue: `${input.alcoholUnitsPerWeek} unità/settimana`,
      clinicalTarget: '0 unità per prevenzione oncologica (OMS 2023)',
      citation: 'WHO Europe Alcohol & Cancer Statement (Lancet Public Health 2023)',
    });
  }

  if (input.redProcessedMeatServingsPerWeek > 3 || input.ultraProcessedIntake === 'frequent') {
    drivers.push({
      id: 'diet_risk',
      label: 'Elevato consumo di carni lavorate o ultra-processati',
      domain: 'oncologic',
      impact: input.ultraProcessedIntake === 'frequent' ? 'high_risk' : 'moderate_risk',
      modifiable: true,
      currentValue: `${input.redProcessedMeatServingsPerWeek} porzioni carne/sett · UPF: ${
        input.ultraProcessedIntake === 'frequent'
          ? 'Frequenti'
          : input.ultraProcessedIntake === 'moderate'
            ? 'Moderati'
            : 'Rari'
      }`,
      clinicalTarget: 'Carni rosse ≤ 3 porzioni/sett, carni lavorate 0, UPF minimi',
      citation: 'WCRF/AICR 2018 · BMJ 2024 Umbrella Review UPF',
    });
  }

  if (
    input.familyHistoryCvdEarly ||
    input.familyHistoryDiabetes === 'first_degree' ||
    input.familyHistoryCancerFirstDegree
  ) {
    const items: string[] = [];
    if (input.familyHistoryCvdEarly) items.push('CVD precoce');
    if (input.familyHistoryDiabetes === 'first_degree') items.push('Diabete 1° grado');
    if (input.familyHistoryCancerFirstDegree) items.push('Oncologica 1° grado');
    drivers.push({
      id: 'family_history',
      label: 'Predisposizione familiare documentata',
      domain: 'multi',
      impact: 'moderate_risk',
      modifiable: false,
      currentValue: items.join(', '),
      clinicalTarget: 'Anticipare valutazione screening personalizzato con MMG',
      citation: 'ESC 2021 · AIOM / NCCN Screening Guidelines',
    });
  }

  const order = { high_risk: 0, moderate_risk: 1, protective: 2 };
  return drivers.sort((a, b) => order[a.impact] - order[b.impact]);
}

function buildModifiableScenarios(
  input: ClinicalProfileInput,
  baseBmi: number,
  baseCvd: number,
  baseFindrisc: number,
  baseOnco: number
): ModifiableScenario[] {
  const scenarios: ModifiableScenario[] = [];

  if (input.smokingStatus === 'current_light' || input.smokingStatus === 'current_heavy') {
    const sim: ClinicalProfileInput = { ...input, smokingStatus: 'former' };
    const simCvd = calculateCardiovascularRisk(sim, baseBmi).tenYearRiskPct;
    const simOnco = calculateOncologicRiskIndex(sim, baseBmi).riskIndex;
    scenarios.push({
      id: 'quit_smoking',
      title: 'Cessazione del fumo di tabacco',
      description: 'Transizione a ex-fumatore con supporto clinico o farmacologico validato.',
      cvdDeltaPct: Number((simCvd - baseCvd).toFixed(1)),
      diabetesDeltaPoints: 0,
      oncologicDeltaIndex: simOnco - baseOnco,
      evidenceSource: 'ESC 2021 · IARC Tobacco Control Handbook',
    });
  }

  const baseActivity = computeEffectiveActivityMetrics(input);
  if (!baseActivity.meetsWhoTarget || !baseActivity.hasCombinedModality || (baseActivity.dailySteps !== null && baseActivity.dailySteps < 7500)) {
    const sim: ClinicalProfileInput = {
      ...input,
      workoutsPerWeek: Math.max(input.workoutsPerWeek, 4),
      minutesPerWorkout: Math.max(input.minutesPerWorkout, 45),
      activityType: 'combined',
      dailySteps: Math.max(baseActivity.dailySteps ?? 0, 8500),
      sedentaryHoursPerDay: Math.min(input.sedentaryHoursPerDay, 6),
    };
    const simCvd = calculateCardiovascularRisk(sim, baseBmi).tenYearRiskPct;
    const simFin = calculateFindriscScore(sim, baseBmi).points;
    const simOnco = calculateOncologicRiskIndex(sim, baseBmi).riskIndex;
    if (simCvd < baseCvd || simFin < baseFindrisc || simOnco < baseOnco) {
      scenarios.push({
        id: 'reach_who_activity',
        title: 'Allenamento combinato (4×45 min) + 8.500 passi/die',
        description:
          'Combinare allenamento aerobico e forza muscolare con almeno 8.000–8.500 passi giornalieri massimizza la riduzione del rischio cardiovascolare, metabolico e oncologico.',
        cvdDeltaPct: Number((simCvd - baseCvd).toFixed(1)),
        diabetesDeltaPoints: simFin - baseFindrisc,
        oncologicDeltaIndex: simOnco - baseOnco,
        evidenceSource: 'WHO 2020 · EJPC 2023 (PMID 37555441) · AIRC',
      });
    }
  }

  if (
    input.fruitVegServingsPerDay < 5 ||
    input.redProcessedMeatServingsPerWeek > 2 ||
    input.ultraProcessedIntake !== 'rare' ||
    input.alcoholUnitsPerWeek > 2
  ) {
    const sim: ClinicalProfileInput = {
      ...input,
      fruitVegServingsPerDay: Math.max(5, input.fruitVegServingsPerDay),
      redProcessedMeatServingsPerWeek: Math.min(2, input.redProcessedMeatServingsPerWeek),
      ultraProcessedIntake: 'rare',
      alcoholUnitsPerWeek: Math.min(1, input.alcoholUnitsPerWeek),
    };
    const simCvd = calculateCardiovascularRisk(sim, baseBmi).tenYearRiskPct;
    const simFin = calculateFindriscScore(sim, baseBmi).points;
    const simOnco = calculateOncologicRiskIndex(sim, baseBmi).riskIndex;
    scenarios.push({
      id: 'mediterranean_wcrf',
      title: 'Aderenza Dieta Mediterranea & WCRF/AICR',
      description: '≥5 porzioni vegetali/giorno, carni lavorate azzerate, ultra-processati minimi, alcol ≤1 unità/sett.',
      cvdDeltaPct: Number((simCvd - baseCvd).toFixed(1)),
      diabetesDeltaPoints: simFin - baseFindrisc,
      oncologicDeltaIndex: simOnco - baseOnco,
      evidenceSource: 'PREDIMED Study (NEJM 2018) · WCRF/AICR 2018',
    });
  }

  if (baseBmi >= 26) {
    const targetWeight = Math.round(input.weightKg * 0.92);
    const targetWaist = Math.max(70, input.waistCm - 7);
    const sim: ClinicalProfileInput = {
      ...input,
      weightKg: targetWeight,
      waistCm: targetWaist,
      systolicBp: Math.max(115, input.systolicBp - 6),
    };
    const simBmi = calculateBmi(sim.heightCm, sim.weightKg);
    const simCvd = calculateCardiovascularRisk(sim, simBmi).tenYearRiskPct;
    const simFin = calculateFindriscScore(sim, simBmi).points;
    const simOnco = calculateOncologicRiskIndex(sim, simBmi).riskIndex;
    scenarios.push({
      id: 'weight_reduction_8pct',
      title: 'Riduzione ponderale clinica (−8% peso corporeo)',
      description: `Passaggio stimato a ${targetWeight} kg (BMI ${simBmi}) con riduzione della circonferenza vita (−7 cm) e della pressione sistolica.`,
      cvdDeltaPct: Number((simCvd - baseCvd).toFixed(1)),
      diabetesDeltaPoints: simFin - baseFindrisc,
      oncologicDeltaIndex: simOnco - baseOnco,
      evidenceSource: 'Look AHEAD · DPP Outcomes · ESC Prevention 2021',
    });
  }

  return scenarios;
}

function buildGuidanceActions(
  input: ClinicalProfileInput,
  bmi: number,
  cvd: { tenYearRiskPct: number; tier: RiskTier },
  findrisc: { points: number; tier: RiskTier },
  onco: { riskIndex: number; tier: RiskTier }
): { guidanceActions: GuidanceAction[]; screeningNotes: string[] } {
  const actions: GuidanceAction[] = [];

  if (input.smokingStatus === 'current_light' || input.smokingStatus === 'current_heavy') {
    actions.push({
      priority: 1,
      title: 'Percorso strutturato di disassuefazione dal tabacco',
      rationale:
        'Il fumo è il singolo fattore modificabile con il massimo peso simultaneo su mortalità cardiovascolare e incidenza oncologica (polmone, vescica, pancreas, cavo orale).',
      clinicalDiscussionPoint:
        'Richiedere al MMG l’accesso a un Centro Antifumo SSN o terapia farmacologica di prima linea (es. citisina, vareniclina o NRT combinata).',
      guideline: 'ESC 2021 · ISS Linee Guida Tabagismo',
    });
  }

  if (cvd.tier === 'high' || cvd.tier === 'very_high' || input.systolicBp >= 140) {
    actions.push({
      priority: 1,
      title: 'Valutazione cardiometabolica e assetto lipidico completo',
      rationale:
        'Il punteggio SCORE2 indica una probabilità elevata di eventi cardiovascolari nei prossimi 10 anni; il controllo pressorio (<130/80 mmHg) e del colesterolo LDL/ApoB riduce drasticamente il rischio.',
      clinicalDiscussionPoint:
        'Discutere con il medico profilo lipidico completo (inclusa Lipoproteina(a) almeno una volta nella vita secondo ESC), monitoraggio pressorio domiciliare (HBPM) e indicazione a terapia preventiva.',
      guideline: 'ESC/EAS Dyslipidaemia & ESC Hypertension 2024',
    });
  }

  if (findrisc.points >= 12 || input.priorHighBloodGlucose) {
    actions.push({
      priority: 1,
      title: 'Screening glicemico (HbA1c e glicemia a digiuno) e intervento nutrizionale',
      rationale:
        'Un punteggio FINDRISC ≥12 individua un rischio significativo di progressione verso il Diabete di Tipo 2 nei 10 anni. Negli studi DPP e DPS, interventi intensivi sullo stile di vita riducono l’incidenza del 58%.',
      clinicalDiscussionPoint:
        'Concordare con il MMG dosaggio di emoglobina glicata (HbA1c), glicemia plasmatica a digiuno ed eventuale curva da carico (OGTT) secondo criteri ADA/SID.',
      guideline: 'IDF FINDRISC · ADA Standards of Care 2025 · SID-AMD',
    });
  }

  const activityMetrics = computeEffectiveActivityMetrics(input);
  if (!activityMetrics.meetsWhoTarget || !activityMetrics.hasCombinedModality || bmi >= 25) {
    actions.push({
      priority: 2,
      title: 'Progressione verso allenamento combinato (aerobico + forza) e ≥7.500–8.000 passi/die',
      rationale:
        'L’esercizio combinato (aerobico + contro resistenza) e un volume quotidiano di 7.500–9.000 passi migliorano la sensibilità insulinica e riducono mortalità cardiovascolare e incidenza oncologica (colon-retto, mammella, endometrio).',
      clinicalDiscussionPoint:
        'Pianificare 3–4 sessioni settimanali da 40–50 minuti alternando cardio e rinforzo muscolare, aumentando gradualmente i passi quotidiani (+1.000 passi/die).',
      guideline: 'WHO 2020 · EJPC 2023 · Fondazione AIRC',
    });
  }

  if (onco.tier === 'elevated' || onco.tier === 'high' || input.alcoholUnitsPerWeek > 7 || input.redProcessedMeatServingsPerWeek > 3) {
    actions.push({
      priority: 2,
      title: 'Ottimizzazione nutrizionale WCRF/AICR e riduzione esposizione a cancerogeni',
      rationale:
        'Aumentare l’apporto di fibre (>30 g/die da legumi, cereali integrali, verdure), limitare le carni rosse (<350–500 g/sett), evitare carni lavorate e ridurre l’alcol abbatte l’infiammazione sistemica.',
      clinicalDiscussionPoint:
        'Valutare un piano nutrizionale basato sul modello Mediterraneo tradizionale con un biologo nutrizionista o medico dietologo.',
      guideline: 'WCRF/AICR Third Expert Report · Codice Europeo Contro il Cancro',
    });
  }

  if (actions.length < 3) {
    actions.push({
      priority: 3,
      title: 'Mantenimento dei fattori protettivi e rivalutazione periodica',
      rationale:
        'Il profilo attuale mostra una buona aderenza preventiva. La rivalutazione annuale dei parametri biometrici e pressori consente di intercettare precocemente eventuali variazioni legate all’età.',
      clinicalDiscussionPoint:
        'Aggiornare annualmente pressione arteriosa, peso, circonferenza vita e profilo ematochimico di base con il medico curante.',
      guideline: 'ESC Prevention Guidelines · Ministero della Salute',
    });
  }

  const screeningNotes: string[] = [];
  if (input.age >= 50 && input.age <= 74) {
    screeningNotes.push(
      'Screening tumore del colon-retto (SSN / Linee Guida UE): ricerca sangue occulto fecale (SOF) ogni 2 anni dai 50 ai 69–74 anni (o anticipato in caso di familiarità di 1° grado).'
    );
  }
  if (input.sex === 'female' && input.age >= 45 && input.age <= 74) {
    screeningNotes.push(
      'Screening mammografico (Linee Guida UE / AIOM): mammografia periodica secondo fascia d’età regionale (45–74 anni) e screening cervicale (HPV-DNA / Pap-test).'
    );
  }
  if (
    input.age >= 50 &&
    input.age <= 80 &&
    (input.smokingStatus === 'current_heavy' || input.packYears >= 20)
  ) {
    screeningNotes.push(
      'Prevenzione polmonare ad alto rischio (USPSTF / programmi RISP): discutere con lo specialista l’eventuale eleggibilità a TC torace a basso dosaggio (LDCT) per storia di fumo ≥20 pacchetti-anno.'
    );
  }
  if (input.familyHistoryCancerFirstDegree) {
    screeningNotes.push(
      'Familiarità oncologica di 1° grado dichiarata: discutere con il MMG o un centro di oncogenetica l’eventuale anticipazione dell’età di inizio degli screening organo-specifici.'
    );
  }
  if (screeningNotes.length === 0) {
    screeningNotes.push(
      'Mantenere l’adesione ai programmi di screening organizzati del Servizio Sanitario Nazionale in base alla propria fascia d’età e anamnesi familiare.'
    );
  }

  return {
    guidanceActions: actions.slice(0, 4),
    screeningNotes,
  };
}

export function evaluateClinicalRisk(
  input: ClinicalProfileInput,
  params: ClinicalParameterSet = DEFAULT_CLINICAL_PARAMETERS
): ClinicalAssessmentResult {
  const bmi = calculateBmi(input.heightCm, input.weightKg);
  const bmiCategory = classifyBmi(bmi);

  const cvdCalc = calculateCardiovascularRisk(input, bmi, params);
  const findriscCalc = calculateFindriscScore(input, bmi, params);
  const oncoCalc = calculateOncologicRiskIndex(input, bmi, params);

  const safeTotalChol = normalizeOptionalLipid(input.totalCholesterolMgDl);
  const safeHdlChol = normalizeOptionalLipid(input.hdlCholesterolMgDl);
  const nonHdlMgDl =
    safeTotalChol !== null && safeHdlChol !== null
      ? Math.max(40, Math.round(safeTotalChol - safeHdlChol))
      : null;

  const cardiovascular: DomainRiskResult = {
    scoreNumeric: cvdCalc.tenYearRiskPct,
    unit: '% rischio 10 anni',
    secondaryScoreLabel: 'Colesterolo Non-HDL · Calibrazione',
    secondaryScoreValue:
      nonHdlMgDl !== null ? `${nonHdlMgDl} mg/dL · UE Basso Rischio` : 'Mediana UE · Basso Rischio',
    tier: cvdCalc.tier,
    tierLabel: cvdCalc.tierLabel,
    protocolName: 'ESC SCORE2 / SCORE2-OP (2021)',
    protocolReference: 'Eur Heart J 2021;42:2439–2454 · PMID 34120177',
    horizonLabel: 'Eventi CV fatali e non fatali a 10 anni',
    summary:
      cvdCalc.tier === 'low'
        ? 'Rischio stimato a 10 anni contenuto rispetto alla fascia d’età; proseguire con il mantenimento dei fattori protettivi.'
        : cvdCalc.tier === 'moderate'
          ? 'Rischio intermedio: l’ottimizzazione di pressione arteriosa, lipidi non-HDL e stile di vita produce benefici significativi.'
          : 'Rischio cardiovascolare rilevante: raccomandata discussione strutturata con il medico curante per la gestione intensiva dei fattori modificabili.',
    assumptionsUsed: cvdCalc.assumptionsUsed,
  };

  const metabolic: DomainRiskResult = {
    scoreNumeric: findriscCalc.points,
    unit: '/ 26 pt FINDRISC',
    secondaryScoreLabel: 'Probabilità Diabete Tipo 2 (10 anni)',
    secondaryScoreValue:
      findriscCalc.tenYearProbabilityPct === 1 ? '< 1%' : `~${findriscCalc.tenYearProbabilityPct}%`,
    tier: findriscCalc.tier,
    tierLabel: findriscCalc.tierLabel,
    protocolName: 'FINDRISC Validated Protocol (IDF / WHO)',
    protocolReference: 'Lindström & Tuomilehto, Diabetes Care 2003 · PMID 12610029',
    horizonLabel: 'Incidenza Diabete Tipo 2 a 10 anni',
    summary:
      findriscCalc.points < 7
        ? 'Bassa probabilità statistica (<1%) di sviluppare diabete di tipo 2 nel prossimo decennio.'
        : findriscCalc.points < params.findriscHighRiskCutoff
          ? 'Rischio lievemente aumentato (~4%, circa 1 persona su 25). Piccoli miglioramenti su circonferenza vita e attività fisica riportano il profilo nella fascia ottimale.'
          : findriscCalc.points <= 14
            ? 'Rischio moderato-elevato (~17%, circa 1 su 6). Indicato verificare glicemia a digiuno e HbA1c con il medico.'
            : 'Rischio metabolico elevato (≥33%). Fortemente consigliato inquadramento clinico glicometabolico e programma preventivo strutturato.',
    assumptionsUsed: [],
  };

  const oncologic: DomainRiskResult = {
    scoreNumeric: oncoCalc.riskIndex,
    unit: '/ 100 indice',
    secondaryScoreLabel: 'Rischio Relativo Stimato · Aderenza WCRF',
    secondaryScoreValue: `${oncoCalc.relativeRiskMultiplier.toFixed(2)}× · ${oncoCalc.wcrfAdherenceScore}/7`,
    tier: oncoCalc.tier,
    tierLabel: oncoCalc.tierLabel,
    protocolName: 'WCRF/AICR (2018) · Fondazione AIRC & IARC',
    protocolReference: 'WCRF Third Expert Report · AIRC · PMID 31295900',
    horizonLabel: 'Esposizione cumulativa a fattori oncologici',
    summary:
      oncoCalc.tier === 'low'
        ? 'Elevata aderenza alle raccomandazioni WCRF/AICR e IARC. Oltre il 40% dei tumori è legato a fattori modificabili ben controllati nel tuo profilo.'
        : oncoCalc.tier === 'moderate'
          ? 'Margine concreto di riduzione del rischio oncologico agendo su alimentazione vegetale, alcol, attività fisica e controllo ponderale.'
          : 'Presenza di multipli determinanti oncologici modificabili o familiarità: priorità alla riduzione delle esposizioni IARC Gruppo 1 e agli screening di fascia d’età.',
    assumptionsUsed: [
      'Indice epidemiologico preventivo multi-sito: non sostituisce calcolatori genetici o organo-specifici (es. Gail, Tyrer-Cuzick, BRCA).',
    ],
  };

  const drivers = buildDrivers(input, bmi);
  const radarData = buildRadarData(input, bmi);
  const populationComparison = buildPopulationComparison(
    input,
    cvdCalc.tenYearRiskPct,
    findriscCalc.points,
    oncoCalc.riskIndex,
    params
  );
  const modifiableScenarios = buildModifiableScenarios(
    input,
    bmi,
    cvdCalc.tenYearRiskPct,
    findriscCalc.points,
    oncoCalc.riskIndex
  );
  const { guidanceActions, screeningNotes } = buildGuidanceActions(
    input,
    bmi,
    cvdCalc,
    findriscCalc,
    oncoCalc
  );

  return {
    computedAt: new Date().toISOString(),
    parameterVersion: params.version,
    bmi,
    bmiCategory,
    cardiovascular,
    metabolic,
    oncologic,
    drivers,
    radarData,
    populationComparison,
    modifiableScenarios,
    guidanceActions,
    screeningNotes,
  };
}

/**
 * Compares the user's computed risk scores against age- and sex-calibrated
 * European general population reference ranges (ESC SCORE2 low-risk cohort,
 * IDF/DE-PLAN FINDRISC distribution, and EPIC/WCRF/AIRC European adherence cohort).
 */
export function buildPopulationComparison(
  input: ClinicalProfileInput,
  cvdTenYearPct: number,
  findriscPoints: number,
  oncoRiskIndex: number,
  params: ClinicalParameterSet = DEFAULT_CLINICAL_PARAMETERS
): PathologyPopulationComparison[] {
  // 1. Cardiovascular — ESC SCORE2 / SCORE2-OP European Low-Risk Cohort (Eur Heart J 2021)
  let cvLow: number;
  let cvMedian: number;
  let cvHigh: number;
  let cvOptimal: number;
  let cvScaleMax: number;

  if (input.age < 50) {
    cvOptimal = 2.5;
    cvScaleMax = 10.0;
    if (input.sex === 'male') {
      cvLow = 1.2;
      cvMedian = 2.4;
      cvHigh = 4.2;
    } else {
      cvLow = 0.6;
      cvMedian = 1.3;
      cvHigh = 2.5;
    }
  } else if (input.age < 70) {
    cvOptimal = 5.0;
    cvScaleMax = 16.0;
    if (input.sex === 'male') {
      cvLow = 3.5;
      cvMedian = 6.2;
      cvHigh = 9.8;
    } else {
      cvLow = 1.8;
      cvMedian = 3.4;
      cvHigh = 5.8;
    }
  } else {
    cvOptimal = 7.5;
    cvScaleMax = 24.0;
    if (input.sex === 'male') {
      cvLow = 7.0;
      cvMedian = 11.5;
      cvHigh = 16.5;
    } else {
      cvLow = 4.8;
      cvMedian = 8.2;
      cvHigh = 12.5;
    }
  }

  // Apply guarded_auto European population calibration multiplier
  cvLow = Number((cvLow * params.euPopCvdMedianMultiplier).toFixed(1));
  cvMedian = Number((cvMedian * params.euPopCvdMedianMultiplier).toFixed(1));
  cvHigh = Number((cvHigh * params.euPopCvdMedianMultiplier).toFixed(1));

  const normCv = (val: number) => Math.min(100, Math.max(2, Math.round((val / cvScaleMax) * 100)));
  const cvStatus: PathologyPopulationComparison['statusLabel'] =
    cvdTenYearPct < cvMedian
      ? 'Sotto la media UE'
      : cvdTenYearPct <= cvHigh
        ? 'Nel range UE'
        : 'Sopra il range UE';

  // 2. Metabolic / Type 2 Diabetes — FINDRISC European General Population (IDF / DE-PLAN)
  let dmLow: number;
  let dmMedian: number;
  let dmHigh: number;
  const dmOptimal = 6;
  const dmScaleMax = 22;

  if (input.age < 45) {
    dmLow = 3;
    dmMedian = 6;
    dmHigh = 10;
  } else if (input.age < 55) {
    dmLow = 5;
    dmMedian = 9;
    dmHigh = 13;
  } else if (input.age < 65) {
    dmLow = 7;
    dmMedian = 11;
    dmHigh = 15;
  } else {
    dmLow = 8;
    dmMedian = 12;
    dmHigh = 16;
  }

  const normDm = (val: number) => Math.min(100, Math.max(2, Math.round((val / dmScaleMax) * 100)));
  const dmStatus: PathologyPopulationComparison['statusLabel'] =
    findriscPoints < dmMedian
      ? 'Sotto la media UE'
      : findriscPoints <= dmHigh
        ? 'Nel range UE'
        : 'Sopra il range UE';

  // 3. Preventive Oncology — WCRF/AICR & Fondazione AIRC (EPIC European Cohort)
  let oncoLow: number;
  let oncoMedian: number;
  let oncoHigh: number;
  const oncoOptimal = 20;

  if (input.age < 45) {
    oncoLow = 18;
    oncoMedian = 28;
    oncoHigh = 40;
  } else if (input.age < 65) {
    oncoLow = 23;
    oncoMedian = 35;
    oncoHigh = 49;
  } else {
    oncoLow = 30;
    oncoMedian = 42;
    oncoHigh = 56;
  }

  // Apply guarded_auto EPIC/AIRC oncology cohort median offset
  oncoLow = Math.max(10, Math.round(oncoLow + params.euPopOncoMedianOffset));
  oncoMedian = Math.max(15, Math.round(oncoMedian + params.euPopOncoMedianOffset));
  oncoHigh = Math.max(25, Math.round(oncoHigh + params.euPopOncoMedianOffset));

  const oncoStatus: PathologyPopulationComparison['statusLabel'] =
    oncoRiskIndex < oncoMedian
      ? 'Sotto la media UE'
      : oncoRiskIndex <= oncoHigh
        ? 'Nel range UE'
        : 'Sopra il range UE';

  return [
    {
      id: 'cardiovascular',
      pathology: 'Malattie Cardiovascolari (10 anni)',
      shortLabel: 'Cardiovascolare',
      protocol: 'ESC SCORE2 · Popolazione UE',
      userRawValue: `${cvdTenYearPct.toFixed(1)}%`,
      populationMedianRaw: `${cvMedian.toFixed(1)}%`,
      populationRangeRaw: `${cvLow.toFixed(1)}% – ${cvHigh.toFixed(1)}%`,
      optimalTargetRaw: `< ${cvOptimal.toFixed(1)}%`,
      userNormalized: normCv(cvdTenYearPct),
      populationLowNormalized: normCv(cvLow),
      populationMedianNormalized: normCv(cvMedian),
      populationHighNormalized: normCv(cvHigh),
      optimalThresholdNormalized: normCv(cvOptimal),
      statusLabel: cvStatus,
    },
    {
      id: 'metabolic',
      pathology: 'Diabete Tipo 2 & Metabolismo',
      shortLabel: 'Diabete Tipo 2',
      protocol: 'FINDRISC · Coorte Europea IDF',
      userRawValue: `${findriscPoints} / 26 pt`,
      populationMedianRaw: `${dmMedian} pt`,
      populationRangeRaw: `${dmLow} – ${dmHigh} pt`,
      optimalTargetRaw: `< 7 pt`,
      userNormalized: normDm(findriscPoints),
      populationLowNormalized: normDm(dmLow),
      populationMedianNormalized: normDm(dmMedian),
      populationHighNormalized: normDm(dmHigh),
      optimalThresholdNormalized: normDm(dmOptimal),
      statusLabel: dmStatus,
    },
    {
      id: 'oncologic',
      pathology: 'Esposizione Oncologica Preventiva',
      shortLabel: 'Oncologia',
      protocol: 'WCRF/AICR · AIRC / EPIC UE',
      userRawValue: `${oncoRiskIndex} / 100`,
      populationMedianRaw: `${oncoMedian} / 100`,
      populationRangeRaw: `${oncoLow} – ${oncoHigh} / 100`,
      optimalTargetRaw: `≤ ${oncoOptimal} / 100`,
      userNormalized: Math.min(100, Math.max(2, oncoRiskIndex)),
      populationLowNormalized: oncoLow,
      populationMedianNormalized: oncoMedian,
      populationHighNormalized: oncoHigh,
      optimalThresholdNormalized: oncoOptimal,
      statusLabel: oncoStatus,
    },
  ];
}
