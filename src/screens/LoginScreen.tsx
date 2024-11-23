import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { useUser } from '../UserContext';
import Toast from 'react-native-toast-message';

type RootStackParamList = {
  Home: undefined;
  ConductorLogin: undefined;
};

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useUser();
  
  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: t('auth.error'),
        text2: t('auth.allFieldsRequired'),
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/login/client', { email, password });
      const { token, user } = response.data;

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userType', 'client');
      await login(token, 'client');
      navigation.navigate('Main');
    } catch (error) {
      console.log(error);
      Toast.show({
        type: 'error',
        text1: t('auth.error'),
        text2: t('auth.invalidCredentials'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const navigateToConductorLogin = () => {
    navigation.navigate('ConductorLogin');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.formContainer}>
          <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
          <Text style={styles.subtitle}>{t('auth.loginToContinue')}</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={24} color="#028dd0" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.email')}
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#028dd0" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.password')}
              placeholderTextColor="#A0A0A0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={toggleShowPassword} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color="#028dd0" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>{t('auth.signIn')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.conductorButton} 
            onPress={navigateToConductorLogin}
          >
            <Text style={styles.conductorButtonText}>{t('auth.conductorLogin')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: width * 0.05,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: height * 0.05,
  },
  logo: {
    width: width * 0.6,
    height: height * 0.15,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: width * 0.05,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: width * 0.08,
    fontWeight: '700',
    color: '#028dd0',
    marginBottom: height * 0.01,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: width * 0.04,
    color: '#666666',
    marginBottom: height * 0.03,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: height * 0.02,
    paddingHorizontal: width * 0.03,
  },
  inputIcon: {
    marginRight: width * 0.02,
  },
  input: {
    flex: 1,
    padding: width * 0.03,
    fontSize: width * 0.04,
    color: '#333333',
    fontFamily: 'Poppins-Regular',
  },
  eyeIcon: {
    padding: width * 0.02,
  },
  button: {
    backgroundColor: '#028dd0',
    borderRadius: 10,
    padding: height * 0.02,
    alignItems: 'center',
    marginTop: height * 0.02,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  conductorButton: {
    marginTop: height * 0.02,
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: height * 0.02,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#028dd0',
  },
  conductorButtonText: {
    color: '#028dd0',
    fontSize: width * 0.04,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default LoginScreen;

