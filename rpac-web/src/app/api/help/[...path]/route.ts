/**
 * API Route: /api/help/[...path]
 * 
 * Serves markdown help documentation files for KRISter context-aware help system.
 * Source of truth lives in GitHub. This route proxies markdown from the repo
 * to enable immediate visibility after commits (no redeploy needed).
 *
 * Examples:
 * - GET /api/help/dashboard -> GitHub: rpac-web/public/help/dashboard.md
 * - GET /api/help/individual/resources -> GitHub: rpac-web/public/help/individual/resources.md
 * - GET /api/help/local/home -> GitHub: rpac-web/public/help/local/home.md
 */

import { NextRequest, NextResponse } from 'next/server';

// Edge runtime required for Cloudflare Pages
export const runtime = 'edge';

// Map of valid help file paths (for security)
// NOTE: Only include files that actually exist in rpac-web/public/help/
const VALID_HELP_FILES = [
  'dashboard',
  // Individual
  'individual/overview',
  'individual/resources',
  'individual/cultivation',
  'individual/knowledge',
  'individual/coach',
  'individual/contacts',
  'individual/plan',
  // Local
  'local/home',
  'local/discover',
  'local/activity',
  'local/resources-shared',
  'local/resources-owned',
  'local/resources-help',
  'local/messages-community',
  'local/messages-direct',
  'local/admin',
  // Regional
  'regional/overview',
  // Settings
  'settings/profile',
  'settings/security',
  'settings/account',
  'settings/privacy',
  'settings/notifications',
  'settings/preferences',
  // Admin
  'admin/overview',
  'admin/super-admin',
  // Auth
  'auth/login',
  'auth/register',
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  let filePath = '';
  try {
    // Await params as they are now a Promise in Next.js 15+
    const resolvedParams = await params;
    
    // Reconstruct and normalize file path from dynamic segments
    const segments = (resolvedParams.path || []).filter(s => s && s.trim() !== '');
    filePath = segments.join('/');

    console.log('[HelpAPI] Request for:', filePath);

    // Security: Validate that the requested file is in the allowed list
    if (!VALID_HELP_FILES.includes(filePath)) {
      console.log('[HelpAPI] File not in whitelist:', filePath);
      return NextResponse.json(
        { error: 'Help file not found', path: filePath },
        { status: 404 }
      );
    }

    // Build GitHub raw URL
    const owner = process.env.GITHUB_OWNER || 'peka01';
    const repo = process.env.GITHUB_REPO || 'RPAC';
    const branch = process.env.GITHUB_BRANCH || 'main';
    const repoHelpRoot = process.env.GITHUB_HELP_DIR || 'rpac-web/public/help';
    
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${repoHelpRoot}/${filePath}.md`;

    let content: string | null = null;

    // ALWAYS fetch from GitHub raw URL - this is the source of truth
    // Using raw.githubusercontent.com directly (no auth needed, works in edge runtime)
    console.log('[HelpAPI] Fetching from GitHub raw URL for:', filePath);
    console.log('[HelpAPI] Full URL:', rawUrl);
    
    try {
      // Simple fetch with cache busting
      const cacheBustUrl = `${rawUrl}?t=${Date.now()}`;
      console.log('[HelpAPI] Fetching with cache bust:', cacheBustUrl);
      
      const response = await fetch(cacheBustUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'BeReady-Help-System',
        },
      });
      
      console.log('[HelpAPI] Response status:', response.status);
      console.log('[HelpAPI] Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
      
      if (response.ok) {
        content = await response.text();
        console.log('[HelpAPI] Successfully fetched from GitHub, length:', content?.length || 0);
      } else {
        const errorText = await response.text();
        console.error('[HelpAPI] GitHub fetch failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 200)
        });
      }
    } catch (error) {
      console.error('[HelpAPI] GitHub fetch exception:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }

    if (!content) {
      console.error('[HelpAPI] All fetch attempts failed for:', filePath);
      return NextResponse.json(
        { error: 'Help file could not be read from any source', path: filePath },
        { status: 404 }
      );
    }

    console.log('[HelpAPI] Successfully loaded help file:', filePath);
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
    
  } catch (error) {
    console.error('[HelpAPI] Error loading help file:', filePath, error);
    console.error('[HelpAPI] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        path: filePath
      },
      { status: 500 }
    );
  }
}