/**
 * KRISter Learning API
 * 
 * Scans all help documentation files and updates KRISter's knowledge base
 * This endpoint fetches all .md files from the help directory and processes them
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface HelpFile {
  path: string;
  content: string;
  category: string;
}

export async function POST(request: NextRequest) {
  try {
    const { action, includeAll } = await request.json();

    if (action !== 'scan_and_update') {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Define help file structure
    const helpFiles = [
      // Dashboard
      { path: 'dashboard.md', category: 'dashboard' },
      
      // Individual
      { path: 'individual/resources.md', category: 'individual' },
      { path: 'individual/cultivation.md', category: 'individual' },
      { path: 'individual/knowledge.md', category: 'individual' },
      { path: 'individual/coach.md', category: 'individual' },
      
      // Local
      { path: 'local/home.md', category: 'local' },
      { path: 'local/discover.md', category: 'local' },
      { path: 'local/activity.md', category: 'local' },
      { path: 'local/resources-shared.md', category: 'local' },
      { path: 'local/resources-owned.md', category: 'local' },
      { path: 'local/resources-help.md', category: 'local' },
      { path: 'local/messages-community.md', category: 'local' },
      { path: 'local/messages-direct.md', category: 'local' },
      { path: 'local/admin.md', category: 'local' },
      
      // Regional
      { path: 'regional/overview.md', category: 'regional' },
      
      // Settings
      { path: 'settings/profile.md', category: 'settings' },
      { path: 'settings/security.md', category: 'settings' },
      { path: 'settings/privacy.md', category: 'settings' },
      { path: 'settings/notifications.md', category: 'settings' },
      { path: 'settings/preferences.md', category: 'settings' },
      
      // Auth
      { path: 'auth/login.md', category: 'auth' },
    ];

    // Fetch all help files from GitHub
    const owner = 'peka01';
    const repo = 'RPAC';
    const branch = 'main';
    const baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/rpac-web/public/help`;

    const fetchedFiles: HelpFile[] = [];
    const errors: string[] = [];

    for (const file of helpFiles) {
      try {
        const url = `${baseUrl}/${file.path}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const content = await response.text();
          fetchedFiles.push({
            path: file.path,
            content,
            category: file.category
          });
        } else {
          errors.push(`Failed to fetch ${file.path}: ${response.status}`);
        }
      } catch (error) {
        errors.push(`Error fetching ${file.path}: ${error}`);
      }
    }

    // Process the fetched files to extract key information
    const knowledgeBase = processHelpFiles(fetchedFiles);

    // TODO: In production, store this in Supabase or update the prompt
    // For now, we'll return the processed knowledge
    
    return NextResponse.json({
      success: true,
      filesProcessed: fetchedFiles.length,
      errors: errors.length > 0 ? errors : undefined,
      knowledgeBase,
      message: `Successfully learned from ${fetchedFiles.length} help files`
    });

  } catch (error) {
    console.error('Error in learn endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process help documentation' },
      { status: 500 }
    );
  }
}

/**
 * Process help files to extract structured knowledge
 */
function processHelpFiles(files: HelpFile[]): any {
  const knowledge: Record<string, any> = {
    dashboard: {},
    individual: {},
    local: {},
    regional: {},
    settings: {},
    procedures: [],
    faqs: []
  };

  for (const file of files) {
    const sections = parseMarkdownSections(file.content);
    
    // Extract procedures (Steg-för-steg sections)
    if (sections.steps && sections.steps.length > 0) {
      knowledge.procedures.push({
        file: file.path,
        category: file.category,
        title: sections.title || file.path,
        steps: sections.steps
      });
    }

    // Extract FAQs
    if (sections.faqs && sections.faqs.length > 0) {
      knowledge.faqs.push(...sections.faqs.map((faq: any) => ({
        ...faq,
        source: file.path,
        category: file.category
      })));
    }

    // Store by category
    knowledge[file.category][file.path] = {
      title: sections.title,
      description: sections.description,
      hasSteps: sections.steps?.length > 0,
      hasFAQs: sections.faqs?.length > 0,
      tips: sections.tips
    };
  }

  return knowledge;
}

/**
 * Parse markdown content into sections
 */
function parseMarkdownSections(content: string): any {
  const lines = content.split('\n');
  const sections: any = {
    title: '',
    description: '',
    steps: [],
    tips: [],
    faqs: []
  };

  let currentSection = 'none';
  let currentStep = '';
  let currentFAQ: any = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Extract title
    if (line.startsWith('# ') && !sections.title) {
      sections.title = line.substring(2).trim();
      continue;
    }

    // Detect sections
    if (line.toLowerCase().includes('## steg-för-steg')) {
      currentSection = 'steps';
      continue;
    }
    if (line.toLowerCase().includes('## tips')) {
      currentSection = 'tips';
      continue;
    }
    if (line.toLowerCase().includes('## vanliga frågor')) {
      currentSection = 'faqs';
      continue;
    }

    // Process based on current section
    if (currentSection === 'steps' && line.match(/^#+\s*\d+\./)) {
      if (currentStep) sections.steps.push(currentStep);
      currentStep = line.replace(/^#+\s*/, '');
    } else if (currentSection === 'steps' && currentStep) {
      currentStep += '\n' + line;
    }

    if (currentSection === 'tips' && line.startsWith('-') || line.startsWith('*')) {
      sections.tips.push(line.substring(1).trim());
    }

    if (currentSection === 'faqs') {
      if (line.startsWith('**Q:')) {
        if (currentFAQ) sections.faqs.push(currentFAQ);
        currentFAQ = { question: line.substring(4).replace('**', '').trim(), answer: '' };
      } else if (currentFAQ && line.startsWith('A:')) {
        currentFAQ.answer = line.substring(2).trim();
      }
    }
  }

  // Add last step/FAQ
  if (currentStep) sections.steps.push(currentStep);
  if (currentFAQ) sections.faqs.push(currentFAQ);

  return sections;
}
