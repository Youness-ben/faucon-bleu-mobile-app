import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import ar from './ar.json';
import it from './it.json';
import fr from './fr.json';
import es from './es.json';

const LANGUAGES = ['en', 'ar' ,'fr' , 'es' , 'it'];

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem('userLanguage');
      if (savedLanguage) {
        // If there's a language in storage, use it
        callback(savedLanguage);
        return;
      }
    } catch (error) {
      console.error('Error reading language from AsyncStorage:', error);
    }
    // If no language is set, use device locale
    callback('fr');
  },
  init: () => {},
  cacheUserLanguage: () => {},
};
//@ts-ignore
i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      it: { translation: it },
      fr: { translation: fr },
      es: { translation: es },
    },
    fallbackLng: 'fr',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;