/**
 * API Route: /api/help/[...path]
 * 
 * Serves markdown help documentation files for KRISter context-aware help system.
 * Files are stored in rpac-web/docs/help/ directory.
 * 
 * Examples:
 * - GET /api/help/dashboard -> docs/help/dashboard.md
 * - GET /api/help/individual/resources -> docs/help/individual/resources.md
 * - GET /api/help/local/home -> docs/help/local/home.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Remove edge runtime for development - use Node.js runtime to access filesystem
// export const runtime = 'edge';

// Map of valid help file paths (for security)
const VALID_HELP_FILES = [
  'dashboard',
  'individual/resources',
  'individual/cultivation',
  'individual/knowledge',
  'individual/coach',
  'local/home',
  'local/discover',
  'local/activity',
  'local/resources-shared',
  'local/resources-owned',
  'local/resources-help',
  'local/messages-community',
  'local/messages-direct',
  'local/admin',
  'regional/overview',
  'settings/profile',
  'settings/account',
  'settings/privacy',
  'settings/notifications',
  'admin/super-admin',
  'auth/login',
  'auth/register',
];

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the file path from the dynamic segments
    const filePath = params.path.join('/');

    // Security: Validate that the requested file is in the allowed list
    if (!VALID_HELP_FILES.includes(filePath)) {
      return NextResponse.json(
        { error: 'Help file not found', path: filePath },
        { status: 404 }
      );
    }

    // Construct the full file system path
    // In development, use Node.js filesystem
    const docsPath = join(process.cwd(), 'docs', 'help', `${filePath}.md`);
    
    try {
      const content = await readFile(docsPath, 'utf-8');
      
      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      });
    } catch (fileError) {
      console.error('File read error:', fileError);
      return NextResponse.json(
        { error: 'Help file could not be read', path: filePath },
        { status: 404 }
      );
    }
    
  } catch (error) {
    console.error('Error loading help file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
