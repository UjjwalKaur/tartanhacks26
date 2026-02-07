'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * This page:
 * 1) Loads mock JSON from /public/mock/*.json
 * 2) Computes correlations + anomaly days (same logic as your HTML)
 * 3) Renders char         try {
      const payload = buildAiPayload(rows, cards, anomaliesBundle.flags);

      console.log('=== SENDING TO AI SUMMARY ===');
      console.log('Checkins count:', checkins.length);
      console.log('Cards (insights) count:', cards.length);

      const res = await fetch(SUMMARY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insights: cards,
          transactions: null,
          health: null,
          checkins: checkins,
        }),
      });t fetch(SUMMARY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insights: cards,
          transactions: null,
          health: null,
          checkins: checkins,
        }),
      }); Calls your Next API route (Dedalus-backed) to generate an AI explanation
 *
 * IMPORTANT:
 * - Your mock files must be in:
 *   public/mock/transactions.json
 *   public/mock/watch_daily.json
 *   public/mock/video_sentiment.json
 *
 * - Your Dedalus API route should exist at:
 *   src/app/api/insights/summary/route.ts
 *   (Then the browser path is /api/insights/summary)
 *
 * If your route is instead /api/insights (no /summary), change SUMMARY_API below.
 */

const SUMMARY_API = '/api/insights/summary';

type TxRow = {
  date: string; // YYYY-MM-DD
  amount: number; // positive for outflow
  group: 'Needs' | 'Wants' | 'Income';
  category?: string;
  merchant?: string;
};

type WatchDailyRow = {
  date: string;
  sleep_total_min?: number | null;
  sleep_efficiency?: number | null;
  hr_resting?: number | null;
  exercise_min?: number | null;
  steps?: number | null;
  active_energy_kcal?: number | null;
};

type VideoSentimentRow = {
  date: string;
  sentiment_score: number; // -1..1
  stress_score: number; // 0..10
};

type CheckinRow = {
  date_of_checkin: string; // YYYY-MM-DD
  emotion1: string;
  emotion2: string;
  emotion3: string;
  stress: number; // 0-10
  life_event_summary: string;
  financial_flags: string;
};

type DailyAgg = {
  date: string;
  income: number;
  needs: number;
  wants: number;
  total_spend: number;
  count: number;
};

type MergedRow = DailyAgg & {
  sleep_hours: number | null;
  sleep_eff: number | null;
  resting_hr: number | null;
  exercise_min: number | null;
  steps: number | null;
  active_kcal: number | null;
  video_sentiment: number | null;
  video_stress: number | null;
  emotion_stress: number | null; // from checkins
  emotion_sentiment: number | null; // map emotions to -1..1 scale
};

type CardItem = { label: string; value: string; note: string };

type AnomalyFlags = {
  zWants: Array<number | null>;
  zSleep: Array<number | null>;
  zEx: Array<number | null>;
  zRest: Array<number | null>;
  zStress: Array<number | null>;
  wantsHigh: boolean[]; // actually "wants unusual" (abs z >= threshold)
  sleepLow: boolean[];
  exLow: boolean[];
  restHigh: boolean[];
  stressHigh: boolean[];
};

type AiSummaryResponse = {
  summary?: string;
  recommendations?: string[];
  highlights?: string[];
  debug?: any;
  error?: string;
};

function mean(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function pearson(x: number[], y: number[]) {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const mx = mean(x.slice(0, n));
  const my = mean(y.slice(0, n));
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx;
    const b = y[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

function rank(arr: number[]) {
  const indexed = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const r = new Array(arr.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j + 1 < indexed.length && indexed[j + 1].v === indexed[i].v) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) r[indexed[k].i] = avg;
    i = j + 1;
  }
  return r as number[];
}

function spearman(x: number[], y: number[]) {
  return pearson(rank(x), rank(y));
}

function formatR(r: number) {
  const v = Math.round(r * 100) / 100;
  return (v >= 0 ? '+' : '') + v.toFixed(2);
}

function median(arr: number[]) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function mad(arr: number[], med: number) {
  const dev = arr.map((v) => Math.abs(v - med));
  return median(dev);
}

function robustZ(value: number, med: number, madVal: number) {
  if (!madVal) return 0;
  return 0.6745 * (value - med) / madVal;
}

function computeRobustZSeries(values: Array<number | null>) {
  const clean = values.filter((v): v is number => v != null && !Number.isNaN(v));
  if (clean.length < 5) return values.map(() => 0);

  const med = median(clean);
  const madVal = mad(clean, med);

  // fallback to standard z if MAD is 0
  if (!madVal) {
    const m = mean(clean);
    const varr = mean(clean.map((v) => (v - m) * (v - m)));
    const sd = Math.sqrt(varr);
    if (!sd) return values.map(() => 0);
    return values.map((v) => (v == null ? null : (v - m) / sd));
  }

  return values.map((v) => (v == null ? null : robustZ(v, med, madVal)));
}

function indexByDate<T extends { date: string }>(rows: T[]) {
  const m = new Map<string, T>();
  for (const r of rows) m.set(r.date, r);
  return m;
}

function aggregateDaily(tx: TxRow[]): DailyAgg[] {
  const byDate = new Map<string, DailyAgg>();

  function init(date: string) {
    if (!byDate.has(date)) {
      byDate.set(date, { date, income: 0, needs: 0, wants: 0, total_spend: 0, count: 0 });
    }
    return byDate.get(date)!;
  }

  for (const t of tx) {
    const d = init(t.date);
    d.count += 1;

    if (t.group === 'Income' || t.category === 'Income') {
      d.income += Math.abs(t.amount);
      continue;
    }

    if (t.group === 'Needs') d.needs += t.amount;
    else d.wants += t.amount;

    d.total_spend += t.amount;
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function mergeDaily(daily: DailyAgg[], watch: WatchDailyRow[], vids: VideoSentimentRow[], checkins: CheckinRow[] = []): MergedRow[] {
  const watchMap = indexByDate(watch);
  const videoMap = indexByDate(vids);
  const checkinMap = indexByDate(checkins.map(c => ({ ...c, date: c.date_of_checkin })));

  // Map emotions to sentiment score (-1 to 1)
  const emotionToSentiment: Record<string, number> = {
    happy: 1, excited: 0.9, energetic: 0.8, content: 0.7,
    calm: 0.5, peaceful: 0.6, relieved: 0.7, hopeful: 0.6,
    neutral: 0, focused: 0.3,
    tired: -0.3, drained: -0.4, exhausted: -0.5,
    sad: -0.7, depressed: -0.9, unhappy: -0.8,
    stressed: -0.6, anxious: -0.7, overwhelmed: -0.8, panicked: -0.9,
    irritable: -0.5, angry: -0.8, frustrated: -0.6,
    burnt_out: -0.9,
  };

  return daily.map((d) => {
    const w = watchMap.get(d.date);
    const v = videoMap.get(d.date);
    const c = checkinMap.get(d.date);

    // Average sentiment from primary emotion
    let emotionSentiment = null;
    if (c?.emotion1) {
      const sentiment = emotionToSentiment[c.emotion1.toLowerCase()] ?? 0;
      emotionSentiment = sentiment;
    }

    return {
      ...d,
      sleep_hours: w?.sleep_total_min != null ? w.sleep_total_min / 60 : null,
      sleep_eff: w?.sleep_efficiency ?? null,
      resting_hr: w?.hr_resting ?? null,
      exercise_min: w?.exercise_min ?? null,
      steps: w?.steps ?? null,
      active_kcal: w?.active_energy_kcal ?? null,
      video_sentiment: v?.sentiment_score ?? null,
      video_stress: v?.stress_score ?? null,
      emotion_stress: c?.stress ?? null,
      emotion_sentiment: emotionSentiment,
    };
  });
}

function computeCards(rows: MergedRow[]): CardItem[] {
  const totalSpend = rows.reduce((s, r) => s + r.total_spend, 0);
  const totalWants = rows.reduce((s, r) => s + r.wants, 0);
  const wantsShare = totalSpend > 0 ? totalWants / totalSpend : 0;

  function corrOf(key: keyof MergedRow) {
    const pairs = rows
      .filter((r) => r[key] != null)
      .map((r) => ({ x: r[key] as number, y: r.wants }));

    const r = spearman(
      pairs.map((p) => p.x),
      pairs.map((p) => p.y)
    );
    return { r, n: pairs.length };
  }

  const rEx = corrOf('exercise_min');
  const rRest = corrOf('resting_hr');
  const rSent = corrOf('video_sentiment');
  const rStress = corrOf('video_stress');
  const rEmotionSent = corrOf('emotion_sentiment');
  const rEmotionStress = corrOf('emotion_stress');

  // sleep(t) vs wants(t+1)
  const sleepNextPairs: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < rows.length - 1; i++) {
    if (rows[i].sleep_hours != null) sleepNextPairs.push({ x: rows[i].sleep_hours!, y: rows[i + 1].wants });
  }
  const rSleepNext = spearman(
    sleepNextPairs.map((p) => p.x),
    sleepNextPairs.map((p) => p.y)
  );

  return [
    { label: 'Sleep → Wants (next day)', value: 'r ' + formatR(rSleepNext), note: 'Sleep(t) vs Wants(t+1)' },
    { label: 'Exercise → Wants', value: 'r ' + formatR(rEx.r), note: `n=${rEx.n} watch days` },
    { label: 'Resting HR → Wants', value: 'r ' + formatR(rRest.r), note: `n=${rRest.n} watch days` },
    { label: 'Emotion stress → Wants', value: 'r ' + formatR(rEmotionStress.r), note: `n=${rEmotionStress.n} checkin days` },
    { label: 'Emotion sentiment → Wants', value: 'r ' + formatR(rEmotionSent.r), note: `n=${rEmotionSent.n} checkin days` },
    { label: 'Video stress → Wants', value: 'r ' + formatR(rStress.r), note: `n=${rStress.n} video days` },
    { label: 'Video sentiment → Wants', value: 'r ' + formatR(rSent.r), note: `n=${rSent.n} video days` },
    { label: 'Wants share of spending', value: Math.round(wantsShare * 100) + '%', note: 'Wants / Total (excluding income)' },
    { label: 'Total spent (period)', value: '$' + totalSpend.toFixed(2), note: 'All days included' },
    { label: 'Data quality', value: 'Realistic mix', note: 'Weekends + bills + paydays included' },
  ];
}

function computeAnomalyFlags(rows: MergedRow[], zThresh = 2.0): AnomalyFlags {
  const zWants = computeRobustZSeries(rows.map((r) => r.wants));
  const zSleep = computeRobustZSeries(rows.map((r) => r.sleep_hours));
  const zEx = computeRobustZSeries(rows.map((r) => r.exercise_min));
  const zRest = computeRobustZSeries(rows.map((r) => r.resting_hr));
  const zStress = computeRobustZSeries(rows.map((r) => r.video_stress));

  const wantsUnusual = zWants.map((z) => z != null && Math.abs(z) >= zThresh);
  const sleepLow = zSleep.map((z) => z != null && z <= -zThresh);
  const exLow = zEx.map((z) => z != null && z <= -zThresh);
  const restHigh = zRest.map((z) => z != null && z >= zThresh);
  const stressHigh = zStress.map((z) => z != null && z >= zThresh);

  return {
    zWants,
    zSleep,
    zEx,
    zRest,
    zStress,
    wantsHigh: wantsUnusual,
    sleepLow,
    exLow,
    restHigh,
    stressHigh,
  };
}

function topKByAbsZ(zArr: Array<number | null>, k = 5) {
  return zArr
    .map((z, i) => ({ i, z: z == null || Number.isNaN(z) ? 0 : z }))
    .sort((a, b) => Math.abs(b.z) - Math.abs(a.z))
    .slice(0, k)
    .map((s) => s.i);
}

function clampText(text: string, maxLen: number) {
  const t = (text ?? '').trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen - 1) + '…';
}

function buildAiPayload(rows: MergedRow[], cards: CardItem[], anomalies: ReturnType<typeof computeAnomalyFlags>) {
  // Keep payload small but meaningful (Dedalus/LLMs do better with a clean structure).
  const lastNDays = 14;
  const tail = rows.slice(Math.max(0, rows.length - lastNDays)).map((r) => ({
    date: r.date,
    needs: Number(r.needs.toFixed(2)),
    wants: Number(r.wants.toFixed(2)),
    total_spend: Number(r.total_spend.toFixed(2)),
    sleep_hours: r.sleep_hours == null ? null : Number(r.sleep_hours.toFixed(2)),
    exercise_min: r.exercise_min,
    resting_hr: r.resting_hr,
    video_stress: r.video_stress,
    video_sentiment: r.video_sentiment,
    emotion_stress: r.emotion_stress,
    emotion_sentiment: r.emotion_sentiment,
  }));

  const idxs = topKByAbsZ(anomalies.zWants, 6);
  const anomalyDays = idxs.map((i) => ({
    date: rows[i]?.date,
    wants: rows[i]?.wants,
    total_spend: rows[i]?.total_spend,
    z_wants: anomalies.zWants[i],
    sleep_hours: rows[i]?.sleep_hours,
    exercise_min: rows[i]?.exercise_min,
    resting_hr: rows[i]?.resting_hr,
    video_stress: rows[i]?.video_stress,
    video_sentiment: rows[i]?.video_sentiment,
    emotion_stress: rows[i]?.emotion_stress,
    emotion_sentiment: rows[i]?.emotion_sentiment,
  }));

  return {
    cards,
    recent_days: tail,
    anomaly_days: anomalyDays,
  };
}

export default function InsightsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<MergedRow[] | null>(null);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Dedalus summary state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [ai, setAi] = useState<AiSummaryResponse | null>(null);

  // prevents re-requesting summary repeatedly if state changes
  const aiRequestedRef = useRef(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Load real data from uploaded files and checkins
        const [txRes, checkinsRes] = await Promise.all([
          fetch('/api/analyze/spending').then((r) => r.json()),
          fetch('/api/checkins').then((r) => r.json() as Promise<{ checkins: CheckinRow[] }| { error: string }>),
        ]);

        // Handle checkins response
        const checkinsData = 'checkins' in checkinsRes ? checkinsRes.checkins : [];
        setCheckins(checkinsData);

        // Extract transactions from the analysis response
        let tx: TxRow[] = [];
        if (txRes?.transactions && Array.isArray(txRes.transactions)) {
          tx = txRes.transactions.map((t: any) => ({
            date: t.date || new Date().toISOString().split('T')[0],
            amount: Math.abs(t.amount || 0),
            group: t.group || 'Wants',
            category: t.category,
            merchant: t.merchant,
          }));
        }

        // For now, use empty arrays for watch/video data (not tracking those)
        const watch: WatchDailyRow[] = [];
        const vids: VideoSentimentRow[] = [];

        const daily = aggregateDaily(tx);
        const merged = mergeDaily(daily, watch, vids, checkinsData);

        setRows(merged);
      } catch (e: any) {
        console.error('Error loading insights data:', e);
        setError(e?.message ?? 'Failed to load insights data.');
        setRows(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const cards = useMemo(() => (rows ? computeCards(rows) : []), [rows]);

  const chartTrend = useMemo(() => {
    if (!rows) return [];
    return rows.map((r) => ({
      date: r.date.slice(5),
      totalSpend: r.total_spend,
      sleep: r.sleep_hours,
      sentiment: r.video_sentiment,
    }));
  }, [rows]);

  const chartStacked = useMemo(() => {
    if (!rows) return [];
    return rows.map((r) => ({
      date: r.date.slice(5),
      needs: r.needs,
      wants: r.wants,
    }));
  }, [rows]);

  const sleepNextScatter = useMemo(() => {
    if (!rows) return [];
    const pts: Array<{ x: number; y: number; date: string }> = [];
    for (let i = 0; i < rows.length - 1; i++) {
      const x = rows[i].sleep_hours;
      if (x != null) pts.push({ x, y: rows[i + 1].wants, date: rows[i].date.slice(5) });
    }
    return pts;
  }, [rows]);

  const exerciseScatter = useMemo(() => {
    if (!rows) return [];
    return rows
      .filter((r) => r.exercise_min != null)
      .map((r) => ({ x: r.exercise_min!, y: r.wants, date: r.date.slice(5) }));
  }, [rows]);

  const restHrScatter = useMemo(() => {
    if (!rows) return [];
    return rows
      .filter((r) => r.resting_hr != null)
      .map((r) => ({ x: r.resting_hr!, y: r.wants, date: r.date.slice(5) }));
  }, [rows]);

  const stressBars = useMemo(() => {
    if (!rows) return [];
    const withVideo = rows.filter((r) => r.video_stress != null);
    const stressDays = withVideo.filter((r) => (r.video_stress ?? 0) >= 6);
    const nonStress = withVideo.filter((r) => (r.video_stress ?? 0) < 6);
    const avgStress = mean(stressDays.map((r) => r.wants));
    const avgNon = mean(nonStress.map((r) => r.wants));
    return [
      { label: 'Non-stress video days', avg: avgNon },
      { label: 'Stress video days', avg: avgStress },
    ];
  }, [rows]);

  const anomaliesBundle = useMemo(() => {
    if (!rows) return null;
    const flags = computeAnomalyFlags(rows, 2.0);
    const timeline = rows.map((r, i) => ({
      date: r.date.slice(5),
      wants: r.wants,
      absZ: Math.abs(flags.zWants[i] ?? 0),
    }));

    const picked = topKByAbsZ(flags.zWants, 5);
    const top = picked.map((i) => {
      const r = rows[i];
      const zw = flags.zWants[i] ?? 0;

      const tags: Array<{ text: string; kind: 'bad' | 'good' | 'neutral' }> = [];
      tags.push({ text: `wants z=${zw.toFixed(2)}`, kind: 'bad' });
      tags.push({ text: `wants=$${r.wants.toFixed(2)}`, kind: 'bad' });

      // co-anomalies (slightly softer thresholds)
      const candidates = [i - 1, i, i + 1].filter((j) => j >= 0 && j < rows.length);
      const bestSleepIdx = candidates
        .map((j) => ({ j, z: flags.zSleep[j] }))
        .filter((x) => x.z != null)
        .sort((a, b) => (a.z as number) - (b.z as number))[0];

      if (bestSleepIdx?.z != null && bestSleepIdx.z <= -1.75) {
        const sh = rows[bestSleepIdx.j].sleep_hours;
        if (sh != null) tags.push({ text: `low sleep (${sh.toFixed(1)}h)`, kind: 'bad' });
      }

      const zx = flags.zEx[i];
      if (zx != null && zx <= -1.75 && r.exercise_min != null) {
        tags.push({ text: `low exercise (${r.exercise_min}m)`, kind: 'bad' });
      }

      const zr = flags.zRest[i];
      if (zr != null && zr >= 1.75 && r.resting_hr != null) {
        tags.push({ text: `high rest HR (${r.resting_hr} bpm)`, kind: 'bad' });
      }

      const zs = flags.zStress[i];
      if (zs != null && zs >= 1.75 && r.video_stress != null) {
        tags.push({ text: `high stress (${r.video_stress})`, kind: 'bad' });
      }

      if (r.video_sentiment != null && r.video_sentiment > 0.4) {
        tags.push({ text: `positive sentiment (${r.video_sentiment.toFixed(2)})`, kind: 'good' });
      }

      return { date: r.date, tags };
    });

    return { flags, timeline, top };
  }, [rows]);

  async function requestAiSummary(reason: 'auto' | 'manual' = 'manual') {
    if (!rows || !anomaliesBundle) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const payload = buildAiPayload(rows, cards, anomaliesBundle.flags);

      console.log('=== SENDING TO AI SUMMARY ===');
      console.log('Checkins count:', checkins.length);
      console.log('Checkins data:', checkins.slice(0, 2));
      console.log('Cards (insights) count:', cards.length);

      const res = await fetch(SUMMARY_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insights: cards,
          transactions: null,
          health: null,
          checkins: checkins,
        }),
      });

      const ct = res.headers.get('content-type') || '';
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          ct.includes('text/html')
            ? 'Your summary API route returned HTML (likely 404). Check the route path is /api/insights/summary.'
            : text || `Request failed (${res.status})`
        );
      }

      const json = (await res.json()) as AiSummaryResponse;
      if (json?.error) throw new Error(json.error);

      setAi(json);
    } catch (e: any) {
      setAi(null);
      setAiError(e?.message ?? 'Could not generate summary.');
    } finally {
      setAiLoading(false);
    }
  }

  // Auto-generate once when we have data
  useEffect(() => {
    if (!rows || !anomaliesBundle) return;
    if (aiRequestedRef.current) return;
    aiRequestedRef.current = true;
    requestAiSummary('auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, anomaliesBundle]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-4 w-[520px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <GlassCard key={i} className="p-5">
              <Skeleton className="h-20 w-full" />
            </GlassCard>
          ))}
        </div>
        <GlassCard className="p-6">
          <Skeleton className="h-64 w-full" />
        </GlassCard>
      </div>
    );
  }

  if (error || !rows) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <GlassCard className="p-8 max-w-md text-center space-y-3">
          <h2 className="text-2xl font-bold text-text">Unable to Load Insights</h2>
          <p className="text-muted">{error ?? 'Unknown error'}</p>
          <p className="text-xs text-muted">
            Make sure your JSON files are in <span className="text-text">/public/mock</span> and named exactly:
            transactions.json, watch_daily.json, video_sentiment.json
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <div className="space-y-2">
        <h1 className="text-5xl font-bold text-text tracking-tight">Insights Dashboard</h1>
        <p className="text-lg text-muted max-w-2xl">
          We compare Apple Watch sleep/activity + video mood signals to spending habits. These are correlations (patterns),
          not proof of cause and effect.
        </p>
      </div>

      {/* ========================= */}
      {/* AI Summary (Dedalus)      */}
      {/* ========================= */}
      <GlassCard className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-text">AI Explanation</h2>
            <p className="text-sm text-muted">
              Dedalus reviews the correlations + anomaly days and explains what likely happened on high-spend days.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => requestAiSummary('manual')}
              disabled={aiLoading}
              className="whitespace-nowrap"
            >
              {aiLoading ? 'Generating…' : 'Regenerate'}
            </Button>
          </div>
        </div>

        {aiLoading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-[85%]" />
            <Skeleton className="h-4 w-[75%]" />
            <Skeleton className="h-4 w-[70%]" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <GlassCard className="p-4">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-[90%] mt-3" />
                <Skeleton className="h-3 w-[80%] mt-2" />
              </GlassCard>
              <GlassCard className="p-4">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-[90%] mt-3" />
                <Skeleton className="h-3 w-[80%] mt-2" />
              </GlassCard>
            </div>
          </div>
        )}

        {!aiLoading && aiError && (
          <div className="border border-stroke/50 rounded-xl p-4 bg-glass2 space-y-2">
            <div className="text-sm text-text font-medium">Could not generate summary</div>
            <div className="text-sm text-muted">{aiError}</div>
            <div className="text-xs text-muted">
              If you see HTML/404 errors, confirm your route exists at{' '}
              <span className="text-text">src/app/api/insights/summary/route.ts</span> and you are calling{' '}
              <span className="text-text">/api/insights/summary</span>.
            </div>
          </div>
        )}

        {!aiLoading && !aiError && ai && (
          <div className="space-y-4">
            {ai.summary && (
              <div className="border border-stroke/50 rounded-xl p-4 bg-glass2">
                <div className="text-sm text-muted uppercase tracking-wide mb-2">Summary</div>
                <div className="text-sm text-text whitespace-pre-wrap">{ai.summary}</div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="border border-stroke/50 rounded-xl p-4 bg-glass2">
                <div className="text-sm text-muted uppercase tracking-wide mb-2">Highlights</div>
                {(ai.highlights ?? []).length ? (
                  <ul className="space-y-2">
                    {ai.highlights!.slice(0, 8).map((h, idx) => (
                      <li key={idx} className="text-sm text-text">
                        • {h}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted">No highlights returned.</div>
                )}
              </div>

              <div className="border border-stroke/50 rounded-xl p-4 bg-glass2">
                <div className="text-sm text-muted uppercase tracking-wide mb-2">Suggestions</div>
                {(ai.recommendations ?? []).length ? (
                  <ul className="space-y-2">
                    {ai.recommendations!.slice(0, 10).map((r, idx) => (
                      <li key={idx} className="text-sm text-text">
                        • {r}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted">No suggestions returned.</div>
                )}
              </div>
            </div>

            {/* tiny “what did we send” footer (helpful for debugging, but not noisy) */}
            <div className="text-[11px] text-muted">
              The AI summary uses your computed cards + the last 14 days of merged metrics + top anomaly days.
            </div>
          </div>
        )}
      </GlassCard>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <GlassCard key={c.label} className="p-5">
            <div className="text-xs text-muted uppercase tracking-wide">{c.label}</div>
            <div className="text-2xl font-bold text-text mt-1">{c.value}</div>
            <div className="text-xs text-muted mt-1">{c.note}</div>
          </GlassCard>
        ))}
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-5 space-y-3">
          <h2 className="text-xl font-bold text-text">Daily spending vs sleep and video sentiment</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="totalSpend" name="Total spend ($)" dot={false} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="sleep" name="Sleep (hrs)" dot={false} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="sentiment" name="Video sentiment (-1..1)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-muted">Spending is daily total (excluding income). Sentiment appears only on video days.</div>
        </GlassCard>

        <GlassCard className="p-5 space-y-3">
          <h2 className="text-xl font-bold text-text">Spending breakdown (Needs vs Wants)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartStacked}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="needs" name="Needs ($)" stackId="s" />
                <Bar dataKey="wants" name="Wants ($)" stackId="s" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-muted">Wants includes dining, coffee, shopping, alcohol, subscriptions.</div>
        </GlassCard>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-5 space-y-3">
          <h2 className="text-xl font-bold text-text">Sleep today vs next-day wants spending</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="Sleep" unit="h" />
                <YAxis type="number" dataKey="y" name="Wants" unit="$" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={sleepNextScatter} name="Sleep(t) vs Wants(t+1)" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-muted">Lag helps show habit links without claiming sleep “causes” spending.</div>
        </GlassCard>

        <GlassCard className="p-5 space-y-3">
          <h2 className="text-xl font-bold text-text">Exercise minutes vs wants spending</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="Exercise" unit="min" />
                <YAxis type="number" dataKey="y" name="Wants" unit="$" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={exerciseScatter} name="Exercise vs wants" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-muted">Active days can align with more routine and lower convenience spending.</div>
        </GlassCard>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-5 space-y-3">
          <h2 className="text-xl font-bold text-text">Video stress days vs non-stress days</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stressBars}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avg" name="Avg wants ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-muted">Stress day means video stress score ≥ 6. Only uses days with videos.</div>
        </GlassCard>

        <GlassCard className="p-5 space-y-3">
          <h2 className="text-xl font-bold text-text">Resting HR vs wants spending</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="Resting HR" unit="bpm" />
                <YAxis type="number" dataKey="y" name="Wants" unit="$" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={restHrScatter} name="Resting HR vs wants" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-muted">Resting HR is a simple “strain” proxy and is often available.</div>
        </GlassCard>
      </div>

      {/* Anomalies */}
      <GlassCard className="p-5 space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-text">Anomalies</h2>
          <p className="text-sm text-muted">
            We detect unusually high/low days using a robust z-score (median + MAD). This flags out-of-pattern wants spending
            and checks whether sleep/exercise/resting HR/video stress were also unusual around the same time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-text">Wants spending anomalies timeline</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={anomaliesBundle?.timeline ?? []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="wants" name="Wants ($)" dot={false} strokeWidth={2} />
                  <ReferenceLine y={0} strokeDasharray="3 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-muted">We rank days by robust |z| (default threshold 2.0).</div>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold text-text">Top anomaly days</h3>

            <div className="space-y-3">
              {(anomaliesBundle?.top ?? []).length ? (
                anomaliesBundle!.top.map((item) => (
                  <div key={item.date} className="border border-stroke/50 rounded-xl p-3 bg-glass2">
                    <div className="text-sm text-text font-medium">{item.date}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className={[
                            'text-[11px] px-2 py-0.5 rounded-full border',
                            t.kind === 'bad'
                              ? 'border-red-200 bg-red-50 text-text'
                              : t.kind === 'good'
                              ? 'border-green-200 bg-green-50 text-text'
                              : 'border-stroke/50 bg-glass text-text',
                          ].join(' ')}
                        >
                          {clampText(t.text, 60)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted">
                  No strong anomalies detected. Try adding more variation in the demo data (e.g., one “big night out” day).
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="flex justify-end">
        <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top</Button>
      </div>
    </div>
  );
}