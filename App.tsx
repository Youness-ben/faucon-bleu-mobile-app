import React, { useCallback, useEffect, useState, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import i18n from './src/localization/i18n';
import AppNavigator from './src/navigation/AppNavigator';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { UserProvider } from './src/UserContext';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const navigationRef = useRef();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync(Ionicons.font);
        await registerForPushNotificationsAsync();
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Handle received notification
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data.screen && navigationRef.current) {
        // @ts-ignore
        navigationRef.current.navigate(data.screen, data.params);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <SafeAreaProvider onLayout={onLayoutRootView}>
        <NavigationContainer ref={navigationRef}>
          <UserProvider>
            <AppNavigator />
          </UserProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </I18nextProvider>
  );
}

async function registerForPushNotificationsAsync() {
  // ... (keep the existing implementation)
}