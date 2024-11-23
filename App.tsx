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
import { Platform, StatusBar, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { UserProvider } from './src/UserContext';
import { NotificationProvider } from './src/NotificationContext';
import { theme } from './src/styles/theme';
import Toast from 'react-native-toast-message';

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
      console.log('Notification received:', notification);
      handleForegroundNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
      handleNotificationResponse(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const handleForegroundNotification = (notification) => {
    const data = notification.request.content.data;
    if (data.type === 'new_message') {
    } else if (data.type === 'general') {
      // Handle general notification
      console.log('General notification received:', data.message);
    }
    // Handle other types of notifications as needed
  };

  const handleNotificationResponse = (response) => {
    const data = response.notification.request.content.data;
    if (data.type === 'new_message' && data.serviceId && navigationRef.current) {
      // @ts-ignore
      navigationRef.current.navigate('TicketScreen', { serviceId: data.serviceId });
    } else if (data.type === 'redirect' && data.screen && navigationRef.current) {
      // @ts-ignore
      navigationRef.current.navigate(data.screen, data.params || {});
    } else if (data.type === 'general') {
      // Handle general notification tap
      console.log('General notification tapped:', data.message);
    }
    // Handle other types of notifications as needed
  };

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
      <SafeAreaProvider style={{backgroundColor:'transparent'}} >
        <View style={{
          flex: 1,
          paddingTop: Platform.OS === 'android' ? 0 : 0,
          backgroundColor:'transparent'
        }} onLayout={onLayoutRootView}>
          <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
          <NavigationContainer ref={navigationRef}>
            <UserProvider>
              <NotificationProvider>
                <AppNavigator />
              </NotificationProvider>
            </UserProvider>
          </NavigationContainer>
          <Toast />
        </View>
      </SafeAreaProvider>
    </I18nextProvider>
  );
  
}

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}