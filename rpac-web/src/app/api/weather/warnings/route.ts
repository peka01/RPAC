import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const county = searchParams.get('county');

    // Try to fetch real warnings from SMHI's new IBW API
    try {
      const smhiResponse = await fetch(
        'https://opendata-download-warnings.smhi.se/ibww/api/version/1/warning.json',
        {
          headers: {
            'User-Agent': 'RPAC Weather Service/1.0',
            'Accept': 'application/json'
          },
          // Add timeout to prevent hanging
          signal: AbortSignal.timeout(10000) // 10 second timeout
        }
      );

      if (smhiResponse.ok) {
        const warningData = await smhiResponse.json();

        // The new API returns an array of warnings in the 'value' property
        const warnings = warningData.value || warningData || [];

        // Filter by county if provided
        if (county && warnings.length > 0) {
          const filteredWarnings = warnings.filter((warning: any) => {
            // Check if any warning area matches the county
            return warning.warningAreas && warning.warningAreas.some((area: any) => {
              const areaName = area.areaName;
              if (typeof areaName === 'string') {
                return areaName.toLowerCase().includes(county.toLowerCase());
              } else if (areaName && areaName.sv) {
                return areaName.sv.toLowerCase().includes(county.toLowerCase());
              }
              return false;
            });
          });
          
          return NextResponse.json({
            warnings: filteredWarnings,
            metadata: {
              updated: new Date().toISOString(),
              source: 'smhi-ibw-api',
              total: filteredWarnings.length
            }
          });
        }

        return NextResponse.json({
          warnings: warnings,
          metadata: {
            updated: new Date().toISOString(),
            source: 'smhi-ibw-api',
            total: warnings.length
          }
        });
      } else {
        console.error('SMHI API error:', smhiResponse.status, smhiResponse.statusText);
      }
    } catch (smhiError) {
      console.error('SMHI API fetch error:', smhiError);
    }

    // Fallback: Return empty warnings if SMHI API is not available
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
