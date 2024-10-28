import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';

export default function Component() {
  const navigation = useNavigation();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
        const userToken = await AsyncStorage.getItem('userToken');
        const userType = await AsyncStorage.getItem('userType');

        if (userToken) {
          if (userType === 'client') {
            navigation.replace('Main');
          } else if (userType === 'vehicle') {
            navigation.replace('ConductorMain');
          } else {
            navigation.replace('Login');
          }
        } else {
          navigation.replace('Login');
        }
      } catch (e) {
        console.warn(e);
        navigation.replace('Login');
      } finally {
        await SplashScreen.hideAsync();
      }
    };

    checkLoginStatus();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});