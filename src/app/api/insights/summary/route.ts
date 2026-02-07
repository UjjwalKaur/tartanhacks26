import { NextResponse } from 'next/server';
import Dedalus from 'dedalus-labs';

export const runtime = 'nodejs';

type Insight = {
  id: string;
  title: string;
  explanation: string;
  confidence: number;
  evidence: {
    metric: string;
    dates: string[];
    values: number[];
  };
};

type SummaryResponse = {
  summary: string;
  what_drove_spending: string[];
  what_to_try_next: string[];
  high_spend_day_story: string[];
  caveat: string;
};

function safeJsonParse(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.DEDALUS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing DEDALUS_API_KEY. Add it to .env.local and restart dev server.' },
      { status: 500 }
    );
  }

  let body: { insights?: Insight[]; transactions?: any; health?: any; checkins?: any[] } = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }

  const insights = body.insights ?? [];
  const transactions = body.transactions;
  const health = body.health;
  const checkins = body.checkins ?? [];

  console.log('=== AI SUMMARY REQUEST ===');
  console.log('Checkins received:', checkins.length);
  console.log('Insights received:', insights.length);
  console.log('Recent checkins:', checkins.slice(0, 3));

  if (!insights.length && !checkins.length) {
    const fallback: SummaryResponse = {
      summary:
        'No insight data was provided yet. Once you have a few days of transactions + sleep/activity + journal signals, I can summarize your patterns here.',
      what_drove_spending: ['Not enough data yet to identify drivers.'],
      what_to_try_next: ['Add 7–14 days of data, then regenerate the summary.'],
      high_spend_day_story: ['Tip: include at least a few "high spend" days for a compelling demo.'],
      caveat: 'This is a demo summary. Real recommendations improve with more history.'
    };
    return NextResponse.json(fallback);
  }

  const compact = insights.map((i) => ({
    title: i.title,
    explanation: i.explanation,
    confidence: i.confidence,
    metric: i.evidence.metric,
    dates: i.evidence.dates.slice(-14),
    values: i.evidence.values.slice(-14),
  }));

  const system = `You are a financial wellbeing coach analyzing spending patterns linked to lifestyle signals (sleep, activity, mood, and emotional check-ins).
Your goal: Identify actionable insights connecting spending to emotional and lifestyle factors.
Be honest about correlation vs causation. Return ONLY valid JSON.`;

  // Include key data without overwhelming - get top categories and recent health
  const healthData = health ? {
    recentSleep: health.sleepSeries?.[health.sleepSeries.length - 1]?.value,
    recentSteps: health.stepsSeries?.[health.stepsSeries.length - 1]?.value,
    sleepTrend: health.sleepSeries?.slice(-7).length || 0,
  } : null;
  
  const spendingData = transactions ? {
    topCategories: Object.entries(transactions.totalsByCategory || {})
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([k, v]) => ({ category: k, amount: v })),
  } : null;

  // Include recent emotional check-ins (last 7 days)
  const recentCheckins = checkins.slice(0, 7).map(c => ({
    date: c.date_of_checkin,
    emotions: [c.emotion1, c.emotion2, c.emotion3],
    stress: c.stress,
    event: c.life_event_summary,
    spending_flag: c.financial_flags,
  }));

  console.log('Recent checkins for prompt:', recentCheckins);

  const user = `Analyze these spending patterns and health signals:

Insights from dashboard (${compact.length} detected patterns):
${JSON.stringify(compact, null, 2)}

Health summary: ${JSON.stringify(healthData)}

Spending summary: ${JSON.stringify(spendingData)}

Emotional check-ins (last ${recentCheckins.length} days):
${JSON.stringify(recentCheckins, null, 2)}

Provide a detailed analysis in JSON format:
{
  "summary": "2-3 sentences: main pattern and its significance, especially emotional triggers",
  "what_drove_spending": ["4-5 specific drivers with emotional and lifestyle context"],
  "what_to_try_next": ["4-5 actionable suggestions to reduce unnecessary spending, considering emotional patterns"],
  "high_spend_day_story": ["2-3 detailed insights on high-spend triggers (emotions, stress, events) and alternatives"],
  "caveat": "Note on correlation vs causation and data limitations"
}`;

  try {
    const client = new Dedalus({
      apiKey,
    });

    const completion = await client.chat.completions.create({
      model: 'openai/gpt-5-nano',
      messages: [
        { role: 'system', content: system.trim() },
        { role: 'user', content: user.trim() },
      ],
      temperature: 0.4,
    });

    const text = completion.choices?.[0]?.message?.content ?? '';
    const parsed = safeJsonParse(text);

    if (!parsed) {
      return NextResponse.json(
        {
          error: 'Model did not return valid JSON.',
          raw: text,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('Dedalus API error:', err);

    return NextResponse.json(
      {
        error: err?.message ?? 'Connection error.',
        hint:
          "If you set Dedalus environment to 'development', remove it. Confirm DEDALUS_API_KEY is set, then restart dev server.",
      },
      { status: 502 }
    );
  }
}
