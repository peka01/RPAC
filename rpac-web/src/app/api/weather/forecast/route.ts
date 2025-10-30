import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Fetch real forecast data from SMHI API with timeout
    const smhiResponse = await fetch(
      `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${lon}/lat/${lat}/data.json`,
      {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      }
    );

    if (!smhiResponse.ok) {
      // Return empty response instead of error
      return NextResponse.json(
        { timeSeries: [] },
        { status: 200 }
      );
    }

    const smhiData = await smhiResponse.json();
    return NextResponse.json(smhiData);

  } catch (error) {
    // Return empty response instead of 500 error
    return NextResponse.json(
      { timeSeries: [] },
      { status: 200 }
    );
  }
}
