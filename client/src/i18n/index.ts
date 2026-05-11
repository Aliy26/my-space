import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ko from './locales/ko.json'
import flagUs from 'flag-icons/flags/4x3/us.svg'
import flagKr from 'flag-icons/flags/4x3/kr.svg'

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flagUrl: flagUs as string },
  { code: 'ko', label: '한국어', flagUrl: flagKr as string },
] as const

export type LanguageCode = 'en' | 'ko'

export const LANGUAGE_STORAGE_KEY = 'portfolio-language'

const getInitialLanguage = (): LanguageCode => {
  if (typeof window === 'undefined') return 'en'

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (
    storedLanguage &&
    SUPPORTED_LANGUAGES.some((language) => language.code === storedLanguage)
  ) {
    return storedLanguage as LanguageCode
  }

  return 'en'
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ko: { translation: ko },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
