import sv from './sv.json';

export type Locale = 'sv';

export const locales: Record<Locale, typeof sv> = {
  sv,
};

export const defaultLocale: Locale = 'sv';

export function getTranslations(locale: Locale = defaultLocale) {
  return locales[locale];
}

export function t(key: string, params?: Record<string, string | number>, locale: Locale = defaultLocale): string {
  const translations = getTranslations(locale);
  const keys = key.split('.');
  let value: unknown = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  if (typeof value === 'string') {
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }
    return value;
  }
  
  return key;
}

