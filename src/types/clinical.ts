export type BiologicalSex = 'male' | 'female';

export type SmokingStatus = 'never' | 'former' | 'current_light' | 'current_heavy';

export type FamilyHistoryLevel = 'none' | 'second_degree' | 'first_degree';

export type UltraProcessedIntake = 'rare' | 'moderate' | 'frequent';

export type UvProtectionLevel = 'consistent' | 'occasional' | 'rare';

export type ActivityType =
  | 'combined'
  | 'aerobic_vigorous'
  | 'aerobic_moderate'
  | 'strength_only'
  | 'light';

export interface ClinicalProfileInput {
  age: number;
  sex: BiologicalSex;
  heightCm: number;
  weightKg: number;
  waistCm: number;
  systolicBp: number;
  onHypertensionMeds: boolean;
  totalCholesterolMgDl: number | null;
  hdlCholesterolMgDl: number | null;
  priorHighBloodGlucose: boolean;
  smokingStatus: SmokingStatus;
  packYears: number;
  alcoholUnitsPerWeek: number;
  workoutsPerWeek: number;
  minutesPerWorkout: number;
  activityType: ActivityType;
  dailySteps: number | null;
  physicalActivityMinPerWeek?: number;
  sedentaryHoursPerDay: number;
  fruitVegServingsPerDay: number;
  redProcessedMeatServingsPerWeek: number;
  ultraProcessedIntake: UltraProcessedIntake;
  sleepHoursPerNight: number;
  uvProtection: UvProtectionLevel;
  familyHistoryCvdEarly: boolean;
  familyHistoryDiabetes: FamilyHistoryLevel;
  familyHistoryCancerFirstDegree: boolean;
}

export interface ClinicalProfileDraft {
  age: number | null;
  sex: BiologicalSex | '';
  heightCm: number | null;
  weightKg: number | null;
  waistCm: number | null;
  systolicBp: number | null;
  onHypertensionMeds: boolean;
  totalCholesterolMgDl: number | null;
  hdlCholesterolMgDl: number | null;
  priorHighBloodGlucose: boolean;
  smokingStatus: SmokingStatus | '';
  packYears: number | null;
  alcoholUnitsPerWeek: number | null;
  workoutsPerWeek: number | null;
  minutesPerWorkout: number | null;
  activityType: ActivityType | '';
  dailySteps: number | null;
  sedentaryHoursPerDay: number | null;
  fruitVegServingsPerDay: number | null;
  redProcessedMeatServingsPerWeek: number | null;
  ultraProcessedIntake: UltraProcessedIntake | '';
  sleepHoursPerNight: number | null;
  uvProtection: UvProtectionLevel | '';
  familyHistoryCvdEarly: boolean;
  familyHistoryDiabetes: FamilyHistoryLevel | '';
  familyHistoryCancerFirstDegree: boolean;
}

export type RiskTier = 'low' | 'moderate' | 'elevated' | 'high' | 'very_high';

export interface RiskFactorDriver {
  id: string;
  label: string;
  domain: 'cardiovascular' | 'metabolic' | 'oncologic' | 'multi';
  impact: 'protective' | 'moderate_risk' | 'high_risk';
  modifiable: boolean;
  currentValue: string;
  clinicalTarget: string;
  citation: string;
}

export interface DomainRiskResult {
  scoreNumeric: number;
  unit: string;
  secondaryScoreLabel?: string;
  secondaryScoreValue?: string;
  tier: RiskTier;
  tierLabel: string;
  protocolName: string;
  protocolReference: string;
  horizonLabel: string;
  summary: string;
  assumptionsUsed: string[];
}

export interface PillarRadarDatum {
  pillar: string;
  userScore: number;
  guidelineTarget: number;
}

export interface PathologyPopulationComparison {
  id: 'cardiovascular' | 'metabolic' | 'oncologic';
  pathology: string;
  shortLabel: string;
  protocol: string;
  userRawValue: string;
  populationMedianRaw: string;
  populationRangeRaw: string;
  optimalTargetRaw: string;
  /** Normalized 0–100 comparative risk scale for cross-pathology charting */
  userNormalized: number;
  populationLowNormalized: number;
  populationMedianNormalized: number;
  populationHighNormalized: number;
  optimalThresholdNormalized: number;
  statusLabel: 'Sotto la media UE' | 'Nel range UE' | 'Sopra il range UE';
}

export interface ModifiableScenario {
  id: string;
  title: string;
  description: string;
  cvdDeltaPct: number;
  diabetesDeltaPoints: number;
  oncologicDeltaIndex: number;
  evidenceSource: string;
}

export interface GuidanceAction {
  priority: 1 | 2 | 3;
  title: string;
  rationale: string;
  clinicalDiscussionPoint: string;
  guideline: string;
}

export interface ClinicalAssessmentResult {
  computedAt: string;
  parameterVersion: string;
  bmi: number;
  bmiCategory: string;
  cardiovascular: DomainRiskResult;
  metabolic: DomainRiskResult;
  oncologic: DomainRiskResult;
  drivers: RiskFactorDriver[];
  radarData: PillarRadarDatum[];
  populationComparison: PathologyPopulationComparison[];
  modifiableScenarios: ModifiableScenario[];
  guidanceActions: GuidanceAction[];
  screeningNotes: string[];
}

export interface ValidationErrors {
  [field: string]: string;
}

export type ResearchDomain = 'all' | 'oncology' | 'cardiovascular' | 'metabolic';
export type ResearchDatabase = 'all' | 'PubMed' | 'Google Scholar' | 'AIRC';

export interface ReaderBrief {
  headlineIt: string;
  plainSummary: string;
  keyTakeaways: string[];
  practicalMeaning: string;
  studyLimits: string;
  evidenceLevel: string;
  readingTimeMinutes: number;
  generatedBy: 'curated' | 'monthly_scan_ai' | 'metadata_fallback';
}

export interface AcademicPublication {
  id: string;
  title: string;
  authors: string;
  journal: string;
  publishedDate: string;
  database: 'PubMed' | 'Google Scholar' | 'AIRC';
  domain: 'oncology' | 'cardiovascular' | 'metabolic';
  pmid?: string;
  url: string;
  keyFinding: string;
  clinicalRelevance: string;
  abstractSnippet?: string;
  readerBrief?: ReaderBrief;
}

export interface EmergingTrendItem {
  id: string;
  topic: string;
  domain: 'oncology' | 'cardiovascular' | 'metabolic';
  growthPctYoY: number;
  monthlyPublications: number;
  evidenceLevel: string;
  summary: string;
  protocolImpact: string;
  keyCitation: string;
  url?: string;
  readerBrief?: ReaderBrief;
}

export interface MonthlyTrendPoint {
  month: string;
  oncology: number;
  cardiovascular: number;
  metabolic: number;
  total: number;
}

export interface MonitoringDigestResponse {
  lastMonthlyScanIso: string;
  nextScheduledScanIso: string;
  cadenceDays: number;
  canRunScan: boolean;
  daysUntilNextScan: number;
  scanMessage?: string;
  sourcesTracked: string[];
  livePubMedCount: number;
  aiSynthesisNote: string | null;
  aiSynthesisError: string | null;
  monthlySeries: MonthlyTrendPoint[];
  emergingTrends: EmergingTrendItem[];
  publications: AcademicPublication[];
  groundingSources: Array<{ title: string; uri: string }>;
}

export interface LiveEvidenceResponse {
  query: string;
  synthesizedAt: string;
  summaryMarkdown: string;
  keyTakeaways: string[];
  protocolUpdates: string[];
  groundingSources: Array<{ title: string; uri: string }>;
  pubmedMatches: AcademicPublication[];
}

export interface SavedAssessmentEntry {
  id: string;
  savedAt: string;
  label: string;
  profile: ClinicalProfileInput;
  result: ClinicalAssessmentResult;
}
