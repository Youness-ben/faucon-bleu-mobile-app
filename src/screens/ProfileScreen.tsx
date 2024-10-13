import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Image, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

type RootStackParamList = {
  EditProfile: undefined;
  Invoices: undefined;
  Support: undefined;
  Settings: undefined;
};

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ProfileScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const toggleNotifications = () => setNotificationsEnabled(previousState => !previousState);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setShowLanguageModal(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://api.dabablane.icamob.ma/faucon-demo/hydro.png' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>Youssef Tougani</Text>
        <Text style={styles.email}>youssef.touga@hydromac.ma</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="person-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.optionText}>{t('profile.editProfile')}</Text>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate('Invoices')}
        >
          <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.optionText}>{t('profile.invoices')}</Text>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.option}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.optionText}>{t('profile.notifications')}</Text>
          <Switch
            trackColor={{ false: theme.colors.textSecondary, true: theme.colors.primary }}
            thumbColor={notificationsEnabled ? theme.colors.background : theme.colors.textSecondary}
            onValueChange={toggleNotifications}
            value={notificationsEnabled}
          />
        </View>

        <TouchableOpacity
          style={styles.option}
          onPress={() => setShowLanguageModal(true)}
        >
          <Ionicons name="language-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.optionText}>{t('profile.language')}</Text>
  
          <Text style={styles.languageValue}> {i18n.language === 'en' ? 'English' :  i18n.language === 'fr' ? 'Français' :   i18n.language === 'es' ? 'Español' :  i18n.language === 'it' ? 'Italiano' : 'العربية'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate('Support')}
        >
          <Ionicons name="help-circle-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.optionText}>{t('profile.support')}</Text>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.optionText}>{t('profile.settings')}</Text>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
      </TouchableOpacity>

      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.selectLanguage')}</Text>
            <TouchableOpacity
              style={styles.languageOption}
              onPress={() => changeLanguage('en')}
            >
              <Text style={styles.languageOptionText}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.languageOption}
              onPress={() => changeLanguage('ar')}
            >
              <Text style={styles.languageOptionText}>العربية</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.languageOption}
              onPress={() => changeLanguage('fr')}
            >
              <Text style={styles.languageOptionText}>Français</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.languageOption}
              onPress={() => changeLanguage('it')}
            >
              <Text style={styles.languageOptionText}>Italiano</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.languageOption}
              onPress={() => changeLanguage('es')}
            >
              <Text style={styles.languageOptionText}>Español</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: theme.spacing.md,
  },
  name: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  email: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionText: {
    flex: 1,
    marginLeft: theme.spacing.md,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  languageValue: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  logoutButton: {
    marginTop: theme.spacing.xl,
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.error,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
    width: '80%',
  },
  modalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  languageOption: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  languageOptionText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  closeButton: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.bold,
  },
});

export default ProfileScreen;