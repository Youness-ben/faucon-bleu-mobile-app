import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  Animated, 
  Easing, 
  Alert,
  StatusBar,
  Dimensions,
  Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../UserContext';
import LottieView from 'lottie-react-native';

type RootStackParamList = {
  EditProfile: undefined;
  Invoices: undefined;
  Support: undefined;
  Settings: undefined;
  AccountDeletionConfirmation: undefined;
  Splash: undefined;
};

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

export default function ConductorSettingsScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { logout } = useUser();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setShowLanguageModal(false);
  };

  const OptionItem = ({ icon, text, onPress, rightElement }: { icon: string; text: string; onPress?: () => void; rightElement?: React.ReactNode }) => (
    <TouchableOpacity style={styles.option} onPress={onPress}>
      <View style={styles.optionIconContainer}>
        <Ionicons name={icon as any} size={24} color="#FFFFFF" />
      </View>
      <Text style={styles.optionText}>{text}</Text>
      {rightElement || <Ionicons name="chevron-forward" size={24} color="#8E8E93" />}
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
          onPress: async () => {
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
          onPress: async () => {
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
      <StatusBar barStyle="light-content" backgroundColor="#028dd0" />
      <LinearGradient colors={['#028dd0', '#01579B']} style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.settings')}</Text>
      </LinearGradient>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
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
        </Animated.View>

        <TouchableOpacity onPress={logoff} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={deleteAccount} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>{t('profile.delete_account')}</Text>
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
                  {i18n.language === lang && (
                    <Ionicons name="checkmark" size={24} color="#028dd0" />
                  )}
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#028dd0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 17,
    color: '#1C1C1E',
    fontFamily: 'Poppins-Regular',
  },
  languageValue: {
    fontSize: 15,
    color: '#8E8E93',
    fontFamily: 'Poppins-Regular',
  },
  logoutButton: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: '#028dd0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButton: {
    marginTop: 12,
    marginHorizontal: 20,
    borderColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: width * 0.8,
    maxHeight: height * 0.7,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
    fontFamily: 'Poppins-Bold',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  languageOptionText: {
    fontSize: 17,
    color: '#1C1C1E',
    fontFamily: 'Poppins-Regular',
  },
  closeButton: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: '#028dd0',
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});

