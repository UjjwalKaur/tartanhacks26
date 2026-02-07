import { NextRequest, NextResponse } from 'next/server';
import { CheckinInputSchema } from '@/types/checkin';
import { extractCheckinStructure } from '@/lib/dedalusCheckin';
import { getAllCheckins, appendCheckin } from '@/lib/checkinPersistence';

export async function GET() {
  try {
    const checkins = await getAllCheckins();
    return NextResponse.json({ checkins }, { status: 200 });
  } catch (error) {
    console.error('Error fetching checkins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checkins' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = CheckinInputSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { date_of_checkin, text_entry } = validation.data;

    // Extract structured fields using Dedalus
    const checkin = await extractCheckinStructure(date_of_checkin, text_entry);

    // Append to persistent storage
    const savedCheckin = await appendCheckin(checkin);

    return NextResponse.json({ checkin: savedCheckin }, { status: 201 });
  } catch (error) {
    console.error('Error creating checkin:', error);
    return NextResponse.json(
      { error: 'Failed to create checkin' },
      { status: 500 }
    );
  }
}
