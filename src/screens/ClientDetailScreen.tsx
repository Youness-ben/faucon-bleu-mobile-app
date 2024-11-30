import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';
import api from '../api';
import { Picker } from '@react-native-picker/picker';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { STORAGE_URL } from '../../config';

type RootStackParamList = {
  ClientAccounts: undefined;
  ClientDetail: { clientId: number };
};

type ClientDetailScreenRouteProp = RouteProp<RootStackParamList, 'ClientDetail'>;
type ClientDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ClientDetail'>;

interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  can_be_deleted:number;
  avatar?: string;
}
const { width, height } = Dimensions.get('window');
const ClientDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ClientDetailScreenNavigationProp>();
  const route = useRoute<ClientDetailScreenRouteProp>();
  const { clientId } = route.params;

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  useEffect(() => {
    fetchClientDetails();
  }, []);

  const fetchClientDetails = async () => {
    try {
      const response = await api.get(`/client/accounts/${clientId}`);
      setClient(response.data);
      if (response.data.avatar) {
        setAvatarUri(`${STORAGE_URL}/${response.data.avatar}`);
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
      Toast.show({
        type: 'error',
        text1: t('clientDetail.error'),
        text2: t('clientDetail.errorFetching'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClient = async () => {
    if (!client) return;

    try {
      const formData = new FormData();
      formData.append('first_name', client.first_name);
      formData.append('last_name', client.last_name);
      formData.append('phone', client.phone);
      formData.append('role', client.role);

      if (newAvatarUri) {
        const filename = newAvatarUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename as string);
        const type = match ? `image/${match[1]}` : 'image';
        formData.append('avatar', { uri: newAvatarUri, name: filename, type } as any);
      }

      const response = await api.post(`/client/accounts/${clientId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        Toast.show({
          type: 'success',
          text1: t('clientDetail.success'),
          text2: t('clientDetail.updateSuccess'),
        });
        fetchClientDetails(); // Refresh client data
      }
    } catch (error) {
      console.error('Error updating client:', error);
      Toast.show({
        type: 'error',
        text1: t('clientDetail.error'),
        text2: t('clientDetail.updateError'),
      });
    }
  };


  const handleDeleteClient = () => {
    if(client?.can_be_deleted==0)
        return;
    Alert.alert(
      t('clientDetail.deleteConfirmTitle'),
      t('clientDetail.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.delete(`/client/accounts/${clientId}`);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting client:', error);
              Alert.alert(t('clientDetail.error'), t('clientDetail.deleteError'));
            }
          }
        },
      ]
    );
  };


  const handleResetPassword = () => {
    setShowPasswordModal(true);
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: t('clientDetail.password_mismatch'),
        text2: t('clientDetail.password_mismatch_message'),
      });
      return;
    }
    if (newPassword === '' || newPassword.length < 8) {
      Toast.show({
        type: 'error',
        text1: t('clientDetail.password_invalid'),
        text2: t('clientDetail.password_invalid_message'),
      });
      return;
    }
    try {
      await api.post(`client/accounts/${clientId}/reset-password`, {
        new_password: newPassword,
      });
      Toast.show({
        type: 'success',
        text1: t('clientDetail.password_changed'),
        text2: t('clientDetail.password_changed_message'),
      });
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      Toast.show({
        type: 'error',
        text1: t('clientDetail.password_change_error'),
        text2: t('clientDetail.password_change_error_message'),
      });
    }
  };


  const handleChooseAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Toast.show({
        type: 'error',
        text1: t('clientDetail.permissionDenied'),
        text2: t('clientDetail.permissionDeniedMessage'),
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
      setNewAvatarUri(pickerResult.assets[0].uri);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#028dd0" />
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.errorContainer}>
        <Text>{t('clientDetail.clientNotFound')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#028dd0" />
      <LinearGradient colors={['#028dd0', '#01579B']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('clientDetail.title')}</Text>
        {
          client?.can_be_deleted==1 &&
          <>
          
          <TouchableOpacity onPress={handleResetPassword} style={styles.lockButton}>
            <Ionicons name="lock-open-outline" size={24} color="#01579B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteClient} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={24} color="white" />
          </TouchableOpacity></>
        }
      </LinearGradient>
      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.avatarContainer} onPress={handleChooseAvatar}>
        <TouchableOpacity style={styles.avatarContainer} onPress={handleChooseAvatar}>

        <Image 
            source={{ uri: newAvatarUri || avatarUri || 'https://via.placeholder.com/150' }} 
            style={styles.avatar} 
          />

        </TouchableOpacity>
        <Text style={styles.avatarLabel}>{t('addClient.tapToAddAvatar')}</Text>
  

        </TouchableOpacity>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('clientDetail.firstName')}</Text>
          <TextInput
            style={styles.input}
            value={client.first_name}
            onChangeText={(text) => setClient({ ...client, first_name: text })}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('clientDetail.lastName')}</Text>
          <TextInput
            style={styles.input}
            value={client.last_name}
            onChangeText={(text) => setClient({ ...client, last_name: text })}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('clientDetail.email')}</Text>
          <TextInput
            style={styles.input}
            value={client.email}
            onChangeText={(text) => setClient({ ...client, email: text })}
            editable={false}
            keyboardType="email-address"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('clientDetail.phone')}</Text>
          <TextInput
            style={styles.input}
            value={client.phone}
            onChangeText={(text) => setClient({ ...client, phone: text })}
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('clientDetail.role')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={client.role}
              onValueChange={(itemValue) => setClient({ ...client, role: itemValue })}
              style={styles.picker}
              enabled={client?.can_be_deleted===1}
            >
              <Picker.Item label={t('clientDetail.roleResponsable')} value="responsable" />
              <Picker.Item label={t('clientDetail.roleManagement')} value="management" />
            </Picker>
          </View>
        </View>

          <TouchableOpacity style={styles.updateButton} onPress={handleUpdateClient}>
            <Text style={styles.buttonText}>{t('clientDetail.updateButton')}</Text>
          </TouchableOpacity>

      </ScrollView>
      
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('clientDetail.resetPassword')}</Text>
            <TextInput
              style={[styles.input,styles.inputContainer]}
              placeholder={t('clientDetail.newPassword')}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.input}
              placeholder={t('clientDetail.confirmPassword')}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity style={styles.changePasswordButton} onPress={changePassword}>
              <Text style={styles.changePasswordButtonText}>{t('clientDetail.resetPassword')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowPasswordModal(false)}>
              <Text style={styles.closeButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    flex: 1,
  },
  editButton: {
    marginLeft: 15,
  },
  deleteButton: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
  },
  lockButton: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
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
  updateButton: {
    backgroundColor: '#028dd0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  resetPasswordButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 5,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarLabel: {
    textAlign: 'center',
    color: theme.colors.primary,
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
  closeButton: {
    marginTop: 12,
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 17,
    color: '#1C1C1E',
    fontWeight: '600',
  },
});

export default ClientDetailScreen;

