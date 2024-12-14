import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import api from '../api'; // Make sure to import your api instance
import { useUser } from '../UserContext';

export default function Component() {
  const navigation = useNavigation();
  const { user, login } = useUser();
  
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();
        const userToken = await AsyncStorage.getItem('userToken');
        
        if (userToken) {
          // Set the token in the API instance
          api.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
          
          // Check token validity
          const response = await api.get('/check-token');
          
          if (response.data.valid) {
            const userType = response.data.userType;
            await AsyncStorage.setItem('userType', userType);
            
            if (userType === 'client') {
              navigation.replace('Main');
            } else if (userType === 'vehicle') {
              navigation.replace('ConductorMain');
            } else {
              navigation.replace('UserType');
            }
          } else {
            // Token is invalid, clear storage and redirect to login
            await AsyncStorage.multiRemove(['userToken', 'userType']);
            navigation.replace('UserType');
          }
        } else {
          navigation.replace('UserType');
        }
      } catch (e) {
        console.warn(e);
        // In case of any error, clear storage and redirect to login
        await AsyncStorage.multiRemove(['userToken', 'userType']);
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