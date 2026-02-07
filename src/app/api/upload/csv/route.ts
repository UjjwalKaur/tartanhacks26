import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { analyzeSpending, type Transaction } from '@/lib/spendingAnalytics';

const UPLOADS_DIR = join(process.cwd(), '.data', 'uploads');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const domain = formData.get('domain') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!domain || !['finance', 'mental', 'physical'].includes(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain' },
        { status: 400 }
      );
    }

    // Validate file type - accept JSON
    if (!file.name.endsWith('.json')) {
      return NextResponse.json(
        { error: 'Only JSON files are supported' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    if (!existsSync(UPLOADS_DIR)) {
      await mkdir(UPLOADS_DIR, { recursive: true });
    }

    // Create domain-specific subdirectory
    const domainDir = join(UPLOADS_DIR, domain);
    if (!existsSync(domainDir)) {
      await mkdir(domainDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = Date.now();
    const filename = `${domain}_${timestamp}_${file.name}`;
    const filepath = join(domainDir, filename);

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate JSON format
    let jsonData: any;
    try {
      const jsonContent = buffer.toString('utf-8');
      jsonData = JSON.parse(jsonContent);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      );
    }

    // Save file
    await writeFile(filepath, buffer);

    // Extract transactions and analyze
    let transactions: Transaction[] = [];
    let transactionCount = 0;
    let analytics = null;

    if (Array.isArray(jsonData)) {
      transactions = jsonData;
      transactionCount = jsonData.length;
    } else if (jsonData.transactions && Array.isArray(jsonData.transactions)) {
      transactions = jsonData.transactions;
      transactionCount = jsonData.transactions.length;
    } else if (jsonData.data && Array.isArray(jsonData.data)) {
      transactions = jsonData.data;
      transactionCount = jsonData.data.length;
    }

    // Analyze spending if we have valid transactions
    if (domain === 'finance' && transactions.length > 0) {
      try {
        // Get start and end dates from JSON or use defaults
        let startDate = jsonData.startDate || jsonData.period?.start;
        let endDate = jsonData.endDate || jsonData.period?.end;

        // If no dates provided, calculate from transactions
        if (!startDate || !endDate) {
          const dates = transactions
            .map((t: any) => new Date(t.date).getTime())
            .filter((d: number) => !isNaN(d));
          if (dates.length > 0) {
            startDate = new Date(Math.min(...dates)).toISOString().split('T')[0];
            endDate = new Date(Math.max(...dates)).toISOString().split('T')[0];
          }
        }

        if (startDate && endDate) {
          analytics = analyzeSpending(
            transactions as Transaction[],
            startDate,
            endDate
          );
        }
      } catch (analyticsError) {
        console.error('Error analyzing spending:', analyticsError);
        // Continue without analytics
      }
    }

    // Save metadata
    const metadata = {
      filename,
      domain,
      uploadedAt: new Date().toISOString(),
      transactionCount,
      filepath: filepath,
      originalName: file.name,
    };

    // Log the upload
    console.log(`JSON file uploaded for domain "${domain}":`, metadata);

    return NextResponse.json({
      success: true,
      message: `${transactionCount} transactions uploaded for ${domain}`,
      metadata,
      analytics,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
