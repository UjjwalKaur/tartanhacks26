import Dedalus from 'dedalus-labs';
import { NextResponse } from 'next/server';

// IMPORTANT: ensure this runs in Node (Dedalus SDK is server-side)
export const runtime = 'nodejs';

type Insight = {
  id: string;
  title: string;
  explanation: string;
  confidence: number; // 0..1
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
    // Sometimes models wrap JSON in text. Try to extract the first {...} block.
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

  let body: { insights?: Insight[] } = {};
  try {
    body = await req.json();
  } catch {
    // ignore
  }

  const insights = body.insights ?? [];

  // If no insights, return a friendly fallback so your UI still works
  if (!insights.length) {
    const fallback: SummaryResponse = {
      summary:
        'No insight data was provided yet. Once you have a few days of transactions + sleep/activity + journal signals, I can summarize your patterns here.',
      what_drove_spending: ['Not enough data yet to identify drivers.'],
      what_to_try_next: ['Add 7–14 days of data, then regenerate the summary.'],
      high_spend_day_story: ['Tip: include at least a few “high spend” days for a compelling demo.'],
      caveat: 'This is a demo summary. Real recommendations improve with more history.'
    };
    return NextResponse.json(fallback);
  }

  // Build a small, privacy-friendly prompt: only send the insight summaries, not raw transactions.
  const compact = insights.map((i) => ({
    title: i.title,
    explanation: i.explanation,
    confidence: i.confidence,
    metric: i.evidence.metric,
    // Keep evidence short
    dates: i.evidence.dates.slice(-14),
    values: i.evidence.values.slice(-14),
  }));

  const system = `
You are a friendly, non-technical financial wellbeing coach.
You explain patterns between spending and lifestyle signals (sleep, activity, mood/journal).
You must be honest: correlations are not causation. Keep it concise and useful.
Return ONLY valid JSON with the requested fields. No markdown.
`;

  const user = `
Given these weekly insights from a personal “finance + health” dashboard:
${JSON.stringify(compact, null, 2)}

Create a personalized summary the user can understand.
Return JSON with this exact schema:

{
  "summary": "2-4 sentences plain English.",
  "what_drove_spending": ["3-6 bullets describing patterns (sleep/exercise/stress/journal -> spending)."],
  "what_to_try_next": ["3-6 specific suggestions the user can try this week."],
  "high_spend_day_story": ["2-4 bullets: what tends to happen on high-spend days + the likely trigger + a better alternative."],
  "caveat": "One sentence about correlation vs causation."
}

Rules:
- Be concrete: mention “late sleep”, “low activity”, “stress journal days”, etc only if supported by the provided insights.
- If evidence is weak, say so and suggest collecting more data.
`;

  try {
    const client = new Dedalus({
      apiKey,
      // Do NOT set environment:'development' unless you know you need it.
      // The README shows it, but production is the default. :contentReference[oaicite:1]{index=1}
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
      // Return raw for debugging (still keeps UI moving)
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
    // Make server logs useful
    console.error('Dedalus error:', err);

    // “Connection error.” typically means network/baseURL/env mismatch, not a parsing bug.
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
