import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert, 
  ActivityIndicator,
  StatusBar,
  Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../styles/theme';
import * as ImagePicker from 'expo-image-picker';
import api from '../api';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { STORAGE_URL } from '../../config';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const EditProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const [firstname, setFirstName] = useState('');
  const [lastname, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/client/profile');
      const { first_name, last_name, email, phone, avatar } = response.data;
      setFirstName(`${first_name}`);
      setLastName(`${last_name}`);
      setPhone(phone);
      setEmail(email);
      setAvatar(avatar);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('firstName', firstname);
      formData.append('lastName', lastname);
      formData.append('phone', phone);

      if (avatar && avatar.startsWith('file://')) {
        const filename = avatar.split('/').pop();
        formData.append('avatar', {
          uri: avatar,
          type: 'image/jpeg',
          name: filename || 'avatar.jpg',
        } as any);
      }

      const response = await api.post('client/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        Alert.alert('Success', 'Profile updated successfully');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'You need to allow access to your photos to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      setAvatar(result.assets[0].uri);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#028dd0" />
      <LinearGradient colors={['#028dd0', '#01579B']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('editProfile.title')}</Text>
      </LinearGradient>
      <ScrollView style={styles.content}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: avatar ? `${STORAGE_URL}/${avatar}` : 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.changePhotoButton} onPress={handleChangePhoto}>
            <Text style={styles.changePhotoText}>{t('editProfile.changePhoto')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('editProfile.firstName')}</Text>
            <TextInput
              style={styles.input}
              value={firstname}
              onChangeText={setFirstName}
              placeholder={t('editProfile.namePlaceholder')}
            />
          </View>        
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('editProfile.lastName')}</Text>
            <TextInput
              style={styles.input}
              value={lastname}
              onChangeText={setLastName}
              placeholder={t('editProfile.namePlaceholder')}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('editProfile.email')}</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={email}
              editable={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('editProfile.phone')}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('editProfile.phonePlaceholder')}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('editProfile.save')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  changePhotoButton: {
    backgroundColor: '#028dd0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  changePhotoText: {
    color: '#FFFFFF',
    fontSize: 16,
    
  },
  form: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
    
  },
  input: {
    fontSize: 16,
    color: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 10,
    
  },
  disabledInput: {
    color: '#8E8E93',
    backgroundColor: '#F2F2F7',
  },
  saveButton: {
    backgroundColor: '#028dd0',
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    
  },
});

export default EditProfileScreen;

