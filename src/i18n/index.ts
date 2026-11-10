import en from './en.json';

export type Locale = 'en';

export const defaultLocale: Locale = 'en';

type Translations = typeof en;

const translations: Record<Locale, Translations> = { en };

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

export function createTranslator(_locale?: Locale) {
  const dict = translations.en;

  return function t(key: TranslationKey): string {
    return getNestedValue(dict, key);
  };
}
