import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { theme } from '../styles/theme';
import { useUser } from '../UserContext';

type RootStackParamList = {
  ConductorHome: undefined;
};

type ConductorLoginScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ConductorLoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ConductorLoginScreenNavigationProp>();
  const [plateNumber, setPlateNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useUser();
  
  const handleLogin = async () => {
    if (!plateNumber || !password) {
      Alert.alert(t('auth.error'), t('auth.allFieldsRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/login/vehicle', { license_plate: plateNumber, password });
      const { token } = response.data;
      
      await login(token, 'vehicle');
      navigation.navigate('ConductorHome');
    } catch (error) {
      Alert.alert(t('auth.error'), t('auth.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  
  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t('auth.conductorLogin')}</Text>
        <Text style={styles.subtitle}>{t('auth.enterVehicleDetails')}</Text>
        
        <View style={styles.inputContainer}>
          <Ionicons name="car-outline" size={24} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('auth.plateNumber')}
            value={plateNumber}
            onChangeText={setPlateNumber}
            autoCapitalize="characters"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={24} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={toggleShowPassword} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.buttonText} />
          ) : (
            <Text style={styles.buttonText}>{t('auth.signIn')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBackground,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    padding: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
  },
  eyeIcon: {
    padding: theme.spacing.sm,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: theme.colors.buttonText,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
  },
});

export default ConductorLoginScreen;