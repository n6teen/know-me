import en from './en.json';
import th from './th.json';

export type Locale = 'en' | 'th';

export const locales: Locale[] = ['en', 'th'];
export const defaultLocale: Locale = 'en';

type Translations = typeof en;

const translations: Record<Locale, Translations> = { en, th };

type PathsToStringProps<T> = T extends string
  ? []
  : {
      [K in Extract<keyof T, string>]: [K, ...PathsToStringProps<T[K]>];
    }[Extract<keyof T, string>];

type Join<T extends string[], D extends string> = T extends []
  ? never
  : T extends [infer F]
    ? F
    : T extends [infer F, ...infer R]
      ? F extends string
        ? R extends string[]
          ? `${F}${D}${Join<R, D>}`
          : never
        : never
      : string;

export type TranslationKey = Join<PathsToStringProps<Translations>, '.'>;

function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }

  return typeof current === 'string' ? current : path;
}

export function createTranslator(locale: Locale) {
  const dict = translations[locale];

  return function t(key: TranslationKey): string {
    return getNestedValue(dict, key);
  };
}

export function getLocaleFromUrl(url: URL): Locale {
  const [, locale] = url.pathname.split('/');
  if (locale === 'th' || locale === 'en') {
    return locale;
  }
  return defaultLocale;
}

export function getAlternateUrl(url: URL, targetLocale: Locale): string {
  const currentLocale = getLocaleFromUrl(url);
  const pathWithoutLocale = url.pathname.replace(`/${currentLocale}`, '');
  return `/${targetLocale}${pathWithoutLocale || '/'}`;
}

export function getLocalizedPath(path: string, locale: Locale): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${cleanPath === '/' ? '' : cleanPath}`;
}
