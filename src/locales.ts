import LOCALES_JSON from './locales.json';

export interface Locale {
  placePagePrompt: string;
  perMonth: string;
  perYear: string;
  otherAmount: string;
}

export interface Locales {
  [key: string]: Locale;
}

const LOCALES = LOCALES_JSON as Locales;
export default LOCALES;
