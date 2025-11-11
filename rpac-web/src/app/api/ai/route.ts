/**
 * OpenAI Proxy API Route
 * 
 * This replaces the Cloudflare Worker at api.beready.se
 * Handles AI requests from KRISter and other components
 * 
 * Deployed on Vercel Edge Runtime for low latency
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Check both possible environment variable names
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    // Check API key
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { prompt, type = 'general' } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Determine model and settings based on type
    const model = type === 'example-questions' ? 'gpt-4o-mini' : 'gpt-4o-mini';
    const temperature = type === 'example-questions' ? 0.7 : 0.8;
    const maxTokens = type === 'example-questions' ? 200 : 1000;

    // Call OpenAI API
    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'AI service error', details: errorData },
        { status: openaiResponse.status }
      );
    }

    const data = await openaiResponse.json();

    // Return response in format expected by openai-worker-service.ts
    return NextResponse.json({
      choices: data.choices,
      response: data.choices?.[0]?.message?.content || '',
      model: data.model,
      usage: data.usage
    });

  } catch (error) {
    console.error('AI API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    service: 'RPAC AI API',
    version: '1.0',
    timestamp: new Date().toISOString(),
    configured: !!OPENAI_API_KEY
  });
}
