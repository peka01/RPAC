/**
 * API Route: /api/help/[...path]
 * 
 * Serves markdown help documentation files for KRISter context-aware help system.
 * Files are stored in rpac-web/public/help/ directory.
 * 
 * Examples:
 * - GET /api/help/dashboard -> public/help/dashboard.md
 * - GET /api/help/individual/resources -> public/help/individual/resources.md
 * - GET /api/help/local/home -> public/help/local/home.md
 */

import { NextRequest, NextResponse } from 'next/server';

// Edge runtime required for Cloudflare Pages
export const runtime = 'edge';

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
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await params as they are now a Promise in Next.js 15+
    const resolvedParams = await params;
    
    // Reconstruct the file path from the dynamic segments
    const filePath = resolvedParams.path.join('/');

    // Security: Validate that the requested file is in the allowed list
    if (!VALID_HELP_FILES.includes(filePath)) {
      return NextResponse.json(
        { error: 'Help file not found', path: filePath },
        { status: 404 }
      );
    }

    // Fetch from public directory using origin
    const url = new URL(request.url);
    const helpFileUrl = `${url.origin}/help/${filePath}.md`;
    
    try {
      const response = await fetch(helpFileUrl);
      
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Help file could not be read', path: filePath },
          { status: 404 }
        );
      }
      
      const content = await response.text();
      
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
