import { i18n } from '@lingui/core';

export const locales = {
  pl: 'Polski',
  en: 'English',
};

export const defaultLocale: keyof typeof locales = 'pl';

export async function langDynamic(locale: keyof typeof locales) {
  const { messages } = await import(`../locales/${locale}.po`);

  i18n.load(locale, messages);
  i18n.activate(locale);
}
