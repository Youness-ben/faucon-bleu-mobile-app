import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';
import api from '../api';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

type RootStackParamList = {
  ClientAccounts: undefined;
};

type AddClientScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ClientAccounts'>;

const AddClientScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AddClientScreenNavigationProp>();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('responsable');
  const [avatar, setAvatar] = useState<string | null>(null);

  const handleAddClient = async () => {
    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('phone', phone);
      formData.append('role', role);

      if (avatar) {
        const filename = avatar.split('/').pop();
        const match = /\.(\w+)$/.exec(filename as string);
        const type = match ? `image/${match[1]}` : 'image';
        formData.append('avatar', { uri: avatar, name: filename, type } as any);
      }

      const response = await api.post('/client/accounts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 201) {
        Toast.show({
          type: 'success',
          text1: t('addClient.success'),
          text2: t('addClient.successMessage'),
          onPress: () => navigation.goBack(),
        });
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error adding client:', error);
      Toast.show({
        type: 'error',
        text1: t('addClient.error'),
        text2: t('addClient.errorMessage'),
      });
    }
  };

  const handleChooseAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Toast.show({
        type: 'error',
        text1: t('addClient.permissionDenied'),
        text2: t('addClient.permissionDeniedMessage'),
      });
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!pickerResult.canceled) {
      setAvatar(pickerResult.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#028dd0" />
      <LinearGradient colors={['#028dd0', '#01579B']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('addClient.title')}</Text>
      </LinearGradient>
      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.avatarContainer} onPress={handleChooseAvatar}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="camera" size={40} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.avatarLabel}>{t('addClient.tapToAddAvatar')}</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('addClient.firstName')}</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t('addClient.firstNamePlaceholder')}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('addClient.lastName')}</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder={t('addClient.lastNamePlaceholder')}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('addClient.phone')}</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder={t('addClient.phonePlaceholder')}
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('addClient.email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={t('addClient.emailPlaceholder')}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('addClient.password')}</Text>
          <TextInput
              style={[styles.input,styles.inputContainer]}
              placeholder={t('addClient.password')}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('addClient.role')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={role}
              onValueChange={(itemValue) => setRole(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label={t('addClient.roleResponsable')} value="responsable" />
              <Picker.Item label={t('addClient.roleManagement')} value="management" />
            </Picker>
          </View>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddClient}>
          <Text style={styles.addButtonText}>{t('addClient.addButton')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLabel: {
    textAlign: 'center',
    color: theme.colors.primary,
  },
  inputContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  addButton: {
    backgroundColor: '#028dd0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AddClientScreen;

