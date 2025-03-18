import React, { useEffect, useState } from 'react';
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
import api from '../api';
import { useUser } from '../UserContext';
import Toast from 'react-native-toast-message';
import { useFloatingButton } from '../useFloatingButton';

type RootStackParamList = {
  ConductorHome: undefined;
  Login: undefined;
};

type ConductorLoginScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

const ConductorLoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ConductorLoginScreenNavigationProp>();
  const [plateNumber, setPlateNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
    const { toggleVisibility } = useFloatingButton();
  
  const { login } = useUser();
   useEffect(() => {
      toggleVisibility(false);
    }, []);
  
  const handleLogin = async () => {
    if (!plateNumber || !password) {
      Toast.show({
        type: 'error',
        text1: t('auth.error'),
        text2: t('auth.allFieldsRequired'),
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('login/vehicle', { license_plate: plateNumber, password });
      const { token } = response.data;
      
      await login(token, 'vehicle');
      navigation.navigate('ConductorMain');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('auth.error'),
        text2: t('auth.invalidCredentials'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };
  
  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >

        <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('UserType')}
      >
        <Ionicons name="arrow-back" size={24} color="#028dd0" />
      </TouchableOpacity>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.formContainer}>
          <Text style={styles.title}>{t('auth.conductorLogin')}</Text>
          <Text style={styles.subtitle}>{t('auth.enterVehicleDetails')}</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="car-outline" size={24} color="#028dd0" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.plateNumber')}
              placeholderTextColor="#A0A0A0"
              value={plateNumber}
              onChangeText={setPlateNumber}
              autoCapitalize="characters"
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
            style={styles.clientButton} 
            onPress={navigateToLogin}
          >
            <Text style={styles.clientButtonText}>{t('auth.clientLogin')}</Text>
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
    
  },
  subtitle: {
    fontSize: width * 0.04,
    color: '#666666',
    marginBottom: height * 0.03,
    textAlign: 'center',
    
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
    
  },
  clientButton: {
    marginTop: height * 0.02,
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: height * 0.02,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#028dd0',
  },
  clientButtonText: {
    color: '#028dd0',
    fontSize: width * 0.04,
    fontWeight: '600',
    
  },

  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
});

export default ConductorLoginScreen;

