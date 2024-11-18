import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Image, Modal, Animated, Easing, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';
import { useUser } from '../UserContext';
import { STORAGE_URL } from '../../config';

type RootStackParamList = {
  EditProfile: undefined;
  Invoices: undefined;
  Support: undefined;
  Settings: undefined;
};

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function Component() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const {logout,user} = useUser();

  useEffect(() => {
    console.log(user);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const toggleNotifications = () => setNotificationsEnabled(previousState => !previousState);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setShowLanguageModal(false);
  };

  const OptionItem = ({ icon, text, onPress, rightElement }: { icon: string; text: string; onPress?: () => void; rightElement?: React.ReactNode }) => (
    <TouchableOpacity style={styles.option} onPress={onPress}>
      <View style={styles.optionIconContainer}>
        <Ionicons name={icon as any} size={24} color={theme.colors.surface} />
      </View>
      <Text style={styles.optionText}>{text}</Text>
      {rightElement || <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />}
    </TouchableOpacity>
  );

const deleteAccount = () => {

    Alert.alert(
      t('profile.confirm_delete_account'),
      t('profile.ask_confirm_delete_account'),
      [
        {
          text: t('common.cancel'),
          style: "cancel",
        },
        {
          text: t('common.delete'),
          style: "destructive",
          onPress:async () => {
      
                await logout();
                navigation.navigate("AccountDeletionConfirmation");

            
          },
        },
      ],
      { cancelable: true }
    );
  };

const logoff = () => {

    Alert.alert(
      t('profile.ask_confirm_logout'),
     "",
      [
        {
          text: t('common.cancel'),
          style: "cancel",
        },
        {
          text: t('profile.logout'),
          style: "destructive",
          onPress:async () => {
      
                await logout();
                navigation.navigate("Splash");
          },
        },
      ],
      { cancelable: true }
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Image
            source={{ uri:  user?.avatar? `${STORAGE_URL}/${user?.avatar}`  :'https://via.placeholder.com/150'  }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{user?.last_name+" "+user?.first_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </Animated.View>

        <View style={styles.section}>
          <OptionItem
            icon="person-outline"
            text={t('profile.editProfile')}
            onPress={() => navigation.navigate('EditProfile')}
          />
          <OptionItem
            icon="document-text-outline"
            text={t('profile.invoices')}
            onPress={() => navigation.navigate('Invoices')}
          />
          <OptionItem
            icon="language-outline"
            text={t('profile.language')}
            onPress={() => setShowLanguageModal(true)}
            rightElement={
              <Text style={styles.languageValue}>
                {i18n.language === 'en' ? 'English' : i18n.language === 'fr' ? 'Français' : i18n.language === 'es' ? 'Español' : i18n.language === 'it' ? 'Italiano' : 'العربية'}
              </Text>
            }
          />
          <OptionItem
            icon="help-circle-outline"
            text={t('profile.support')}
            onPress={() => navigation.navigate('Support')}
          />
        </View>

        <TouchableOpacity onPress={logoff} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
        </TouchableOpacity>
        <TouchableOpacity  onPress={deleteAccount} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText} >{t('profile.delete_account')}</Text>
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
              {['en', 'ar', 'fr', 'it', 'es'].map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={styles.languageOption}
                  onPress={() => changeLanguage(lang)}
                >
                  <Text style={styles.languageOptionText}>
                    {lang === 'en' ? 'English' : lang === 'ar' ? 'العربية' : lang === 'fr' ? 'Français' : lang === 'it' ? 'Italiano' : 'Español'}
                  </Text>
                </TouchableOpacity>
              ))}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.xl,
    borderBottomLeftRadius: theme.roundness,
    borderBottomRightRadius: theme.roundness,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.surface,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  name: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.surface,
    marginBottom: theme.spacing.xs,
  },
  email: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.surface,
    opacity: 0.8,
  },
  section: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    marginHorizontal: theme.spacing.md,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: theme.elevation.medium,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  optionText: {
    flex: 1,
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
  deleteButton: {
    marginTop: theme.spacing.xl,
    marginHorizontal: theme.spacing.lg,
    borderColor: theme.colors.error,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.roundness,
    borderWidth:1,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
  },
  deleteButtonText: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
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
    borderBottomColor: theme.colors.secondary,
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