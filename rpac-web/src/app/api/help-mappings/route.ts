import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

interface RouteMapping {
  route: string;
  params: string;
  helpFile: string;
}

const MAPPINGS_FILE = path.join(process.cwd(), 'config', 'help-mappings.json');

/**
 * GET /api/help-mappings
 * Load route mappings from persistent storage
 */
export async function GET() {
  try {
    // Check if mappings file exists
    if (fs.existsSync(MAPPINGS_FILE)) {
      const fileContent = fs.readFileSync(MAPPINGS_FILE, 'utf-8');
      const mappings: RouteMapping[] = JSON.parse(fileContent);
      return NextResponse.json({ mappings }, { status: 200 });
    }

    // Return empty array if file doesn't exist yet
    return NextResponse.json({ mappings: [] }, { status: 200 });
  } catch (error) {
    console.error('Error loading help mappings:', error);
    return NextResponse.json(
      { error: 'Failed to load mappings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/help-mappings
 * Save route mappings to persistent storage
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mappings } = body as { mappings: RouteMapping[] };

    if (!Array.isArray(mappings)) {
      return NextResponse.json(
        { error: 'Invalid request: mappings must be an array' },
        { status: 400 }
      );
    }

    // Validate mappings structure
    for (const mapping of mappings) {
      if (!mapping.route || !mapping.helpFile) {
        return NextResponse.json(
          { error: 'Invalid mapping: route and helpFile are required' },
          { status: 400 }
        );
      }
    }

    // Ensure config directory exists
    const configDir = path.dirname(MAPPINGS_FILE);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Write mappings to file
    fs.writeFileSync(MAPPINGS_FILE, JSON.stringify(mappings, null, 2), 'utf-8');

    return NextResponse.json(
      { success: true, message: `Saved ${mappings.length} mappings` },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving help mappings:', error);
    return NextResponse.json(
      { error: 'Failed to save mappings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
