import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs'; // Need Node.js runtime for file system access

interface SearchResult {
  filePath: string;
  content: string;
  score: number;
  language: string;
}

// Simple semantic search using keyword matching and relevance scoring
async function searchCodebase(query: string, fileTypes: string[], maxResults: number): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const srcDir = path.join(process.cwd(), 'src');
  
  // Extract keywords from query
  const keywords = query.toLowerCase()
    .replace(/[^\w\såäö]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  async function scanDirectory(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules, .next, etc.
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await scanDirectory(fullPath);
          }
        } else if (entry.isFile()) {
          // Check if file type matches
          const ext = path.extname(entry.name).slice(1);
          if (fileTypes.includes(ext)) {
            try {
              const content = await fs.readFile(fullPath, 'utf-8');
              const contentLower = content.toLowerCase();
              
              // Calculate relevance score
              let score = 0;
              
              // Filename match
              const filenameLower = entry.name.toLowerCase();
              keywords.forEach(keyword => {
                if (filenameLower.includes(keyword)) score += 5;
              });
              
              // Content matches (with context)
              keywords.forEach(keyword => {
                const regex = new RegExp(keyword, 'gi');
                const matches = content.match(regex);
                if (matches) {
                  score += matches.length;
                }
              });
              
              // Boost for component files
              if (filenameLower.includes('component') || 
                  filenameLower.includes('widget') || 
                  filenameLower.includes('card')) {
                score += 2;
              }
              
              if (score > 0) {
                // Extract relevant snippet (find first keyword occurrence with context)
                let snippet = content;
                const firstKeyword = keywords.find(k => contentLower.includes(k));
                if (firstKeyword) {
                  const index = contentLower.indexOf(firstKeyword);
                  const start = Math.max(0, index - 200);
                  const end = Math.min(content.length, index + 800);
                  snippet = content.substring(start, end);
                  
                  // Try to start at line boundary
                  const firstNewline = snippet.indexOf('\n');
                  if (firstNewline > 0 && firstNewline < 50) {
                    snippet = snippet.substring(firstNewline + 1);
                  }
                }
                
                results.push({
                  filePath: fullPath.replace(process.cwd(), '').replace(/\\/g, '/'),
                  content: snippet,
                  score,
                  language: ext === 'tsx' || ext === 'ts' ? 'typescript' : 'javascript'
                });
              }
            } catch (err) {
              // Skip files that can't be read
              console.error(`Error reading ${fullPath}:`, err);
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error scanning ${dir}:`, err);
    }
  }
  
  await scanDirectory(srcDir);
  
  // Sort by score and return top results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, fileTypes = ['tsx', 'ts'], maxResults = 5 } = body;
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }
    
    const results = await searchCodebase(query, fileTypes, maxResults);
    
    return NextResponse.json({
      query,
      results,
      count: results.length
    });
    
  } catch (error) {
    console.error('Codebase search error:', error);
    return NextResponse.json(
      { error: 'Failed to search codebase: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
