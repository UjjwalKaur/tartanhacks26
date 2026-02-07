import Dedalus from 'dedalus-labs';
import { Checkin, CheckinSchema } from '@/types/checkin';

function getDefaultCheckin(dateOfCheckin: string): Checkin {
  return {
    date_of_checkin: dateOfCheckin,
    emotion1: 'neutral',
    emotion2: 'calm',
    emotion3: 'focused',
    stress: 5,
    life_event_summary: 'Regular day',
    financial_flags: 'baseline_spending',
  };
}

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

function normalizeFinancialFlag(flag: string): 'baseline_spending' | 'impulse_spending' | 'comfort_spending' | 'small_reward_purchase' | 'gift_spending' | 'increased_future_planning' | 'other' {
  const validFlags = ['baseline_spending', 'impulse_spending', 'comfort_spending', 'small_reward_purchase', 'gift_spending', 'increased_future_planning', 'other'];
  const normalized = flag.toLowerCase().replace(/[\s_]+/g, '_');
  return (validFlags.includes(normalized) ? normalized : 'other') as any;
}

export async function extractCheckinStructure(
  dateOfCheckin: string,
  textEntry: string
): Promise<Checkin> {
  const apiKey = process.env.DEDALUS_API_KEY;

  if (!apiKey) {
    console.warn('DEDALUS_API_KEY not set; using default structure');
    return getDefaultCheckin(dateOfCheckin);
  }

  try {
    const prompt = `You are a mental health sentiment analyzer that correlates emotional states with spending patterns.
    
Given this check-in entry, extract structured mental health and spending signals. Return ONLY valid JSON (no markdown, no explanation).

Date: ${dateOfCheckin}
Check-in text: "${textEntry}"

Return JSON with these exact fields (MUST be valid JSON):
{
  "emotion1": "primary emotion (one word: happy, stressed, anxious, calm, sad, energetic, tired, overwhelmed, relieved, irritable, or burnt_out)",
  "emotion2": "secondary emotion (one word from same list)",
  "emotion3": "tertiary emotion (one word from same list)",
  "stress": <integer 0-10 where 0=no stress, 10=maximum stress>,
  "life_event_summary": "brief one-line summary of life events mentioned (max 100 chars, use underscores for spaces if needed)",
  "financial_flags": "<EXACTLY one of: baseline_spending, impulse_spending, comfort_spending, small_reward_purchase, gift_spending, increased_future_planning, or other>"
}

Guidelines:
- Be concise and factual
- Emotions MUST be single words with underscores for compound words (use burnt_out not burnt out)
- Focus on spending-emotion correlations
- financial_flags must be EXACTLY one of the enum values (use underscores, lowercase)
- Return ONLY the JSON object, nothing else`;

    const client = new Dedalus({
      apiKey,
    });

    const completion = await client.chat.completions.create({
      model: 'openai/gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      console.warn('Empty response from Dedalus');
      return getDefaultCheckin(dateOfCheckin);
    }

    console.log('Dedalus response:', content);

    const parsed = safeJsonParse(content);
    if (!parsed) {
      console.warn('Failed to parse Dedalus response:', content);
      return getDefaultCheckin(dateOfCheckin);
    }

    // Validate and sanitize with Zod
    const result = CheckinSchema.safeParse({
      date_of_checkin: dateOfCheckin,
      emotion1: (parsed.emotion1 || 'neutral').toLowerCase().replace(/[\s_]+/g, '_').slice(0, 50),
      emotion2: (parsed.emotion2 || 'calm').toLowerCase().replace(/[\s_]+/g, '_').slice(0, 50),
      emotion3: (parsed.emotion3 || 'focused').toLowerCase().replace(/[\s_]+/g, '_').slice(0, 50),
      stress: Math.max(0, Math.min(10, Math.round(parsed.stress ?? 5))),
      life_event_summary: (parsed.life_event_summary || 'Regular day').replace(/_/g, ' ').slice(0, 500),
      financial_flags: normalizeFinancialFlag(parsed.financial_flags || 'other'),
    });

    if (!result.success) {
      console.warn('Zod validation failed:', result.error);
      return getDefaultCheckin(dateOfCheckin);
    }

    return result.data;
  } catch (error) {
    console.error('Error extracting checkin structure:', error);
    return getDefaultCheckin(dateOfCheckin);
  }
}
