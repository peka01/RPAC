import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface RouteMapping {
  route: string;
  params: string;
  helpFile: string;
}

/**
 * GET /api/help-mappings
 * Load route mappings from static configuration file
 */
export async function GET() {
  try {
    // In edge runtime, fetch from the public static file
    // During build/development, this will be available at /config/help-mappings.json
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    const response = await fetch(`${baseUrl}/config/help-mappings.json`, {
      cache: 'no-store' // Always get fresh data
    });
    
    if (!response.ok) {
      // Return default mappings if file doesn't exist
      return NextResponse.json({ mappings: getDefaultMappings() }, { status: 200 });
    }

    const mappings: RouteMapping[] = await response.json();
    return NextResponse.json({ mappings }, { status: 200 });
  } catch (error) {
    console.error('Error loading help mappings:', error);
    // Return default mappings on error
    return NextResponse.json({ mappings: getDefaultMappings() }, { status: 200 });
  }
}

/**
 * POST /api/help-mappings
 * Note: For edge runtime, mappings should be updated via config file in version control
 * This endpoint validates the mappings structure
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

    // For edge runtime, return success with instructions
    return NextResponse.json(
      { 
        success: true, 
        message: `Validated ${mappings.length} mappings. Note: To persist changes, update config/help-mappings.json in version control.`,
        mappings 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error validating help mappings:', error);
    return NextResponse.json(
      { error: 'Failed to validate mappings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getDefaultMappings(): RouteMapping[] {
  return [
    { route: '/dashboard', params: '', helpFile: 'dashboard' },
    { route: '/individual', params: '?section=overview', helpFile: 'individual/overview' },
    { route: '/individual', params: '?section=resources', helpFile: 'individual/resources' },
    { route: '/individual', params: '?section=contacts', helpFile: 'individual/contacts' },
    { route: '/individual', params: '?section=plan', helpFile: 'individual/plan' },
    { route: '/local', params: '?tab=home', helpFile: 'local/home' },
    { route: '/local', params: '?tab=forum', helpFile: 'local/forum' },
    { route: '/local', params: '?tab=resources', helpFile: 'local/resources' },
    { route: '/local', params: '?tab=map', helpFile: 'local/map' },
    { route: '/local', params: '?tab=find', helpFile: 'local/find' },
    { route: '/local', params: '?tab=members', helpFile: 'local/members' },
    { route: '/local', params: '?tab=garden', helpFile: 'local/garden' },
    { route: '/regional', params: '', helpFile: 'regional/overview' },
    { route: '/settings', params: '?tab=profile', helpFile: 'settings/profile' },
    { route: '/settings', params: '?tab=security', helpFile: 'settings/security' },
    { route: '/settings', params: '?tab=notifications', helpFile: 'settings/notifications' },
    { route: '/settings', params: '?tab=privacy', helpFile: 'settings/privacy' },
    { route: '/settings', params: '?tab=preferences', helpFile: 'settings/preferences' },
    { route: '/admin', params: '', helpFile: 'admin/overview' },
    { route: '/login', params: '', helpFile: 'auth/login' },
    { route: '/register', params: '', helpFile: 'auth/register' }
  ];
}
