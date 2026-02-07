import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { addCheckIn } from '@/lib/database';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const checkInData = await request.json();

    // Validate the check-in data - accept stress/energy format
    if (checkInData.stress === undefined && checkInData.energy === undefined && !checkInData.domain) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save the check-in to database
    const savedCheckIn = addCheckIn(checkInData);

    // Send to Gemini API for analysis (optional, don't fail if it errors)
    let geminiAnalysis = null;
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Analyze this wellness check-in and provide brief, actionable insights:
        Stress Level: ${checkInData.stress || 'N/A'} (1-5)
        Energy Level: ${checkInData.energy || 'N/A'} (1-5)
        Notes: ${checkInData.note || 'No additional notes'}
        
        Provide 1-2 sentences of analysis and a specific recommendation to improve their wellbeing.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        geminiAnalysis = response.text();
      } catch (geminiError) {
        console.error('Gemini API error (non-blocking):', geminiError);
        // Don't fail the whole request - just skip the analysis
        geminiAnalysis = null;
      }
    }

    return NextResponse.json({
      success: true,
      checkIn: savedCheckIn,
      analysis: geminiAnalysis,
    });
  } catch (error) {
    console.error('Error creating check-in:', error);
    return NextResponse.json(
      { error: 'Failed to create check-in' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // This endpoint would return all check-ins if needed
    return NextResponse.json({
      message: 'Use POST to create a check-in',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    );
  }
}
