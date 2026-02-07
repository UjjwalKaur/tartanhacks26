import { Checkin } from '@/types/checkin';
import { Transaction } from '@/types/schemas';

const DISCRETIONARY_CATEGORIES = ['Dining', 'Shopping', 'Entertainment', 'Delivery/Rideshare'];
const RISK_EMOTIONS = ['stressed', 'anxious', 'sad', 'lonely', 'fatigued', 'overwhelmed', 'frustrated'];
const PHRASE_SEPARATORS = /[,;.!?\s]+and\s+|[,;.!?\s]+but\s+|[,;.!?\s]+because\s+|[,;.!?\s]+so\s+|[,;.!?\s]+then\s+|[,;.!?]/;
const GENERIC_PHRASES = new Set([
  'regular day',
  'normal day',
  'nothing happened',
  'felt',
  'over',
  'day',
  'time',
  'work',
  'home',
  'today',
  'just',
]);

export interface MajorLifeEvent {
  phrase: string;
  spend: number;
  mentions: number;
}

export interface MentalHealthMetrics {
  stressSpendingComparison: {
    highStressAvgSpend: number;
    lowStressAvgSpend: number;
    difference: number;
    differencePercent: number;
  };
  spendByFinancialFlags: Array<{
    flag: string;
    avgDiscretionarySpend: number;
    count: number;
  }>;
  emotionalRiskAnalysis: {
    riskEmotionDaysAvgSpend: number;
    nonRiskEmotionDaysAvgSpend: number;
    difference: number;
    differencePercent: number;
  };
  topLifeEventKeywords: Array<{
    keyword: string;
    totalSpend: number;
    dayCount: number;
  }>;
  majorLifeEvents: MajorLifeEvent[];
}

export function computeMentalHealthMetrics(
  checkins: Checkin[],
  transactions: Transaction[]
): MentalHealthMetrics {
  // Create a map of transactions by date
  const txByDate: Record<string, Transaction[]> = {};
  transactions.forEach((tx) => {
    const date = tx.date.split('T')[0]; // YYYY-MM-DD format
    if (!txByDate[date]) {
      txByDate[date] = [];
    }
    txByDate[date].push(tx);
  });

  // Helper: get discretionary spend for a date
  const getDiscretionarySpendForDate = (date: string): number => {
    const dayTx = txByDate[date] || [];
    return dayTx
      .filter((tx) => DISCRETIONARY_CATEGORIES.includes(tx.category))
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  };

  // 1. Stress vs Spend Comparison
  const highStressDays = checkins.filter((c) => c.stress >= 6);
  const lowStressDays = checkins.filter((c) => c.stress < 6);

  const highStressSpends = highStressDays.map((c) =>
    getDiscretionarySpendForDate(c.date_of_checkin)
  );
  const lowStressSpends = lowStressDays.map((c) =>
    getDiscretionarySpendForDate(c.date_of_checkin)
  );

  const highStressAvgSpend =
    highStressSpends.length > 0
      ? highStressSpends.reduce((a, b) => a + b, 0) / highStressSpends.length
      : 0;
  const lowStressAvgSpend =
    lowStressSpends.length > 0
      ? lowStressSpends.reduce((a, b) => a + b, 0) / lowStressSpends.length
      : 0;

  const stressSpendingComparison = {
    highStressAvgSpend: parseFloat(highStressAvgSpend.toFixed(2)),
    lowStressAvgSpend: parseFloat(lowStressAvgSpend.toFixed(2)),
    difference: parseFloat((highStressAvgSpend - lowStressAvgSpend).toFixed(2)),
    differencePercent: parseFloat(
      (
        lowStressAvgSpend > 0
          ? ((highStressAvgSpend - lowStressAvgSpend) / lowStressAvgSpend) * 100
          : 0
      ).toFixed(1)
    ),
  };

  // 2. Spend by Financial Flags
  const flagSpends: Record<string, { total: number; count: number }> = {};
  checkins.forEach((c) => {
    const spend = getDiscretionarySpendForDate(c.date_of_checkin);
    if (!flagSpends[c.financial_flags]) {
      flagSpends[c.financial_flags] = { total: 0, count: 0 };
    }
    flagSpends[c.financial_flags].total += spend;
    flagSpends[c.financial_flags].count += 1;
  });

  const spendByFinancialFlags = Object.entries(flagSpends)
    .map(([flag, data]) => ({
      flag,
      avgDiscretionarySpend: parseFloat((data.total / data.count).toFixed(2)),
      count: data.count,
    }))
    .sort((a, b) => b.avgDiscretionarySpend - a.avgDiscretionarySpend);

  // 3. Risk Emotion Analysis
  const riskEmotionDays = checkins.filter(
    (c) =>
      RISK_EMOTIONS.includes(c.emotion1.toLowerCase()) ||
      RISK_EMOTIONS.includes(c.emotion2.toLowerCase()) ||
      RISK_EMOTIONS.includes(c.emotion3.toLowerCase())
  );
  const nonRiskEmotionDays = checkins.filter(
    (c) =>
      !RISK_EMOTIONS.includes(c.emotion1.toLowerCase()) &&
      !RISK_EMOTIONS.includes(c.emotion2.toLowerCase()) &&
      !RISK_EMOTIONS.includes(c.emotion3.toLowerCase())
  );

  const riskEmotionSpends = riskEmotionDays.map((c) =>
    getDiscretionarySpendForDate(c.date_of_checkin)
  );
  const nonRiskEmotionSpends = nonRiskEmotionDays.map((c) =>
    getDiscretionarySpendForDate(c.date_of_checkin)
  );

  const riskEmotionDaysAvgSpend =
    riskEmotionSpends.length > 0
      ? riskEmotionSpends.reduce((a, b) => a + b, 0) / riskEmotionSpends.length
      : 0;
  const nonRiskEmotionDaysAvgSpend =
    nonRiskEmotionSpends.length > 0
      ? nonRiskEmotionSpends.reduce((a, b) => a + b, 0) / nonRiskEmotionSpends.length
      : 0;

  const emotionalRiskAnalysis = {
    riskEmotionDaysAvgSpend: parseFloat(riskEmotionDaysAvgSpend.toFixed(2)),
    nonRiskEmotionDaysAvgSpend: parseFloat(nonRiskEmotionDaysAvgSpend.toFixed(2)),
    difference: parseFloat(
      (riskEmotionDaysAvgSpend - nonRiskEmotionDaysAvgSpend).toFixed(2)
    ),
    differencePercent: parseFloat(
      (
        nonRiskEmotionDaysAvgSpend > 0
          ? ((riskEmotionDaysAvgSpend - nonRiskEmotionDaysAvgSpend) /
              nonRiskEmotionDaysAvgSpend) *
            100
          : 0
      ).toFixed(1)
    ),
  };

  // 4. Top Life Event Keywords
  const STOPWORDS = new Set([
    'the',
    'and',
    'a',
    'is',
    'to',
    'of',
    'in',
    'was',
    'on',
    'for',
    'it',
    'with',
    'be',
    'i',
    'that',
    'this',
    'my',
    'day',
  ]);

  const keywordSpends: Record<string, { total: number; count: number }> = {};
  checkins.forEach((c) => {
    const words = c.life_event_summary
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w));

    const spend = getDiscretionarySpendForDate(c.date_of_checkin);
    words.forEach((word) => {
      if (!keywordSpends[word]) {
        keywordSpends[word] = { total: 0, count: 0 };
      }
      keywordSpends[word].total += spend;
      keywordSpends[word].count += 1;
    });
  });

  const topLifeEventKeywords = Object.entries(keywordSpends)
    .map(([keyword, data]) => ({
      keyword,
      totalSpend: parseFloat(data.total.toFixed(2)),
      dayCount: data.count,
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, 10);

  // Extract major life events (phrases)
  const phraseMap: Record<string, { spend: number; mentions: number }> = {};
  const processedDates = new Set<string>();

  checkins.forEach((c) => {
    if (!c.life_event_summary || processedDates.has(c.date_of_checkin)) return;
    processedDates.add(c.date_of_checkin);

    const daySpend = getDiscretionarySpendForDate(c.date_of_checkin);
    const text = c.life_event_summary.toLowerCase();
    
    // Split on phrase separators
    const phrases = text
      .split(PHRASE_SEPARATORS)
      .map((p) => p.trim())
      .filter(
        (p) =>
          p.length >= 8 &&
          !GENERIC_PHRASES.has(p) &&
          p.length < 100 &&
          p.split(/\s+/).length <= 5
      );

    phrases.forEach((phrase) => {
      if (!phraseMap[phrase]) {
        phraseMap[phrase] = { spend: 0, mentions: 0 };
      }
      phraseMap[phrase].spend += daySpend;
      phraseMap[phrase].mentions += 1;
    });
  });

  const majorLifeEvents = Object.entries(phraseMap)
    .filter(([_, data]) => data.mentions >= 2)
    .map(([phrase, data]) => ({
      phrase,
      spend: parseFloat(data.spend.toFixed(2)),
      mentions: data.mentions,
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 12);

  return {
    stressSpendingComparison,
    spendByFinancialFlags,
    emotionalRiskAnalysis,
    topLifeEventKeywords,
    majorLifeEvents,
  };
}
