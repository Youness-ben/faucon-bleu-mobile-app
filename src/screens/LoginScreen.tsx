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
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { useUser } from '../UserContext';
import Toast from 'react-native-toast-message';
import { useFloatingButton } from '../useFloatingButton';

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
  const [showModal, setShowModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  
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
      console.log(error.status);
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

  const { toggleVisibility } = useFloatingButton();
  useEffect(() => {
    toggleVisibility(false);
  }, []);

  const handleAccountInquiry = async () => {
    if (!companyName || !fullName || !contactInfo) {
      Toast.show({
        type: 'error',
        text1: t('auth.error'),
        text2: t('auth.allFieldsRequired'),
      });
      return;
    }

    try {
      await api.post('/account-inquiry', { company_name : companyName, full_name : fullName, phone :contactInfo });

      setShowModal(false);
                  navigation.navigate("AccountCreationConfirmation");
    } catch (error) {
      console.error('Error sending inquiry:', error);
      Toast.show({
        type: 'error',
        text1: t('auth.error'),
        text2: t('auth.inquiryFailed'),
      });
    }
  };

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

          <TouchableOpacity 
            style={styles.inquiryButton} 
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.inquiryButtonText}>{t('auth.createAccount')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('auth.accountInquiry')}</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder={t('auth.companyName')}
              value={companyName}
              onChangeText={setCompanyName}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder={t('auth.fullName')}
              value={fullName}
              onChangeText={setFullName}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder={t('auth.contactInfo')}
              value={contactInfo}
              onChangeText={setContactInfo}
            />
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={handleAccountInquiry}
            >
              <Text style={styles.modalButtonText}>{t('auth.sendInquiry')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  inquiryButton: {
    marginTop: height * 0.02,
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: height * 0.02,
    alignItems: 'center',
  },
  inquiryButtonText: {
    color: '#028dd0',
    fontSize: width * 0.04,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: width * 0.05,
    width: width * 0.9,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: width * 0.06,
    fontWeight: '700',
    color: '#028dd0',
    marginBottom: height * 0.02,
  },
  modalInput: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: width * 0.03,
    fontSize: width * 0.04,
    marginBottom: height * 0.02,
  },
  modalButton: {
    backgroundColor: '#028dd0',
    borderRadius: 10,
    padding: height * 0.02,
    alignItems: 'center',
    width: '100%',
    marginTop: height * 0.02,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
    fontWeight: '600',
  },
  modalCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#028dd0',
  },
  modalCancelButtonText: {
    color: '#028dd0',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
});

export default LoginScreen;

