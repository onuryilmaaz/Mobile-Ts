import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import tr from './locales/tr.json';
import en from './locales/en.json';

const resources = {
  tr: { translation: tr },
  en: { translation: en },
};

// Cihazın dil ayarlarını al
const locales = Localization.getLocales();
const deviceLanguage = locales && locales.length > 0 ? locales[0].languageCode : 'en';

// Yalnızca tr ve en dillerini destekliyoruz, diğer diller için en (İngilizce) varsayılan olacak
const defaultLanguage = deviceLanguage === 'tr' ? 'tr' : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: defaultLanguage,
    fallbackLng: 'en',
    compatibilityJSON: 'v3', // React Native (Hermes) uyumluluğu için gerekli
    interpolation: {
      escapeValue: false, // React XSS korumasını zaten yapıyor
    },
  });

export default i18n;
