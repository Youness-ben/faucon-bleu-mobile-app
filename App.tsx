import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/localization/i18n';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </I18nextProvider>
  );
}