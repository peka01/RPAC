/**
 * API Route: /api/help-edit
 *
 * Commits edits to KRISter help markdown files directly in GitHub.
 * Uses a whitelist of allowed file paths for safety.
 *
 * Security:
 * - Requires Authorization: Bearer <ADMIN_HELP_EDIT_TOKEN>
 * - Requires GitHub token with repo contents:write
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Reuse the same whitelist as the read route
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

function isAllowedPath(path: string): boolean {
  return VALID_HELP_FILES.includes(path);
}

function base64EncodeUtf8(str: string): string {
  // Edge-safe UTF-8 -> base64
  // eslint-disable-next-line no-undef
  return btoa(unescape(encodeURIComponent(str)));
}

export async function PUT(request: NextRequest) {
  try {
    const adminHeader = request.headers.get('authorization') || '';
    const expected = process.env.ADMIN_HELP_EDIT_TOKEN;
    if (!expected || !adminHeader.startsWith('Bearer ') || adminHeader.substring(7) !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null) as { path?: string; content?: string; message?: string } | null;
    if (!body || typeof body.path !== 'string' || typeof body.content !== 'string') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const filePath = body.path.replace(/\.md$/, '');
    if (!isAllowedPath(filePath)) {
      return NextResponse.json({ error: 'Help file not allowed', path: filePath }, { status: 400 });
    }

    const owner = process.env.GITHUB_OWNER || 'beready-se';
    const repo = process.env.GITHUB_REPO || 'RPAC';
    const branch = process.env.GITHUB_BRANCH || 'main';
    const repoHelpRoot = process.env.GITHUB_HELP_DIR || 'rpac-web/public/help';
    const ghToken = process.env.GITHUB_TOKEN;
    if (!ghToken) {
      return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
    }

    const fileFullPath = `${repoHelpRoot}/${filePath}.md`;
    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${fileFullPath}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${ghToken}`,
      'Accept': 'application/vnd.github+json',
    };

    // 1) Get current SHA (if file exists)
    let sha: string | undefined;
    const getResp = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, { headers });
    if (getResp.ok) {
      const json = await getResp.json();
      sha = json.sha;
    } else if (getResp.status !== 404) {
      const errText = await getResp.text();
      return NextResponse.json({ error: 'Failed to read current file', details: errText }, { status: 502 });
    }

    // 2) Commit new content
    const commitMessage = body.message || `KRISter help edit: ${filePath}`;
    const payload = {
      message: commitMessage,
      content: base64EncodeUtf8(body.content),
      branch,
      sha,
    };

    const putResp = await fetch(apiBase, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!putResp.ok) {
      const err = await putResp.text();
      return NextResponse.json({ error: 'GitHub commit failed', details: err }, { status: 502 });
    }

    const result = await putResp.json();

    return NextResponse.json({ ok: true, path: filePath, commit: result.commit?.sha }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Help edit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}




