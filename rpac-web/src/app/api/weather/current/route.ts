import { NextRequest, NextResponse } from 'next/server';

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

    // Fetch real weather data from SMHI API
    const smhiResponse = await fetch(
      `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${lon}/lat/${lat}/data.json`
    );

    if (!smhiResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch weather data from SMHI' },
        { status: smhiResponse.status }
      );
    }

    const smhiData = await smhiResponse.json();
    return NextResponse.json(smhiData);

  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
