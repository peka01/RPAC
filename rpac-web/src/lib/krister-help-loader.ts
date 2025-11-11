/**
 * KRISter Help Content Loader
 * 
 * Dynamically loads context-aware help content from markdown files
 * and interpolates variables from the localization system.
 * 
 * @example
 * const content = await KRISterHelpLoader.loadHelpForRoute('/individual?section=resources');
 * // Returns parsed help with variables replaced from sv.json
 */

import { t, getTranslations } from './locales';

/**
 * Get a value from translations that can be string or array
 */
function getTranslationValue(key: string): string | string[] | undefined {
  const translations = getTranslations('sv');
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  
  return value;
}

export interface HelpContent {
  title: string;
  context: string;
  steps: HelpStep[];
  tips: string[];
  faqs: HelpFAQ[];
  relatedPages: HelpLink[];
  rawMarkdown: string;
}

export interface HelpStep {
  number: number;
  title: string;
  content: string;
  substeps?: HelpSubstep[];
}

export interface HelpSubstep {
  title: string;
  content: string;
}

export interface HelpFAQ {
  question: string;
  answer: string;
}

export interface HelpLink {
  title: string;
  path: string;
  description: string;
}

export class KRISterHelpLoader {
  private static helpDocsPath = '/docs/help';
  private static cache: Map<string, HelpContent> = new Map();

  /**
   * Load help content for the current route
   */
  static async loadHelpForRoute(pathname: string, searchParams?: URLSearchParams): Promise<HelpContent | null> {
    const helpFile = this.getHelpFileForRoute(pathname, searchParams);
    if (!helpFile) {
      console.warn(`No help file found for route: ${pathname}`);
      return null;
    }

    return this.loadHelpFile(helpFile);
  }

  /**
   * Map route to help file path
   */
  private static getHelpFileForRoute(pathname: string, searchParams?: URLSearchParams): string | null {
    // Remove leading/trailing slashes
    const path = pathname.replace(/^\/|\/$/g, '');

    // Dashboard
    if (path === '' || path === 'dashboard') {
      return 'dashboard.md';
    }

    // Individual
    if (path === 'individual') {
      const section = searchParams?.get('section') || 'resources';
      return `individual/${section}.md`;
    }

    // Local community
    if (path === 'local') {
      const tab = searchParams?.get('tab');
      const resourceTab = searchParams?.get('resourceTab');

      if (!tab || tab === 'home') return 'local/home.md';
      if (tab === 'activity') return 'local/activity.md';
      if (tab === 'resources') {
        if (resourceTab === 'shared') return 'local/resources-shared.md';
        if (resourceTab === 'owned') return 'local/resources-owned.md';
        if (resourceTab === 'help') return 'local/resources-help.md';
        return 'local/resources-shared.md'; // default
      }
      if (tab === 'admin') return 'local/admin.md';
    }

    if (path === 'local/discover') return 'local/discover.md';
    if (path === 'local/activity') return 'local/activity.md';
    if (path === 'local/messages/community') return 'local/messages-community.md';
    if (path === 'local/messages/direct') return 'local/messages-direct.md';

    // Regional
    if (path === 'regional') return 'regional/overview.md';

    // Settings
    if (path === 'settings') {
      const tab = searchParams?.get('tab') || 'profile';
      return `settings/${tab}.md`;
    }

    // Super Admin
    if (path === 'super-admin') return 'admin/super-admin.md';
    if (path.startsWith('super-admin/')) {
      const subpath = path.replace('super-admin/', '');
      return `admin/${subpath}.md`;
    }

    // Homespace editor
    if (searchParams?.get('view') === 'homespace') {
      return 'admin/homespace-editor.md';
    }

    return null;
  }

  /**
   * Load and parse help file (public method for direct loading)
   */
  static async loadHelpFile(filePath: string): Promise<HelpContent> {
    // Check cache
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath)!;
    }

    try {
      // In production, this would fetch from /docs/help/ via API route
      // For now, we'll create a stub that returns structured content
      const content = await this.fetchHelpContent(filePath);
      const parsed = this.parseMarkdown(content);
      
      // Cache the result
      this.cache.set(filePath, parsed);
      
      return parsed;
    } catch (error) {
      console.error(`Error loading help file ${filePath}:`, error);
      return this.getFallbackContent(filePath);
    }
  }

  /**
   * Fetch help content (implementation depends on deployment)
   */
  private static async fetchHelpContent(filePath: string): Promise<string> {
    // Option 1: Fetch from public API route
    try {
      // Remove .md extension since API route adds it
      const cleanPath = filePath.replace(/\.md$/, '');
      // Add cache-busting timestamp to ensure fresh content
      const cacheBust = `?t=${Date.now()}`;
      const url = `/api/help/${cleanPath}${cacheBust}`;
      const response = await fetch(url);
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      console.warn('Failed to fetch help content from API:', error);
    }

    // Option 2: Return placeholder for now (will be replaced with actual file content)
    return this.getPlaceholderContent(filePath);
  }

  /**
   * Get placeholder content (temporary until API route is implemented)
   * Maps file paths to existing sv.json keys
   */
  private static getPlaceholderContent(filePath: string): string {
    // Map file paths to actual sv.json context_help keys
    const keyMap: Record<string, string> = {
      'dashboard': 'dashboard',
      'individual/resources': 'resources',
      'individual/cultivation': 'cultivation',
      'individual/knowledge': 'individual',
      'individual/coach': 'individual',
      'local/home': 'local',
      'local/discover': 'local_discover',
      'local/activity': 'local_activity',
      'local/resources-shared': 'resource_shared',
      'local/resources-owned': 'resource_owned',
      'local/resources-help': 'resource_help',
      'local/messages-community': 'messaging_community',
      'local/messages-direct': 'messaging_direct',
      'local/admin': 'community_admin',
      'regional/overview': 'regional',
      'settings/profile': 'settings_profile',
      'settings/account': 'settings',
      'settings/privacy': 'settings',
      'settings/notifications': 'settings',
      'auth/login': 'dashboard'
    };
    
    const cleanPath = filePath.replace('.md', '');
    const key = keyMap[cleanPath] || 'dashboard';
    
    return `# {{krister.context_help.${key}.title}}

## Kontext

{{krister.context_help.${key}.description}}

## Tips

{{krister.context_help.${key}.tips}}
`;
  }

  /**
   * Parse markdown content and interpolate variables
   */
  private static parseMarkdown(markdown: string): HelpContent {
    // Interpolate {{variables}} from localization
    const interpolated = this.interpolateVariables(markdown);

    // Parse structure
    const lines = interpolated.split('\n');
    const content: HelpContent = {
      title: '',
      context: '',
      steps: [],
      tips: [],
      faqs: [],
      relatedPages: [],
      rawMarkdown: interpolated
    };

    let currentSection = '';
    let currentStep: HelpStep | null = null;
    let currentFAQ: HelpFAQ | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Title (# ...)
      if (line.startsWith('# ') && !content.title) {
        content.title = line.substring(2).trim();
        continue;
      }

      // Section headers (## ...)
      if (line.startsWith('## ')) {
        currentSection = line.substring(3).trim();
        currentStep = null;
        currentFAQ = null;
        continue;
      }

      // Step headers (### ...)
      if (line.startsWith('### ') && currentSection === 'Steg-för-steg') {
        const stepTitle = line.substring(4).trim();
        const match = stepTitle.match(/^(\d+)\.\s*(.+)$/);
        if (match) {
          currentStep = {
            number: parseInt(match[1]),
            title: match[2],
            content: '',
            substeps: []
          };
          content.steps.push(currentStep);
        }
        continue;
      }

      // Context section
      if (currentSection === 'Kontext' && line) {
        content.context += (content.context ? '\n' : '') + line;
      }

      // Tips section - strip markdown bullets if present
      if (currentSection === 'Tips' && line) {
        // Remove markdown bullet syntax (- or * at start)
        const cleanTip = line.replace(/^[-*]\s+/, '').trim();
        if (cleanTip) {
          content.tips.push(cleanTip);
        }
      }

      // FAQs
      if (currentSection === 'Vanliga frågor') {
        if (line.startsWith('**Q:')) {
          const question = line.substring(4, line.indexOf('**', 4));
          currentFAQ = { question, answer: '' };
          content.faqs.push(currentFAQ);
        } else if (line.startsWith('A:') && currentFAQ) {
          currentFAQ.answer = line.substring(2).trim();
        }
      }

      // Related pages
      if (currentSection === 'Relaterade sidor' && line.startsWith('- [')) {
        const match = line.match(/- \[(.+?)\]\((.+?)\)\s*-\s*(.+)/);
        if (match) {
          content.relatedPages.push({
            title: match[1],
            path: match[2],
            description: match[3]
          });
        }
      }

      // Step content
      if (currentStep && currentSection === 'Steg-för-steg' && line && !line.startsWith('#')) {
        currentStep.content += (currentStep.content ? '\n' : '') + line;
      }
    }

    return content;
  }

  /**
   * Interpolate {{variable.path}} with values from localization
   */
  private static interpolateVariables(markdown: string): string {
    const variableRegex = /\{\{([a-zA-Z0-9_.]+)\}\}/g;
    
    const result = markdown.replace(variableRegex, (match, path) => {
      try {
        // Check if path ends with array index like .tips.0, .tips.1, etc.
        const arrayIndexMatch = path.match(/^(.+)\.(\d+)$/);
        
        if (arrayIndexMatch) {
          const [, basePath, indexStr] = arrayIndexMatch;
          const value = getTranslationValue(basePath);
          
          if (Array.isArray(value)) {
            const index = parseInt(indexStr);
            const result = value[index] || match;
            console.log(`[HelpLoader] Interpolated ${match} -> ${result}`);
            return result;
          }
        }
        
        // Get the value (can be string or array)
        const value = getTranslationValue(path);
        
        // If the value is an array (like tips without index), convert to markdown list
        if (Array.isArray(value)) {
          const result = value.map(item => `- ${item}`).join('\n');
          console.log(`[HelpLoader] Interpolated array ${match} -> [${value.length} items]`);
          return result;
        }
        
        // If it's a string, return it
        if (typeof value === 'string') {
          console.log(`[HelpLoader] Interpolated ${match} -> ${value}`);
          return value;
        }
        
        // Value not found, return original match
        console.warn(`[HelpLoader] Variable not found or invalid type for: ${path}, keeping placeholder`);
        return match;
      } catch (error) {
        console.warn(`[HelpLoader] Error interpolating variable: ${path}`, error);
        return match; // Keep the placeholder if variable not found
      }
    });
    
    console.log(`[HelpLoader] Interpolation complete. Original length: ${markdown.length}, Result length: ${result.length}`);
    return result;
  }

  /**
   * Get fallback content when help file can't be loaded
   */
  private static getFallbackContent(filePath: string): HelpContent {
    return {
      title: t('krister.help_topics.app_usage'),
      context: t('krister.empty_state.description'),
      steps: [],
      tips: [
        t('krister.context_help.dashboard.tips.0'),
        t('krister.context_help.dashboard.tips.1'),
        t('krister.context_help.dashboard.tips.2')
      ],
      faqs: [],
      relatedPages: [],
      rawMarkdown: ''
    };
  }

  /**
   * Clear cache (useful for development/testing)
   */
  static clearCache() {
    this.cache.clear();
  }

  /**
   * Preload help content for common routes
   */
  static async preloadCommonRoutes() {
    const commonRoutes = [
      'dashboard.md',
      'individual/resources.md',
      'individual/cultivation.md',
      'local/home.md',
      'local/discover.md'
    ];

    await Promise.all(
      commonRoutes.map(route => this.loadHelpFile(route))
    );
  }
}
