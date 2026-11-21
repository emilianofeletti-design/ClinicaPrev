import {
  CalendarClock,
  Download,
  FileUp,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  buildLongitudinalSeries,
  type LongitudinalChartPoint,
  type LongitudinalMetricKey,
  type PersonalAnalysisRecord,
} from '../utils/personalArchiveFile';

export interface LongitudinalMetricOption {
  key: LongitudinalMetricKey;
  label: string;
  shortLabel: string;
  unit: string;
  color: string;
  domain: [number, number | 'auto'];
  targetValue: number;
  targetLabel: string;
}

export const LONGITUDINAL_METRIC_OPTIONS: LongitudinalMetricOption[] = [
  {
    key: 'all_normalized',
    label: 'Tutti i rischi (scala normalizzata 0–100)',
    shortLabel: 'Tutti (0–100)',
    unit: '/100',
    color: '#0D6E6E',
    domain: [0, 100],
    targetValue: 25,
    targetLabel: 'Fascia protettiva (≤25/100)',
  },
  {
    key: 'cvdPct',
    label: 'Rischio Cardiovascolare 10 anni (ESC SCORE2 %)',
    shortLabel: 'Cardio (%)',
    unit: '%',
    color: '#E11D48',
    domain: [0, 'auto'],
    targetValue: 5,
    targetLabel: 'Soglia ESC basso rischio (<5%)',
  },
  {
    key: 'findriscPoints',
    label: 'Rischio Diabete Tipo 2 (FINDRISC 0–26 pt)',
    shortLabel: 'Diabete (pt)',
    unit: ' pt',
    color: '#F97316',
    domain: [0, 26],
    targetValue: 7,
    targetLabel: 'Target FINDRISC basso (<7 pt)',
  },
  {
    key: 'oncologicIndex',
    label: 'Indice Esposizione Oncologica (WCRF/IARC /100)',
    shortLabel: 'Oncologico (/100)',
    unit: '/100',
    color: '#0D6E6E',
    domain: [0, 100],
    targetValue: 24,
    targetLabel: 'Target WCRF/AICR (<24/100)',
  },
  {
    key: 'bmi',
    label: 'Indice Massa Corporea (BMI kg/m²)',
    shortLabel: 'BMI (kg/m²)',
    unit: ' kg/m²',
    color: '#0284C7',
    domain: [15, 'auto'],
    targetValue: 24.9,
    targetLabel: 'Soglia OMS normopeso (<25 kg/m²)',
  },
];

interface RiskTimelineChartProps {
  personalTimeline: PersonalAnalysisRecord[];
  currentRecord: PersonalAnalysisRecord;
  selectedCompareId: string;
  onSelectCompareId: (id: string) => void;
  onUploadFileClick: () => void;
  onExportCurrentClick: () => void;
}

function formatSignedDelta(delta: number, decimals = 1, unit = ''): string {
  const rounded = Number(delta.toFixed(decimals));
  if (rounded === 0) return `0${unit}`;
  return `${rounded > 0 ? '+' : ''}${rounded}${unit}`;
}

export function RiskTimelineChart({
  personalTimeline,
  currentRecord,
  selectedCompareId,
  onSelectCompareId,
  onUploadFileClick,
  onExportCurrentClick,
}: RiskTimelineChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<LongitudinalMetricKey>('all_normalized');
  const [includeCurrent, setIncludeCurrent] = useState(true);

  const sortedTimeline = useMemo(
    () =>
      [...personalTimeline].sort(
        (a, b) => Date.parse(a.recordedAtIso) - Date.parse(b.recordedAtIso)
      ),
    [personalTimeline]
  );

  const chartData = useMemo(
    () => buildLongitudinalSeries(sortedTimeline, currentRecord, includeCurrent),
    [sortedTimeline, currentRecord, includeCurrent]
  );

  const activeMetricConfig =
    LONGITUDINAL_METRIC_OPTIONS.find((m) => m.key === selectedMetric) ??
    LONGITUDINAL_METRIC_OPTIONS[0];

  const baselineRecord = useMemo(() => {
    if (sortedTimeline.length === 0) return null;
    return (
      sortedTimeline.find((r) => r.id === selectedCompareId) ??
      sortedTimeline[0]
    );
  }, [sortedTimeline, selectedCompareId]);

  const deltas = useMemo(() => {
    if (!baselineRecord) return null;
    return {
      cvd: Number((currentRecord.summary.cvdPct - baselineRecord.summary.cvdPct).toFixed(1)),
      findrisc: currentRecord.summary.findriscPoints - baselineRecord.summary.findriscPoints,
      onco: currentRecord.summary.oncologicIndex - baselineRecord.summary.oncologicIndex,
      bmi: Number((currentRecord.summary.bmi - baselineRecord.summary.bmi).toFixed(1)),
    };
  }, [baselineRecord, currentRecord]);

  return (
    <div className="space-y-5" data-testid="risk-timeline-chart-container">
      {/* Metric Selector & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#FAF9F5] border border-stone-200/80 rounded-xl p-3">
        <div
          role="group"
          aria-label="Selettore indicatore grafico temporale"
          className="flex flex-wrap items-center gap-1.5"
        >
          {LONGITUDINAL_METRIC_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              data-testid={`timeline-metric-${opt.key}`}
              onClick={() => setSelectedMetric(opt.key)}
              aria-pressed={selectedMetric === opt.key}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedMetric === opt.key
                  ? 'bg-white text-[#0D6E6E] font-semibold border border-teal-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
              }`}
            >
              {opt.shortLabel}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 px-1">
          {sortedTimeline.length > 0 && (
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeCurrent}
                onChange={(e) => setIncludeCurrent(e.target.checked)}
                className="rounded border-stone-300 text-[#0D6E6E] focus:ring-[#0D6E6E] accent-[#0D6E6E]"
              />
              Includi analisi attuale (“Oggi”)
            </label>
          )}
        </div>
      </div>

      {/* Net Delta Summary Strip vs Selected Historical Checkpoint */}
      {baselineRecord && deltas && (
        <div
          data-testid="timeline-delta-strip"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {[
            {
              key: 'cvd',
              label: 'Δ Cardiovascolare (SCORE2)',
              current: `${currentRecord.summary.cvdPct}%`,
              deltaVal: deltas.cvd,
              deltaStr: formatSignedDelta(deltas.cvd, 1, '%'),
            },
            {
              key: 'findrisc',
              label: 'Δ Diabete (FINDRISC)',
              current: `${currentRecord.summary.findriscPoints}/26 pt`,
              deltaVal: deltas.findrisc,
              deltaStr: formatSignedDelta(deltas.findrisc, 0, ' pt'),
            },
            {
              key: 'onco',
              label: 'Δ Esposizione Oncologica',
              current: `${currentRecord.summary.oncologicIndex}/100`,
              deltaVal: deltas.onco,
              deltaStr: formatSignedDelta(deltas.onco, 0, ' pt'),
            },
            {
              key: 'bmi',
              label: 'Δ BMI Corporeo',
              current: `${currentRecord.summary.bmi} kg/m²`,
              deltaVal: deltas.bmi,
              deltaStr: formatSignedDelta(deltas.bmi, 1, ' kg/m²'),
            },
          ].map((item) => {
            const isImproved = item.deltaVal < 0;
            const isWorsened = item.deltaVal > 0;
            return (
              <div
                key={item.key}
                className="rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2.5 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-500 truncate">{item.label}</p>
                  <p className="text-sm font-mono font-bold tabular-nums text-slate-900">
                    {item.current}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-mono font-semibold tabular-nums shrink-0 ${
                    isImproved
                      ? 'text-emerald-700'
                      : isWorsened
                        ? 'text-rose-700'
                        : 'text-slate-500'
                  }`}
                >
                  {isImproved && <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />}
                  {isWorsened && <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />}
                  {item.deltaStr}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Recharts Longitudinal Chart + Historical Checkpoints Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div
          className="lg:col-span-8 w-full h-76 bg-white border border-stone-200/80 rounded-xl p-3"
          data-testid="longitudinal-line-chart"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 12, right: 20, left: -8, bottom: 4 }}
            >
              <defs>
                <linearGradient id="timelineSingleMetricGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeMetricConfig.color} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={activeMetricConfig.color} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 11, fill: '#475569' }}
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
              />
              <YAxis
                domain={activeMetricConfig.domain}
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine
                y={activeMetricConfig.targetValue}
                stroke="#10B981"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: activeMetricConfig.targetLabel,
                  position: 'insideTopRight',
                  fill: '#047857',
                  fontSize: 10,
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const pt = payload[0]?.payload as LongitudinalChartPoint | undefined;
                  if (!pt) return null;
                  return (
                    <div className="bg-white border border-stone-200 rounded-lg p-3 shadow-sm text-xs space-y-1.5 max-w-xs">
                      <p className="font-semibold text-slate-900">
                        {pt.label} {pt.isCurrent ? '(Attuale)' : ''}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500">{pt.fullDate}</p>
                      <div className="pt-1 border-t border-stone-100 space-y-1 font-mono tabular-nums">
                        <div className="flex justify-between gap-4">
                          <span className="text-rose-700">Cardiovascolare:</span>
                          <span className="font-semibold text-slate-900">{pt.cvdPct}%</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-orange-700">Diabete FINDRISC:</span>
                          <span className="font-semibold text-slate-900">
                            {pt.findriscPoints} / 26 pt
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-[#0D6E6E]">Indice Oncologico:</span>
                          <span className="font-semibold text-slate-900">
                            {pt.oncologicIndex} / 100
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-sky-700">BMI:</span>
                          <span className="font-semibold text-slate-900">{pt.bmi} kg/m²</span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />

              {selectedMetric === 'all_normalized' ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="oncologicNormalized"
                    name="Oncologico (0–100)"
                    stroke="#0D6E6E"
                    strokeWidth={2.5}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="findriscNormalized"
                    name="Diabete FINDRISC (norm. 0–100)"
                    stroke="#F97316"
                    strokeWidth={2.5}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="cvdNormalized"
                    name="Cardiovascolare (norm. 0–100)"
                    stroke="#E11D48"
                    strokeWidth={2.5}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    isAnimationActive={false}
                  />
                </>
              ) : (
                <>
                  <Area
                    type="monotone"
                    dataKey={selectedMetric}
                    fill="url(#timelineSingleMetricGrad)"
                    stroke="none"
                    legendType="none"
                    tooltipType="none"
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={selectedMetric}
                    name={activeMetricConfig.label}
                    stroke={activeMetricConfig.color}
                    strokeWidth={2.75}
                    dot={{ r: 5, strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                    isAnimationActive={false}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Historical Checkpoints List or Onboarding Callout */}
        <div className="lg:col-span-4 border border-stone-200 rounded-xl bg-[#FAF9F5]/80 divide-y divide-stone-200 max-h-76 overflow-y-auto">
          <div className="px-4 py-2.5 bg-stone-100/70 flex items-center justify-between gap-2">
            <p className="text-[11px] font-mono font-semibold text-slate-600 uppercase">
              Cronologia Rilevazioni ({sortedTimeline.length + (includeCurrent ? 1 : 0)})
            </p>
            <CalendarClock className="w-3.5 h-3.5 text-[#0D6E6E]" aria-hidden="true" />
          </div>

          {sortedTimeline.length === 0 ? (
            <div className="p-4 space-y-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-900">
                1 rilevazione attiva (“Oggi”)
              </p>
              <p className="leading-relaxed">
                Il grafico mostra il tuo punto di riferimento odierno rispetto alle soglie
                cliniche. Carica un file storico (<code>.json</code>) per tracciare la curva di
                evoluzione nel tempo oppure salva l’analisi di oggi sul tuo dispositivo.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={onUploadFileClick}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0D6E6E] rounded-lg hover:bg-[#0A5656] transition-colors cursor-pointer"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  Carica File Storico (.json)
                </button>
                <button
                  type="button"
                  onClick={onExportCurrentClick}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0D6E6E] bg-white border border-teal-200 rounded-lg hover:bg-teal-50/70 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Salva Analisi di Oggi (.json)
                </button>
              </div>
            </div>
          ) : (
            <>
              {sortedTimeline.map((rec) => {
                const isSelected = baselineRecord?.id === rec.id;
                return (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => onSelectCompareId(rec.id)}
                    className={`w-full text-left px-4 py-3 space-y-1 transition-colors cursor-pointer ${
                      isSelected ? 'bg-teal-50/70' : 'hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {rec.label}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-mono font-semibold text-[#0D6E6E] bg-teal-100 px-1.5 py-0.5 rounded shrink-0">
                          In confronto
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-500">
                      {new Date(rec.recordedAtIso).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-[11px] font-mono text-slate-700 tabular-nums">
                      CV {rec.summary.cvdPct}% · Diab {rec.summary.findriscPoints}pt · Onco{' '}
                      {rec.summary.oncologicIndex} · BMI {rec.summary.bmi}
                    </p>
                  </button>
                );
              })}

              {includeCurrent && (
                <div className="px-4 py-3 space-y-1 bg-white/80">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">
                      Oggi (Analisi attuale)
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-slate-600 bg-stone-100 px-1.5 py-0.5 rounded shrink-0">
                      Attuale
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-700 tabular-nums">
                    CV {currentRecord.summary.cvdPct}% · Diab {currentRecord.summary.findriscPoints}pt
                    · Onco {currentRecord.summary.oncologicIndex} · BMI {currentRecord.summary.bmi}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
