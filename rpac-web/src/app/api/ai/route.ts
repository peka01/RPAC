import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitStore.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { prompt, type = 'general' } = body;
    
    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.length > 4000) {
      return NextResponse.json(
        { error: 'Invalid prompt. Must be a string with max 4000 characters.' },
        { status: 400 }
      );
    }
    
    // Sanitize prompt to prevent injection
    const sanitizedPrompt = prompt
      .replace(/[<>]/g, '') // Remove potential HTML/XML tags
      .trim()
      .substring(0, 4000); // Ensure max length
    
    // Call production AI service
    const response = await fetch('https://api.beready.se', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RPAC-Server/1.0'
      },
      body: JSON.stringify({ 
        prompt: sanitizedPrompt,
        type: type,
        timestamp: new Date().toISOString()
      }),
      // Add timeout
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    if (!response.ok) {
      console.error('AI service error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }
    
    const data = await response.json();
    
    // Log the request for monitoring (without sensitive data)
    console.log(`AI request processed for IP: ${ip}, Type: ${type}, Length: ${sanitizedPrompt.length}`);
    
    return NextResponse.json({
      response: data.choices?.[0]?.message?.content || 'No response generated',
      timestamp: new Date().toISOString(),
      type: type
    });
    
  } catch (error) {
    console.error('AI API error:', error);
    
    // Don't expose internal errors to client
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to send AI requests.' },
    { status: 405 }
  );
}
