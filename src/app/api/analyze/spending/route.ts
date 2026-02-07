import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const UPLOADS_DIR = join(process.cwd(), '.data', 'uploads', 'finance');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface Transaction {
  date: string;
  amount: number;
  category: string;
  name?: string;
  merchant?: string;
  group?: string;
  description?: string;
  payment_channel?: string;
}

interface SpendingAnalysis {
  summary: string;
  patterns: string[];
  intent: string;
  categoryBreakdown: Record<string, number>;
  topMerchants: Array<{ merchant: string; total: number; frequency: number }>;
  insights: string[];
  recommendations: string[];
}

async function getLatestTransactionFile(): Promise<{ path: string; data: Transaction[] } | null> {
  if (!existsSync(UPLOADS_DIR)) {
    return null;
  }

  try {
    const files = await readdir(UPLOADS_DIR);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    if (jsonFiles.length === 0) {
      return null;
    }

    // Sort by timestamp (files are named: domain_timestamp_name.json)
    const sortedFiles = jsonFiles.sort((a, b) => {
      const aTimestamp = parseInt(a.split('_')[1]);
      const bTimestamp = parseInt(b.split('_')[1]);
      return bTimestamp - aTimestamp;
    });

    const latestFile = sortedFiles[0];
    const filepath = join(UPLOADS_DIR, latestFile);

    const fileContent = await readFile(filepath, 'utf-8');
    let transactions: Transaction[] = [];

    try {
      const data = JSON.parse(fileContent);
      if (Array.isArray(data)) {
        transactions = data;
      } else if (data.transactions && Array.isArray(data.transactions)) {
        transactions = data.transactions;
      } else if (data.data && Array.isArray(data.data)) {
        transactions = data.data;
      }
    } catch (parseError) {
      return null;
    }

    return { path: filepath, data: transactions };
  } catch (error) {
    console.error('Error reading transaction files:', error);
    return null;
  }
}

function analyzeTransactionData(transactions: Transaction[]): {
  categoryBreakdown: Record<string, number>;
  topMerchants: Array<{ merchant: string; total: number; frequency: number }>;
  totalSpent: number;
  transactionCount: number;
  dateRange: { start: string; end: string };
} {
  const categoryBreakdown: Record<string, number> = {};
  const merchantMap: Record<string, { total: number; frequency: number }> = {};
  let totalSpent = 0;
  const dates = new Set<string>();

  transactions.forEach((tx) => {
    // Skip income transactions
    if (tx.amount < 0) {
      return;
    }

    const category = tx.category || tx.group || 'Other';
    categoryBreakdown[category] = (categoryBreakdown[category] || 0) + tx.amount;

    const merchant = tx.merchant || tx.name || 'Unknown';
    if (!merchantMap[merchant]) {
      merchantMap[merchant] = { total: 0, frequency: 0 };
    }
    merchantMap[merchant].total += tx.amount;
    merchantMap[merchant].frequency += 1;

    totalSpent += tx.amount;
    dates.add(tx.date);
  });

  const sortedDates = Array.from(dates).sort();
  const topMerchants = Object.entries(merchantMap)
    .map(([merchant, data]) => ({ merchant, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  return {
    categoryBreakdown,
    topMerchants,
    totalSpent,
    transactionCount: transactions.length,
    dateRange: {
      start: sortedDates[0] || 'N/A',
      end: sortedDates[sortedDates.length - 1] || 'N/A',
    },
  };
}

async function analyzeWithGemini(
  transactions: Transaction[],
  analysis: ReturnType<typeof analyzeTransactionData>
): Promise<SpendingAnalysis | null> {
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not set, returning null analysis');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Using gemini-pro model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Analyze the following spending data and provide psychological insights about the user's spending behavior and intent.

TRANSACTION DATA:
- Date Range: ${analysis.dateRange.start} to ${analysis.dateRange.end}
- Total Transactions: ${analysis.transactionCount}
- Total Spent: $${analysis.totalSpent.toFixed(2)}
- Category Breakdown: ${JSON.stringify(analysis.categoryBreakdown, null, 2)}
- Top Merchants: ${analysis.topMerchants.map((m) => `${m.merchant} ($${m.total.toFixed(2)}, ${m.frequency} times)`).join('; ')}

Please provide:
1. A brief summary of the spending patterns (2-3 sentences)
2. 3-4 specific patterns you observe (e.g., "Frequent small coffee purchases suggest daily stress relief", "Regular dining delivery indicates busy schedule or reduced cooking")
3. The underlying intent/psychology behind their spending (why are they spending this way?)
4. 3-4 actionable insights
5. 2-3 personalized recommendations based on their spending behavior

Format your response as JSON with these exact keys:
{
  "summary": "...",
  "patterns": ["pattern1", "pattern2", "pattern3", "pattern4"],
  "intent": "...",
  "insights": ["insight1", "insight2", "insight3", "insight4"],
  "recommendations": ["rec1", "rec2", "rec3"]
}`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('Could not extract JSON from Gemini response');
      return null;
    }

    const geminiAnalysis = JSON.parse(jsonMatch[0]);

    return {
      summary: geminiAnalysis.summary || '',
      patterns: geminiAnalysis.patterns || [],
      intent: geminiAnalysis.intent || '',
      categoryBreakdown: analysis.categoryBreakdown,
      topMerchants: analysis.topMerchants,
      insights: geminiAnalysis.insights || [],
      recommendations: geminiAnalysis.recommendations || [],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Gemini API error:', errorMessage);
    console.error('Full error object:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('[/api/analyze/spending] GET request received');
    
    // Fetch latest uploaded transaction file
    const fileData = await getLatestTransactionFile();
    console.log('[/api/analyze/spending] getLatestTransactionFile result:', fileData ? `Found ${fileData.data.length} transactions` : 'No file found');

    if (!fileData) {
      return NextResponse.json(
        {
          error: 'No transaction data found',
          message: 'Please upload a transaction JSON file from the Finance drawer first',
        },
        { status: 404 }
      );
    }

    console.log(`Analyzing ${fileData.data.length} transactions from file: ${fileData.path}`);

    // Analyze transaction data
    const analysis = analyzeTransactionData(fileData.data);
    console.log('Transaction analysis complete:', {
      categoryCount: Object.keys(analysis.categoryBreakdown).length,
      totalSpent: analysis.totalSpent,
      merchantCount: analysis.topMerchants.length,
    });

    // Get Gemini AI analysis (this can fail gracefully)
    console.log('Attempting Gemini API analysis...');
    const geminiAnalysis = await analyzeWithGemini(fileData.data, analysis);

    if (!geminiAnalysis) {
      console.warn('Gemini analysis failed, returning basic analysis only');
    }

    return NextResponse.json({
      success: true,
      transactions: fileData.data,
      data: {
        file: fileData.path,
        transactionCount: fileData.data.length,
        analysis: geminiAnalysis,
        basicAnalysis: {
          categoryBreakdown: analysis.categoryBreakdown,
          topMerchants: analysis.topMerchants,
          totalSpent: analysis.totalSpent,
          dateRange: analysis.dateRange,
        },
      },
    });
  } catch (error) {
    console.error('Error analyzing spending:', error);
    return NextResponse.json(
      { error: 'Failed to analyze spending data' },
      { status: 500 }
    );
  }
}
