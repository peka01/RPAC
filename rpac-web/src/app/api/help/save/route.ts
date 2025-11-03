import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const GITHUB_OWNER = 'peka01';
const GITHUB_REPO = 'RPAC';

export async function POST(request: NextRequest) {
  try {
    const { path, content, branch, message } = await request.json();

    if (!path || !content || !branch || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.error('GITHUB_TOKEN environment variable is not set');
      return NextResponse.json(
        { 
          error: 'GitHub integration not configured', 
          details: 'GITHUB_TOKEN environment variable is missing. Add it to .env.local to enable GitHub commits.'
        },
        { status: 500 }
      );
    }

    // Get current file SHA (required for update)
    let sha: string | undefined;
    try {
      const getResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${branch}`,
        {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github+json',
          },
        }
      );

      if (getResponse.ok) {
        const fileData = await getResponse.json();
        sha = fileData.sha;
      }
    } catch (error) {
      // File doesn't exist yet, that's okay for new files
      console.log('File not found, creating new file');
    }

    // Create or update file
    const updateResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          content: btoa(unescape(encodeURIComponent(content))), // Edge-compatible base64 encoding
          branch,
          ...(sha && { sha }), // Include SHA if updating existing file
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.text();
      console.error('GitHub API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to save file to GitHub', details: errorData },
        { status: updateResponse.status }
      );
    }

    const result = await updateResponse.json();

    return NextResponse.json({
      success: true,
      commit: result.commit,
      content: result.content,
    });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
