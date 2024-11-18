import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../styles/theme';
import * as ImagePicker from 'expo-image-picker';
import api from '../api';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MAIN_URL, STORAGE_URL } from '../../config';

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
      aspect: [1, 1],
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
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
      
      <View style={styles.header}>
        <Image
          source={{ uri: avatar? `${STORAGE_URL}/${avatar}`  :'https://via.placeholder.com/150'   }}
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
            style={styles.input}
            value={email}
            readOnly={true}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: theme.spacing.md,
  },
  changePhotoButton: {
    marginTop: theme.spacing.sm,
  },
  changePhotoText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.md,
  },
  form: {
    padding: theme.spacing.lg,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary,
    paddingVertical: theme.spacing.sm,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
    alignItems: 'center',
  },
  saveButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
  },
  backButton: {
    padding: theme.spacing.lg,
  },
});

export default EditProfileScreen;