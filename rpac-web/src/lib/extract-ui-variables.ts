/**
 * Utility to extract all UI text variables from sv.json for use in help editor
 */

import svTranslations from '@/lib/locales/sv.json';

export interface UITextVariable {
  category: string;
  key: string;
  value: string;
  description: string;
}

// Helper to get category name from key prefix
const getCategoryName = (key: string): string => {
  const firstPart = key.split('.')[0];
  const categoryMap: Record<string, string> = {
    'navigation': 'Navigation',
    'buttons': 'Knappar',
    'dashboard': 'Dashboard',
    'individual': 'Mitt hem',
    'local': 'Lokalt',
    'local_community': 'Lokalt samhälle',
    'regional': 'Regionalt',
    'settings': 'Inställningar',
    'profile': 'Profil',
    'auth': 'Autentisering',
    'forms': 'Formulär',
    'resources': 'Resurser',
    'community': 'Samhälle',
    'community_resources': 'Samhällesresurser',
    'community_admin': 'Samhällesadmin',
    'messaging': 'Meddelanden',
    'notifications': 'Notifieringar',
    'preparedness': 'Beredskap',
    'msb': 'MSB',
    'krister': 'KRISter',
    'homespace': 'Hemsida',
    'admin': 'Administration',
    'placeholders': 'Platshållare',
    'validation': 'Validering',
    'loading': 'Laddning',
    'errors': 'Felmeddelanden',
    'descriptions': 'Beskrivningar',
    'ui': 'UI',
    'metadata': 'Metadata',
    'ai_services': 'AI-tjänster',
    'nutrition': 'Näring'
  };
  
  return categoryMap[firstPart] || firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
};

// Extract variables from nested JSON structure
const extractVariablesFromJson = (
  obj: any,
  prefix: string = ''
): UITextVariable[] => {
  const variables: UITextVariable[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'string') {
      // This is a translatable text value
      const categoryName = getCategoryName(prefix || key);
      variables.push({
        category: categoryName,
        key: fullKey,
        value: value,
        description: `${fullKey}`
      });
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recurse into nested objects
      variables.push(...extractVariablesFromJson(value, fullKey));
    } else if (Array.isArray(value)) {
      // Handle arrays (like tips, questions, etc.)
      value.forEach((item, index) => {
        if (typeof item === 'string') {
          const arrayKey = `${fullKey}[${index}]`;
          const categoryName = getCategoryName(prefix || key);
          variables.push({
            category: categoryName,
            key: arrayKey,
            value: item,
            description: `${fullKey} item ${index + 1}`
          });
        }
      });
    }
  }
  
  return variables;
};

// Export all variables from sv.json
export const getAllUIVariables = (): UITextVariable[] => {
  return extractVariablesFromJson(svTranslations);
};

// Get variables grouped by category
export const getGroupedUIVariables = (): Record<string, UITextVariable[]> => {
  const allVars = getAllUIVariables();
  return allVars.reduce((acc, v) => {
    if (!acc[v.category]) acc[v.category] = [];
    acc[v.category].push(v);
    return acc;
  }, {} as Record<string, UITextVariable[]>);
};

// Get count of variables
export const getVariableCount = (): number => {
  return getAllUIVariables().length;
};
