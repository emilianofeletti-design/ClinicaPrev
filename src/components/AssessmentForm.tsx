import {
  Activity,
  AlertCircle,
  ArrowRight,
  FileUp,
  Footprints,
  Info,
  Leaf,
  RotateCcw,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  ActivityType,
  BiologicalSex,
  ClinicalProfileDraft,
  FamilyHistoryLevel,
  SmokingStatus,
  UltraProcessedIntake,
  UvProtectionLevel,
  ValidationErrors,
} from '../types/clinical';
import {
  ACTIVITY_TYPE_LABELS,
  calculateBmi,
  classifyBmi,
  computeEffectiveActivityMetrics,
  EMPTY_CLINICAL_DRAFT,
} from '../utils/clinicalRiskEngine';

import type { PersonalAnalysisRecord } from '../utils/personalArchiveFile';

interface AssessmentFormProps {
  draft: ClinicalProfileDraft;
  errors: ValidationErrors;
  submitAttemptCount: number;
  importedTimeline: PersonalAnalysisRecord[];
  importError: string | null;
  onImportArchiveFile: (file: File) => void;
  onChange: (next: ClinicalProfileDraft) => void;
  onResetEmpty: () => void;
  onSubmit: () => void;
  onOpenLegal: () => void;
}

const FIELD_ORDER: Array<keyof ClinicalProfileDraft> = [
  'age',
  'sex',
  'heightCm',
  'weightKg',
  'waistCm',
  'systolicBp',
  'totalCholesterolMgDl',
  'hdlCholesterolMgDl',
  'fruitVegServingsPerDay',
  'redProcessedMeatServingsPerWeek',
  'ultraProcessedIntake',
  'alcoholUnitsPerWeek',
  'smokingStatus',
  'packYears',
  'workoutsPerWeek',
  'minutesPerWorkout',
  'activityType',
  'dailySteps',
  'sedentaryHoursPerDay',
  'sleepHoursPerNight',
  'uvProtection',
  'familyHistoryDiabetes',
];

function fieldInputClass(hasError: boolean, extra = ''): string {
  const base =
    'w-full px-3 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2';
  const state = hasError
    ? 'bg-rose-50/60 border-rose-500 ring-1 ring-rose-200 text-slate-900 focus:ring-rose-500/25 focus:border-rose-600'
    : 'bg-white border-stone-300 text-slate-900 focus:ring-[#0D6E6E]/20 focus:border-[#0D6E6E]';
  return `${base} ${state} ${extra}`.trim();
}

function fieldLabelClass(hasError: boolean): string {
  return `block text-xs font-medium mb-1.5 ${hasError ? 'text-rose-800 font-semibold' : 'text-slate-700'}`;
}

export function AssessmentForm({
  draft,
  errors,
  submitAttemptCount,
  importedTimeline,
  importError,
  onImportArchiveFile,
  onChange,
  onResetEmpty,
  onSubmit,
  onOpenLegal,
}: AssessmentFormProps) {
  const errorAlertRef = useRef<HTMLDivElement | null>(null);
  const archiveInputRef = useRef<HTMLInputElement | null>(null);
  const [lipidsUnknown, setLipidsUnknown] = useState(false);

  const liveBmi = useMemo(() => {
    if (draft.heightCm === null || draft.weightKg === null) return 0;
    return calculateBmi(draft.heightCm, draft.weightKg);
  }, [draft.heightCm, draft.weightKg]);

  const bmiLabel = useMemo(() => (liveBmi > 0 ? classifyBmi(liveBmi) : null), [liveBmi]);

  const hasActivityInput =
    draft.workoutsPerWeek !== null || draft.dailySteps !== null;

  const liveActivity = useMemo(() => computeEffectiveActivityMetrics(draft), [draft]);

  const errorKeys = Object.keys(errors);
  const hasErrors = errorKeys.length > 0;

  useEffect(() => {
    if (draft.totalCholesterolMgDl !== null || draft.hdlCholesterolMgDl !== null) {
      setLipidsUnknown(false);
    }
  }, [draft.totalCholesterolMgDl, draft.hdlCholesterolMgDl]);

  useEffect(() => {
    if (submitAttemptCount > 0 && hasErrors) {
      const firstErrorKey = FIELD_ORDER.find((key) => Boolean(errors[key])) ?? errorKeys[0];
      const firstEl = firstErrorKey ? document.getElementById(firstErrorKey) : null;
      if (errorKeys.length >= 4 || firstErrorKey === 'age') {
        errorAlertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (firstEl) {
        firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        errorAlertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (firstEl && 'focus' in firstEl) {
        (firstEl as HTMLElement).focus({ preventScroll: true });
      }
    }
  }, [submitAttemptCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateField = <K extends keyof ClinicalProfileDraft>(
    key: K,
    value: ClinicalProfileDraft[K]
  ) => {
    onChange({ ...draft, [key]: value });
  };

  const handleNumberInput = (key: keyof ClinicalProfileDraft, raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === '') {
      updateField(key, null as never);
      return;
    }
    const parsed = Number(trimmed);
    updateField(key, (Number.isFinite(parsed) ? parsed : null) as never);
  };

  const handleOptionalLipid = (
    key: 'totalCholesterolMgDl' | 'hdlCholesterolMgDl',
    raw: string
  ) => {
    const trimmed = raw.trim();
    if (trimmed === '') {
      updateField(key, null);
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed === 0) {
      updateField(key, null);
      return;
    }
    updateField(key, parsed);
  };

  const handleOptionalSteps = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === '') {
      updateField('dailySteps', null);
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed === 0) {
      updateField('dailySteps', null);
      return;
    }
    updateField('dailySteps', Math.round(parsed));
  };

  const handleToggleUnknownLipids = (checked: boolean) => {
    setLipidsUnknown(checked);
    if (checked) {
      onChange({
        ...draft,
        totalCholesterolMgDl: null,
        hdlCholesterolMgDl: null,
      });
    }
  };

  const isPackYearsRequired =
    draft.smokingStatus === 'former' ||
    draft.smokingStatus === 'current_light' ||
    draft.smokingStatus === 'current_heavy';

  const isWorkoutDetailsRequired =
    draft.workoutsPerWeek !== null && draft.workoutsPerWeek > 0;

  return (
    <div className="space-y-8">
      {/* Warm Editorial Hero with Illustration */}
      <section className="bg-gradient-to-br from-[#FFFDF8] via-white to-[#F0FDFA] border border-teal-100/90 rounded-2xl p-6 sm:p-8 shadow-[0_2px_16px_rgba(13,110,110,0.05)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <p className="text-xs font-semibold tracking-wide text-[#0D6E6E]">
              ESC SCORE2 · FINDRISC (IDF/OMS) · WCRF/AICR · Fondazione AIRC &amp; IARC
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
              Prenditi cura del tuo benessere, un dato alla volta
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-xl">
              Raccontaci le tue abitudini quotidiane, l’alimentazione e qualche parametro di base:
              in un attimo stimiamo il tuo profilo preventivo cardiovascolare, metabolico e
              oncologico usando solo protocolli scientifici riconosciuti.
            </p>

            {/* Friendly Non-Invasive Legal Notice Strip */}
            <aside
              aria-label="Avviso clinico-legale"
              className="flex items-start gap-3 bg-amber-50/70 border border-amber-200/80 rounded-xl p-4"
            >
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed space-y-1">
                <p>
                  <strong className="font-semibold text-slate-900">
                    Nota medico-legale e privacy (Reg. UE 2017/745):
                  </strong>{' '}
                  strumento puramente informativo e divulgativo basato su studi di popolazione. Non
                  è una diagnosi, non sostituisce il medico e{' '}
                  <strong>non salviamo alcun dato personale sul sito</strong>.
                </p>
                <button
                  type="button"
                  onClick={onOpenLegal}
                  className="font-semibold text-[#0D6E6E] hover:underline cursor-pointer"
                >
                  Leggi il disclaimer completo e la metodologia →
                </button>
              </div>
            </aside>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl overflow-hidden border border-teal-100 bg-[#FFFBF5] shadow-xs">
              <img
                src="/src/assets/images/preventive_health_illustration_1795178666156.jpg"
                alt="Illustrazione di prevenzione e stile di vita sano all’aria aperta"
                className="w-full h-auto aspect-[4/3] object-cover block"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Personal File Import & Reset Strip */}
      <section
        aria-label="Caricamento file personale o reset campi"
        className="bg-white/90 border border-stone-200/90 rounded-xl px-5 py-4 space-y-3"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Hai già un tuo file analisi precedente?
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Compila i campi qui sotto oppure ricarica un tuo file precedente (.json) per
              aggiornare le abitudini cambiate e vedere i progressi nel tempo. I campi con{' '}
              <span className="text-rose-600 font-semibold">*</span> sono obbligatori.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => archiveInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0D6E6E] bg-teal-50/70 border border-teal-200 rounded-lg hover:bg-teal-100/70 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileUp className="w-3.5 h-3.5" />
              Carica file (.json)
            </button>
            <input
              ref={archiveInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              aria-label="Carica file analisi precedente ClinicaPrev"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImportArchiveFile(file);
                  e.target.value = '';
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                setLipidsUnknown(false);
                onResetEmpty();
              }}
              aria-label="Svuota tutti i campi"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-stone-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Svuota campi
            </button>
          </div>
        </div>

        {importError && (
          <div
            role="alert"
            className="rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-900"
          >
            {importError}
          </div>
        )}

        {importedTimeline.length > 0 && (
          <div className="rounded-lg bg-emerald-50/80 border border-emerald-200 px-3.5 py-2.5 text-xs text-emerald-950">
            <strong>File personale caricato ({importedTimeline.length}{' '}
            {importedTimeline.length === 1 ? 'rilevazione precedente' : 'rilevazioni precedenti'}):</strong>{' '}
            i campi sotto sono stati precompilati con l’ultima analisi del{' '}
            <span className="font-mono">
              {new Date(
                importedTimeline[importedTimeline.length - 1].recordedAtIso
              ).toLocaleDateString('it-IT')}
            </span>
            . Aggiorna ciò che è cambiato (es. stop fumo, più sport, peso) e clicca{' '}
            <strong>Calcola Profilo di Rischio</strong> per confrontare l’evoluzione nel tempo.
          </div>
        )}
      </section>

      {/* Main Clinical Assessment Form */}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-8"
      >
        {hasErrors && (
          <div
            ref={errorAlertRef}
            role="alert"
            className="scroll-mt-20 bg-rose-50 border border-rose-300 rounded-lg p-4 sm:p-5 text-sm text-rose-950"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="font-semibold">
                  {errorKeys.length === 1
                    ? 'Manca 1 campo obbligatorio o contiene un valore non valido.'
                    : `Mancano o vanno verificati ${errorKeys.length} campi obbligatori evidenziati in rosso.`}
                </p>
                <p className="text-xs text-rose-800">
                  Completa i campi evidenziati qui sotto per avviare il calcolo. Colesterolo totale,
                  colesterolo HDL e passi medi giornalieri restano opzionali.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Biometrics & Clinical Lab */}
          <div className="lg:col-span-6 space-y-8">
            <fieldset className="bg-white border border-stone-200/90 rounded-xl p-6 space-y-5 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
              <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-3.5">
                <legend className="flex items-center gap-2.5 text-base font-semibold text-slate-900">
                  <span
                    aria-hidden="true"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 text-sky-700 shrink-0"
                  >
                    <Activity className="w-4 h-4" />
                  </span>
                  <span>01. Parametri Biometrici e Clinici</span>
                </legend>
                <span className="text-xs font-mono tabular-nums font-medium text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md">
                  BMI {liveBmi > 0 ? `${liveBmi.toFixed(1)} kg/m²` : '—'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="age" className={fieldLabelClass(Boolean(errors.age))}>
                    Età (anni)
                    <span className="text-rose-600 ml-0.5" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="age"
                    type="number"
                    placeholder="Es. 45"
                    value={draft.age ?? ''}
                    onChange={(e) => handleNumberInput('age', e.target.value)}
                    aria-required="true"
                    aria-invalid={Boolean(errors.age)}
                    className={fieldInputClass(Boolean(errors.age), 'font-mono tabular-nums')}
                  />
                  {errors.age && (
                    <p className="mt-1 text-xs font-medium text-rose-700">{errors.age}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="sex" className={fieldLabelClass(Boolean(errors.sex))}>
                    Sesso biologico (SCORE2 / FINDRISC)
                    <span className="text-rose-600 ml-0.5" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <select
                    id="sex"
                    value={draft.sex}
                    onChange={(e) => updateField('sex', e.target.value as BiologicalSex | '')}
                    aria-required="true"
                    aria-invalid={Boolean(errors.sex)}
                    className={fieldInputClass(
                      Boolean(errors.sex),
                      draft.sex === '' ? 'text-slate-500' : ''
                    )}
                  >
                    <option value="">Seleziona...</option>
                    <option value="male">Maschile</option>
                    <option value="female">Femminile</option>
                  </select>
                  {errors.sex && (
                    <p className="mt-1 text-xs font-medium text-rose-700">{errors.sex}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="heightCm" className={fieldLabelClass(Boolean(errors.heightCm))}>
                    Altezza (cm)
                    <span className="text-rose-600 ml-0.5" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="heightCm"
                    type="number"
                    placeholder="Es. 175"
                    value={draft.heightCm ?? ''}
                    onChange={(e) => handleNumberInput('heightCm', e.target.value)}
                    aria-required="true"
                    aria-invalid={Boolean(errors.heightCm)}
                    className={fieldInputClass(Boolean(errors.heightCm), 'font-mono tabular-nums')}
                  />
                  {errors.heightCm && (
                    <p className="mt-1 text-xs font-medium text-rose-700">{errors.heightCm}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="weightKg" className={fieldLabelClass(Boolean(errors.weightKg))}>
                    Peso corporeo (kg)
                    <span className="text-rose-600 ml-0.5" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="weightKg"
                    type="number"
                    step="0.5"
                    placeholder="Es. 75"
                    value={draft.weightKg ?? ''}
                    onChange={(e) => handleNumberInput('weightKg', e.target.value)}
                    aria-required="true"
                    aria-invalid={Boolean(errors.weightKg)}
                    className={fieldInputClass(Boolean(errors.weightKg), 'font-mono tabular-nums')}
                  />
                  {errors.weightKg && (
                    <p className="mt-1 text-xs font-medium text-rose-700">{errors.weightKg}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="waistCm" className={fieldLabelClass(Boolean(errors.waistCm))}>
                    Circonferenza vita (cm)
                    <span className="text-rose-600 ml-0.5" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="waistCm"
                    type="number"
                    placeholder="Es. 88"
                    value={draft.waistCm ?? ''}
                    onChange={(e) => handleNumberInput('waistCm', e.target.value)}
                    aria-required="true"
                    aria-invalid={Boolean(errors.waistCm)}
                    className={fieldInputClass(Boolean(errors.waistCm), 'font-mono tabular-nums')}
                  />
                  {errors.waistCm ? (
                    <p className="mt-1 text-xs font-medium text-rose-700">{errors.waistCm}</p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">
                      {draft.sex
                        ? `Soglia IDF: <${draft.sex === 'male' ? '94' : '80'} cm`
                        : 'Soglia IDF: <94 cm (M) · <80 cm (F)'}
                      {bmiLabel ? ` · ${bmiLabel}` : ''}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="systolicBp"
                    className={fieldLabelClass(Boolean(errors.systolicBp))}
                  >
                    Pressione sistolica / massima (mmHg)
                    <span className="text-rose-600 ml-0.5" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="systolicBp"
                    type="number"
                    placeholder="Es. 120"
                    value={draft.systolicBp ?? ''}
                    onChange={(e) => handleNumberInput('systolicBp', e.target.value)}
                    aria-required="true"
                    aria-invalid={Boolean(errors.systolicBp)}
                    className={fieldInputClass(
                      Boolean(errors.systolicBp),
                      'font-mono tabular-nums'
                    )}
                  />
                  {errors.systolicBp ? (
                    <p className="mt-1 text-xs font-medium text-rose-700">{errors.systolicBp}</p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">Ottimale ESC: &lt;120 mmHg</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="totalCholesterolMgDl"
                    className={fieldLabelClass(Boolean(errors.totalCholesterolMgDl))}
                  >
                    Colesterolo totale (mg/dL, opzionale)
                  </label>
                  <input
                    id="totalCholesterolMgDl"
                    type="number"
                    placeholder="Vuoto = mediana UE"
                    disabled={lipidsUnknown}
                    value={draft.totalCholesterolMgDl ?? ''}
                    onChange={(e) => handleOptionalLipid('totalCholesterolMgDl', e.target.value)}
                    aria-invalid={Boolean(errors.totalCholesterolMgDl)}
                    className={fieldInputClass(
                      Boolean(errors.totalCholesterolMgDl),
                      'font-mono tabular-nums disabled:bg-slate-50 disabled:text-slate-400'
                    )}
                  />
                  {errors.totalCholesterolMgDl && (
                    <p className="mt-1 text-xs font-medium text-rose-700">
                      {errors.totalCholesterolMgDl}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="hdlCholesterolMgDl"
                    className={fieldLabelClass(Boolean(errors.hdlCholesterolMgDl))}
                  >
                    Colesterolo HDL (mg/dL, opzionale)
                  </label>
                  <input
                    id="hdlCholesterolMgDl"
                    type="number"
                    placeholder="Vuoto = mediana UE"
                    disabled={lipidsUnknown}
                    value={draft.hdlCholesterolMgDl ?? ''}
                    onChange={(e) => handleOptionalLipid('hdlCholesterolMgDl', e.target.value)}
                    aria-invalid={Boolean(errors.hdlCholesterolMgDl)}
                    className={fieldInputClass(
                      Boolean(errors.hdlCholesterolMgDl),
                      'font-mono tabular-nums disabled:bg-slate-50 disabled:text-slate-400'
                    )}
                  />
                  {errors.hdlCholesterolMgDl && (
                    <p className="mt-1 text-xs font-medium text-rose-700">
                      {errors.hdlCholesterolMgDl}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lipidsUnknown}
                      onChange={(e) => handleToggleUnknownLipids(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0D6E6E] focus:ring-[#0D6E6E] accent-[#0D6E6E]"
                    />
                    <span className="text-xs text-slate-600">
                      Non conosco i miei valori di colesterolo (il calcolo procederà usando le
                      mediane epidemiologiche europee)
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.onHypertensionMeds}
                    onChange={(e) => updateField('onHypertensionMeds', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0D6E6E] focus:ring-[#0D6E6E] accent-[#0D6E6E]"
                  />
                  <span className="text-sm text-slate-700">
                    Assumo regolarmente farmaci per la pressione arteriosa (antipertensivi)
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.priorHighBloodGlucose}
                    onChange={(e) => updateField('priorHighBloodGlucose', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0D6E6E] focus:ring-[#0D6E6E] accent-[#0D6E6E]"
                  />
                  <span className="text-sm text-slate-700">
                    Riscontro pregresso di glicemia elevata, prediabete o diabete gestazionale
                  </span>
                </label>
              </div>
            </fieldset>

            {/* Section 4: Family History */}
            <fieldset className="bg-white border border-stone-200/90 rounded-xl p-6 space-y-5 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
              <div className="border-b border-stone-100 pb-3.5">
                <legend className="flex items-center gap-2.5 text-base font-semibold text-slate-900">
                  <span
                    aria-hidden="true"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 shrink-0"
                  >
                    <Users className="w-4 h-4" />
                  </span>
                  <span>04. Anamnesi Familiare e Predisposizione</span>
                </legend>
              </div>

              <div>
                <label
                  htmlFor="familyHistoryDiabetes"
                  className={fieldLabelClass(Boolean(errors.familyHistoryDiabetes))}
                >
                  Familiarità per Diabete di Tipo 1 o Tipo 2 (criterio FINDRISC)
                  <span className="text-rose-600 ml-0.5" aria-hidden="true">
                    *
                  </span>
                </label>
                <select
                  id="familyHistoryDiabetes"
                  value={draft.familyHistoryDiabetes}
                  onChange={(e) =>
                    updateField(
                      'familyHistoryDiabetes',
                      e.target.value as FamilyHistoryLevel | ''
                    )
                  }
                  aria-required="true"
                  aria-invalid={Boolean(errors.familyHistoryDiabetes)}
                  className={fieldInputClass(
                    Boolean(errors.familyHistoryDiabetes),
                    draft.familyHistoryDiabetes === '' ? 'text-slate-500' : ''
                  )}
                >
                  <option value="">Seleziona...</option>
                  <option value="none">Nessuna familiarità nota</option>
                  <option value="second_degree">
                    Parenti di 2° grado (nonni, zii, cugini di primo grado)
                  </option>
                  <option value="first_degree">
                    Parenti di 1° grado (genitori, fratelli, sorelle o figli)
                  </option>
                </select>
                {errors.familyHistoryDiabetes && (
                  <p className="mt-1 text-xs font-medium text-rose-700">
                    {errors.familyHistoryDiabetes}
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-1">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.familyHistoryCvdEarly}
                    onChange={(e) => updateField('familyHistoryCvdEarly', e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0D6E6E] focus:ring-[#0D6E6E] accent-[#0D6E6E]"
                  />
                  <span className="text-sm text-slate-700">
                    Familiarità cardiovascolare precoce (infarto o ictus in parente di 1° grado
                    &lt;55 anni uomo / &lt;65 anni donna)
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.familyHistoryCancerFirstDegree}
                    onChange={(e) =>
                      updateField('familyHistoryCancerFirstDegree', e.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0D6E6E] focus:ring-[#0D6E6E] accent-[#0D6E6E]"
                  />
                  <span className="text-sm text-slate-700">
                    Familiarità oncologica di 1° grado (tumore maligno in genitori, fratelli o
                    figli)
                  </span>
                </label>
              </div>
            </fieldset>
          </div>

          {/* Right Column: Diet & Lifestyle */}
          <div className="lg:col-span-6 space-y-8">
            <fieldset className="bg-white border border-stone-200/90 rounded-xl p-6 space-y-5 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
              <div className="border-b border-stone-100 pb-3.5">
                <legend className="flex items-center gap-2.5 text-base font-semibold text-slate-900">
                  <span
                    aria-hidden="true"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 shrink-0"
                  >
                    <Leaf className="w-4 h-4" />
                  </span>
                  <span>02. Abitudini Alimentari (Dieta Mediterranea)</span>
                </legend>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div>
                  <label
                    htmlFor="fruitVegServingsPerDay"
                    className={fieldLabelClass(Boolean(errors.fruitVegServingsPerDay))}
                  >
                    Frutta, verdura e legumi (porzioni/giorno)
                    <span className="text-rose-600 ml-0.5" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="fruitVegServingsPerDay"
                    type="number"
                    placeholder="Es. 3"
                    value={draft.fruitVegServingsPerDay ?? ''}
                    onChange={(e) => handleNumberInput('fruitVegServingsPerDay', e.target.value)}
                    aria-required="true"
                    aria-invalid={Boolean(errors.fruitVegServingsPerDay)}
                    className={fieldInputClass(
                      Boolean(errors.fruitVegServingsPerDay),
                      'font-mono tabular-nums'
                    )}
                  />
                  {errors.fruitVegServingsPerDay ? (
                    <p className="mt-1 text-xs font-medium text-rose-700">
                      {errors.fruitVegServingsPerDay}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">Target OMS/WCRF: ≥5 porzioni/die</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="redProcessedMeatServingsPerWeek"
                    className={fieldLabelClass(Boolean(errors.redProcessedMeatServingsPerWeek))}
                  >
                    Carni rosse e insaccati (porzioni/sett.)
                    <span className="text-rose-600 ml-0.5" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="redProcessedMeatServingsPerWeek"
                    type="number"
                    placeholder="Es. 2"
                    value={draft.redProcessedMeatServingsPerWeek ?? ''}
                    onChange={(e) =>
                      handleNumberInput('redProcessedMeatServingsPerWeek', e.target.value)
                    }
                    aria-required="true"
                    aria-invalid={Boolean(errors.redProcessedMeatServingsPerWeek)}
                    className={fieldInputClass(
                      Boolean(errors.redProcessedMeatServingsPerWeek),
                      'font-mono tabular-nums'
                    )}
                  />
                  {errors.redProcessedMeatServingsPerWeek ? (
                    <p className="mt-1 text-xs font-medium text-rose-700">
                      {errors.redProcessedMeatServingsPerWeek}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">Limite WCRF/AIRC: ≤3 porzioni/sett.</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="ultraProcessedIntake"
                    className={fieldLabelClass(Boolean(errors.ultraProcessedIntake))}
                  >
                    Alimenti ultra-processati (UPF)
                    <span className="text-rose-600 ml-0.5" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <select
                    id="ultraProcessedIntake"
                    value={draft.ultraProcessedIntake}
                    onChange={(e) =>
                      updateField(
                        'ultraProcessedIntake',
                        e.target.value as UltraProcessedIntake | ''
                      )
                    }
                    aria-required="true"
                    aria-invalid={Boolean(errors.ultraProcessedIntake)}
                    className={fieldInputClass(
                      Boolean(errors.ultraProcessedIntake),
                      draft.ultraProcessedIntake === '' ? 'text-slate-500' : ''
                    )}
                  >
                    <option value="">Seleziona...</option>
                    <option value="rare">Raro (&lt;2 volte/settimana)</option>
                    <option value="moderate">Moderato (3–5 volte/sett.)</option>
                    <option value="frequent">Frequente (quotidiano)</option>
                  </select>
                  {errors.ultraProcessedIntake && (
                    <p className="mt-1 text-xs font-medium text-rose-700">
                      {errors.ultraProcessedIntake}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="alcoholUnitsPerWeek"
                    className={fieldLabelClass(Boolean(errors.alcoholUnitsPerWeek))}
                  >
                    Alcol (unità alcoliche/settimana)
                    <span className="text-rose-600 ml-0.5" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="alcoholUnitsPerWeek"
                    type="number"
                    placeholder="Es. 0"
                    value={draft.alcoholUnitsPerWeek ?? ''}
                    onChange={(e) => handleNumberInput('alcoholUnitsPerWeek', e.target.value)}
                    aria-required="true"
                    aria-invalid={Boolean(errors.alcoholUnitsPerWeek)}
                    className={fieldInputClass(
                      Boolean(errors.alcoholUnitsPerWeek),
                      'font-mono tabular-nums'
                    )}
                  />
                  {errors.alcoholUnitsPerWeek ? (
                    <p className="mt-1 text-xs font-medium text-rose-700">
                      {errors.alcoholUnitsPerWeek}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">
                      1 unità ≈ 125 ml vino o 330 ml birra
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Section 3: Lifestyle */}
            <fieldset className="bg-white border border-stone-200/90 rounded-xl p-6 space-y-5 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
              <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-3.5">
                <legend className="flex items-center gap-2.5 text-base font-semibold text-slate-900">
                  <span
                    aria-hidden="true"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-700 shrink-0"
                  >
                    <Footprints className="w-4 h-4" />
                  </span>
                  <span>03. Stile di Vita, Fumo e Attività Fisica</span>
                </legend>
                <span className="text-xs font-mono tabular-nums font-medium text-orange-800 bg-orange-50 px-2.5 py-1 rounded-md whitespace-nowrap">
                  {hasActivityInput
                    ? `${liveActivity.whoEquivalentMinutes} min eq. OMS/sett`
                    : '— min eq. OMS/sett'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <div>
                  <label
                    htmlFor="smokingStatus"
                    className={fieldLabelClass(Boolean(errors.smokingStatus))}
                  >
                    Abitudine al fumo di tabacco
                    <span className="text-rose-600 ml-0.5" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <select
                    id="smokingStatus"
                    value={draft.smokingStatus}
                    onChange={(e) => {
                      const nextStatus = e.target.value as SmokingStatus | '';
                      onChange({
                        ...draft,
                        smokingStatus: nextStatus,
                        packYears:
                          nextStatus === 'never' || nextStatus === '' ? null : draft.packYears,
                      });
                    }}
                    aria-required="true"
                    aria-invalid={Boolean(errors.smokingStatus)}
                    className={fieldInputClass(
                      Boolean(errors.smokingStatus),
                      draft.smokingStatus === '' ? 'text-slate-500' : ''
                    )}
                  >
                    <option value="">Seleziona...</option>
                    <option value="never">Mai fumato</option>
                    <option value="former">Ex-fumatore</option>
                    <option value="current_light">Fumatore attivo (&lt;10 sig./giorno)</option>
                    <option value="current_heavy">Fumatore attivo (≥10 sig./giorno)</option>
                  </select>
                  {errors.smokingStatus && (
                    <p className="mt-1 text-xs font-medium text-rose-700">
                      {errors.smokingStatus}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="packYears"
                    className={fieldLabelClass(Boolean(errors.packYears))}
                  >
                    Esposizione cumulativa (pacchetti-anno)
                    {isPackYearsRequired && (
                      <span className="text-rose-600 ml-0.5" aria-hidden="true">
                        *
                      </span>
                    )}
                  </label>
                  <input
                    id="packYears"
                    type="number"
                    placeholder={isPackYearsRequired ? 'Es. 8' : 'Solo fumatori / ex'}
                    disabled={!isPackYearsRequired}
                    value={isPackYearsRequired ? (draft.packYears ?? '') : ''}
                    onChange={(e) => handleNumberInput('packYears', e.target.value)}
                    aria-required={isPackYearsRequired}
                    aria-invalid={Boolean(errors.packYears)}
                    className={fieldInputClass(
                      Boolean(errors.packYears),
                      'font-mono tabular-nums disabled:bg-slate-50 disabled:text-slate-400'
                    )}
                  />
                  {errors.packYears ? (
                    <p className="mt-1 text-xs font-medium text-rose-700">{errors.packYears}</p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">(Pacchetti/die × anni di fumo)</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="workoutsPerWeek"
                    className={fieldLabelClass(Boolean(errors.workoutsPerWeek))}
                  >
                    Allenamenti a settimana (n°)
                    <span className="text-rose-600 ml-0.5" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="workoutsPerWeek"
                    type="number"
                    placeholder="Es. 3 (0 se nessuno)"
                    value={draft.workoutsPerWeek ?? ''}
                    onChange={(e) => {
                      const trimmed = e.target.value.trim();
                      if (trimmed === '') {
                        updateField('workoutsPerWeek', null);
                        return;
                      }
                      const nextW = Number(trimmed);
                      if (!Number.isFinite(nextW)) {
                        updateField('workoutsPerWeek', null);
                        return;
                      }
                      onChange({
                        ...draft,
                        workoutsPerWeek: nextW,
                        minutesPerWorkout: nextW === 0 ? null : draft.minutesPerWorkout,
                      });
                    }}
                    aria-required="true"
                    aria-invalid={Boolean(errors.workoutsPerWeek)}
                    className={fieldInputClass(
                      Boolean(errors.workoutsPerWeek),
                      'font-mono tabular-nums'
                    )}
                  />
                  {errors.workoutsPerWeek && (
                    <p className="mt-1 text-xs font-medium text-rose-700">
                      {errors.workoutsPerWeek}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="minutesPerWorkout"
                    className={fieldLabelClass(Boolean(errors.minutesPerWorkout))}
                  >
                    Durata singolo allenamento (min)
                    {isWorkoutDetailsRequired && (
                      <span className="text-rose-600 ml-0.5" aria-hidden="true">
                        *
                      </span>
                    )}
                  </label>
                  <input
                    id="minutesPerWorkout"
                    type="number"
                    step={5}
                    placeholder={draft.workoutsPerWeek === 0 ? 'Nessun allenamento' : 'Es. 45'}
                    disabled={draft.workoutsPerWeek === 0}
                    value={draft.workoutsPerWeek === 0 ? '' : (draft.minutesPerWorkout ?? '')}
                    onChange={(e) => handleNumberInput('minutesPerWorkout', e.target.value)}
                    aria-required={isWorkoutDetailsRequired}
                    aria-invalid={Boolean(errors.minutesPerWorkout)}
                    className={fieldInputClass(
                      Boolean(errors.minutesPerWorkout),
                      'font-mono tabular-nums disabled:bg-slate-50 disabled:text-slate-400'
                    )}
                  />
                  {errors.minutesPerWorkout ? (
                    <p className="mt-1 text-xs font-medium text-rose-700">
                      {errors.minutesPerWorkout}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">
                      {hasActivityInput
                        ? `Totale: ${liveActivity.rawWorkoutMinutes} min/sett · Target OMS ≥150 eq.`
                        : 'Target OMS: ≥150 min equivalenti/sett.'}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="activityType"
                    className={fieldLabelClass(Boolean(errors.activityType))}
                  >
                    Tipologia prevalente di attività fisica
                    {isWorkoutDetailsRequired && (
                      <span className="text-rose-600 ml-0.5" aria-hidden="true">
                        *
                      </span>
                    )}
                  </label>
                  <select
                    id="activityType"
                    value={draft.activityType}
                    onChange={(e) =>
                      updateField('activityType', e.target.value as ActivityType | '')
                    }
                    aria-required={isWorkoutDetailsRequired}
                    aria-invalid={Boolean(errors.activityType)}
                    className={fieldInputClass(
                      Boolean(errors.activityType),
                      draft.activityType === '' ? 'text-slate-500' : ''
                    )}
                  >
                    <option value="">Seleziona tipologia...</option>
                    {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((key) => (
                      <option key={key} value={key}>
                        {ACTIVITY_TYPE_LABELS[key]}
                      </option>
                    ))}
                  </select>
                  {errors.activityType ? (
                    <p className="mt-1 text-xs font-medium text-rose-700">{errors.activityType}</p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">
                      Evidenza OMS / BJSM 2022: l’attività combinata (aerobico + forza) offre la
                      massima riduzione di mortalità cardiovascolare, metabolica e oncologica.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="dailySteps"
                    className={fieldLabelClass(Boolean(errors.dailySteps))}
                  >
                    Passi medi giornalieri (opzionale)
                  </label>
                  <input
                    id="dailySteps"
                    type="number"
                    step={500}
                    placeholder="Es. 7500 (opzionale)"
                    value={draft.dailySteps ?? ''}
                    onChange={(e) => handleOptionalSteps(e.target.value)}
                    aria-invalid={Boolean(errors.dailySteps)}
                    className={fieldInputClass(
                      Boolean(errors.dailySteps),
                      'font-mono tabular-nums'
                    )}
                  />
                  {errors.dailySteps ? (
                    <p className="mt-1 text-xs font-medium text-rose-700">{errors.dailySteps}</p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">
                      Target EJPC 2023 / Lancet: ≥7.500–8.000 passi/die
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="sedentaryHoursPerDay"
                    className={fieldLabelClass(Boolean(errors.sedentaryHoursPerDay))}
                  >
                    Sedentarietà media (ore seduti/giorno)
                    <span className="text-rose-600 ml-0.5" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="sedentaryHoursPerDay"
                    type="number"
                    placeholder="Es. 7"
                    value={draft.sedentaryHoursPerDay ?? ''}
                    onChange={(e) => handleNumberInput('sedentaryHoursPerDay', e.target.value)}
                    aria-required="true"
                    aria-invalid={Boolean(errors.sedentaryHoursPerDay)}
                    className={fieldInputClass(
                      Boolean(errors.sedentaryHoursPerDay),
                      'font-mono tabular-nums'
                    )}
                  />
                  {errors.sedentaryHoursPerDay && (
                    <p className="mt-1 text-xs font-medium text-rose-700">
                      {errors.sedentaryHoursPerDay}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="sleepHoursPerNight"
                    className={fieldLabelClass(Boolean(errors.sleepHoursPerNight))}
                  >
                    Sonno medio notturno (ore)
                    <span className="text-rose-600 ml-0.5" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    id="sleepHoursPerNight"
                    type="number"
                    step={0.5}
                    placeholder="Es. 7"
                    value={draft.sleepHoursPerNight ?? ''}
                    onChange={(e) => handleNumberInput('sleepHoursPerNight', e.target.value)}
                    aria-required="true"
                    aria-invalid={Boolean(errors.sleepHoursPerNight)}
                    className={fieldInputClass(
                      Boolean(errors.sleepHoursPerNight),
                      'font-mono tabular-nums'
                    )}
                  />
                  {errors.sleepHoursPerNight && (
                    <p className="mt-1 text-xs font-medium text-rose-700">
                      {errors.sleepHoursPerNight}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="uvProtection"
                    className={fieldLabelClass(Boolean(errors.uvProtection))}
                  >
                    Protezione solare UV (IARC / AIRC)
                    <span className="text-rose-600 ml-0.5" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <select
                    id="uvProtection"
                    value={draft.uvProtection}
                    onChange={(e) =>
                      updateField('uvProtection', e.target.value as UvProtectionLevel | '')
                    }
                    aria-required="true"
                    aria-invalid={Boolean(errors.uvProtection)}
                    className={fieldInputClass(
                      Boolean(errors.uvProtection),
                      draft.uvProtection === '' ? 'text-slate-500' : ''
                    )}
                  >
                    <option value="">Seleziona...</option>
                    <option value="consistent">Costante (SPF 30–50+ / ombra)</option>
                    <option value="occasional">Occasionale</option>
                    <option value="rare">Rara o esposizioni intense senza protezione</option>
                  </select>
                  {errors.uvProtection && (
                    <p className="mt-1 text-xs font-medium text-rose-700">{errors.uvProtection}</p>
                  )}
                </div>
              </div>
            </fieldset>
          </div>
        </div>

        {/* Submit Action Bar */}
        <div className="bg-gradient-to-r from-white via-white to-[#F0FDFA] border border-teal-100 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_2px_10px_rgba(13,110,110,0.04)]">
          <div className="space-y-1 max-w-xl">
            {hasErrors ? (
              <p className="text-xs font-semibold text-rose-700">
                {errorKeys.length === 1
                  ? 'Completa il campo obbligatorio evidenziato in rosso per procedere al calcolo.'
                  : `Completa i ${errorKeys.length} campi obbligatori evidenziati in rosso per procedere al calcolo.`}
              </p>
            ) : (
              <p className="text-xs text-slate-600">
                I tuoi dati restano solo nel tuo browser: nessun account richiesto e nessuna
                condivisione con terze parti.
              </p>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#0D6E6E] rounded-lg hover:bg-[#0A5656] transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D6E6E]"
          >
            Calcola Profilo di Rischio
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export { EMPTY_CLINICAL_DRAFT };
