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
  Platform,
  Image,
  TextInput
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../UserContext';
import { STORAGE_URL } from '../../config';
import api from '../api';
import Toast from 'react-native-toast-message';

type RootStackParamList = {
  EditProfile: undefined;
  Invoices: undefined;
  Support: undefined;
  Settings: undefined;
  AccountDeletionConfirmation: undefined;
  Splash: undefined;
  ClientAccounts: undefined;
};

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { logout, user } = useUser();

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

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
    Toast.show({
        type: 'error',
        text1: t('profile.password_mismatch'),
        text2: t('profile.password_mismatch_message'),
      });

      return;
    }
  if (newPassword == '' || newPassword.length<8) {
    Toast.show({
        type: 'error',
        text1: t('profile.password_invalid'),
        text2: t('profile.password_invalid_message'),
      });

      return;
    }
    try {
      await api.post('/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      Alert.alert(t('profile.password_changed'), t('profile.password_changed_message'));
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert(t('profile.password_change_error'), t('profile.password_change_error_message'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#028dd0" />
      <LinearGradient colors={['#028dd0', '#01579B']} style={styles.header}>
        <View style={styles.profileInfo}>
          <Image
            source={{ uri: user?.avatar ? `${STORAGE_URL}/${user?.avatar}` : 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.name}>{user?.last_name + " " + user?.first_name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>
      </LinearGradient>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <OptionItem
            icon="person-outline"
            text={t('profile.editProfile')}
            onPress={() => navigation.navigate('EditProfile')}
          />
    {/*      
    THIS IS COMMENTED BECAUSE OF APPLE , 
    THIS MIGHT CAUSE PROBLEMS IN THE FUTURE DUE TO THEM NOT WANTING ANYTHING RELATED TO MONEY
    <OptionItem
            icon="document-text-outline"
            text={t('profile.invoices')}
            onPress={() => navigation.navigate('Invoices')}
          /> */}
          <OptionItem
            icon="language-outline"
            text={t('profile.language')}
            onPress={() => setShowLanguageModal(true)}
            rightElement={
              <Text style={styles.languageValue}>
                {i18n.language === 'en' ? 'English' : 'Français'/*  i18n.language === 'fr' ? 'Français' : i18n.language === 'es' ? 'Español' : i18n.language === 'it' ? 'Italiano' : 'العربية'*/}
              </Text>
            }
          />
          <OptionItem
            icon="lock-closed-outline"
            text={t('profile.changePassword')}
            onPress={() => setShowPasswordModal(true)}
          />
          <OptionItem
            icon="help-circle-outline"
            text={t('profile.support')}
            onPress={() => navigation.navigate('Support')}
          />
          {user?.role === 'management' && (
          <OptionItem
            icon="people-outline"
            text={t('profile.manageClientAccounts')}
            onPress={() => navigation.navigate('ClientAccounts')}
          />
        )}
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
              {['en', 'fr', /*'ar', 'it', 'es'*/].map((lang) => (
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

        <Modal
          visible={showPasswordModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowPasswordModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('profile.changePassword')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('profile.currentPassword')}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TextInput
                style={styles.input}
                placeholder={t('profile.newPassword')}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TextInput
                style={styles.input}
                placeholder={t('profile.confirmPassword')}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                style={styles.changePasswordButton}
                onPress={changePassword}
              >
                <Text style={styles.changePasswordButtonText}>{t('profile.changePassword')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.closeButtonText}>{t('common.cancel')}</Text>
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
    paddingBottom:50
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  email: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
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
  },
  languageValue: {
    fontSize: 15,
    color: '#8E8E93',
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
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '600',
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
  },
  input: {
    height: 50,
    borderColor: '#E5E5EA',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#1C1C1E',
  },
  changePasswordButton: {
    backgroundColor: '#028dd0',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  changePasswordButtonText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

