import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const county = searchParams.get('county');

    console.log('Fetching SMHI warnings...');

    // Try to fetch real warnings from SMHI API
    try {
      const smhiResponse = await fetch(
        'https://opendata-download-warnings.smhi.se/api/version/2/alerts/active.json',
        {
          headers: {
            'User-Agent': 'RPAC Weather Service/1.0',
            'Accept': 'application/json'
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(10000) // 10 second timeout
        }
      );

      console.log('SMHI response status:', smhiResponse.status);

      if (smhiResponse.ok) {
        const warningData = await smhiResponse.json();
        console.log('SMHI warnings data received:', warningData);

        // Filter by county if provided
        if (county && warningData.warnings) {
          const filteredWarnings = warningData.warnings.filter((warning: any) =>
            warning.area && warning.area.name && 
            warning.area.name.toLowerCase() === county.toLowerCase()
          );
          return NextResponse.json({
            ...warningData,
            warnings: filteredWarnings
          });
        }

        return NextResponse.json(warningData);
      } else {
        console.error('SMHI API error:', smhiResponse.status, smhiResponse.statusText);
      }
    } catch (smhiError) {
      console.error('SMHI API fetch error:', smhiError);
    }

    // Fallback: Return empty warnings if SMHI API is not available
    console.log('Returning empty warnings as fallback');
    return NextResponse.json({
      warnings: [],
      metadata: {
        updated: new Date().toISOString(),
        source: 'fallback'
      }
    });

  } catch (error) {
    console.error('Warnings API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
