import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const EditProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('Youssef Tougani');
  const [email, setEmail] = useState('youssef.touga@hydromac.ma');
  const [phone, setPhone] = useState('+212 6 12 34 56 78');

  const handleSave = () => {
    // Implement save logic here
    console.log('Profile updated');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://api.dabablane.icamob.ma/faucon-demo/hydro.png' }}
          style={styles.avatar}
        />
        <TouchableOpacity style={styles.changePhotoButton}>
          <Text style={styles.changePhotoText}>{t('editProfile.changePhoto')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('editProfile.name')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('editProfile.namePlaceholder')}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('editProfile.email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={t('editProfile.emailPlaceholder')}
            keyboardType="email-address"
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
    borderBottomColor: theme.colors.border,
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
});

export default EditProfileScreen;