import sv from './sv.json';

export type Locale = 'sv';

export const locales: Record<Locale, typeof sv> = {
  sv,
};

export const defaultLocale: Locale = 'sv';

export function getTranslations(locale: Locale = defaultLocale) {
  return locales[locale];
}

export function t(key: string, locale: Locale = defaultLocale): string {
  const translations = getTranslations(locale);
  const keys = key.split('.');
  let value: unknown = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  return typeof value === 'string' ? value : key;
}

