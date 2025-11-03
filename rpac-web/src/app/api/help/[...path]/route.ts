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
    
    // Reconstruct and normalize file path from dynamic segments
    const segments = (resolvedParams.path || []).filter(s => s && s.trim() !== '');
    const filePath = segments.join('/');

    // Security: Validate that the requested file is in the allowed list
    if (!VALID_HELP_FILES.includes(filePath)) {
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
    
    // Use GitHub API instead of raw.githubusercontent.com for better cache control
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${repoHelpRoot}/${filePath}.md?ref=${branch}`;
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${repoHelpRoot}/${filePath}.md`;

    const ghToken = process.env.GITHUB_TOKEN;

    const ghHeaders: Record<string, string> = {
      'Accept': 'application/vnd.github.raw+json', // Get raw content directly from API
      // Cache-busting headers to get fresh content from GitHub
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    };
    if (ghToken) {
      ghHeaders['Authorization'] = `Bearer ${ghToken}`;
    }

    let content: string | null = null;

    // Try GitHub API first (better cache control)
    try {
      const ghResp = await fetch(apiUrl, { 
        headers: ghHeaders,
        cache: 'no-store' // Force no caching in fetch itself
      });
      if (ghResp.ok) {
        content = await ghResp.text();
      }
    } catch (apiError) {
      // Silently fall back to raw URL
    }

    // Fallback to raw URL if API fails
    if (!content) {
      // Add cache-busting timestamp to URL for GitHub CDN
      const cacheBustUrl = `${rawUrl}?t=${Date.now()}`;
      const ghResp = await fetch(cacheBustUrl, { 
        headers: ghHeaders,
        cache: 'no-store'
      });
      if (ghResp.ok) {
        content = await ghResp.text();
      } else {
        // Fallback to local public asset in dev or when repo is private
        const url = new URL(request.url);
        const localUrl = `${url.origin}/help/${filePath}.md`;
        const localResp = await fetch(localUrl);
        if (localResp.ok) {
          content = await localResp.text();
        }
      }
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Help file could not be read from GitHub or local', path: filePath },
        { status: 404 }
      );
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
    
  } catch (error) {
    console.error('Error loading help file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
