import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';
import api from '../api';
import { Picker } from '@react-native-picker/picker';

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
}

const ClientDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ClientDetailScreenNavigationProp>();
  const route = useRoute<ClientDetailScreenRouteProp>();
  const { clientId } = route.params;

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchClientDetails();
  }, []);

  const fetchClientDetails = async () => {
    try {
      const response = await api.get(`/client/accounts/${clientId}`);
      setClient(response.data);
    } catch (error) {
      console.error('Error fetching client details:', error);
      Alert.alert(t('clientDetail.error'), t('clientDetail.errorFetching'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClient = async () => {
    if (!client) return;

    try {
      const response = await api.put(`/client/accounts/${clientId}`, client);
      if (response.status === 200) {
        Alert.alert(t('clientDetail.success'), t('clientDetail.updateSuccess'));
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating client:', error);
      Alert.alert(t('clientDetail.error'), t('clientDetail.updateError'));
    }
  };

  const handleDeleteClient = () => {
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
    Alert.alert(
      t('clientDetail.resetPasswordConfirmTitle'),
      t('clientDetail.resetPasswordConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.reset'), 
          onPress: async () => {
            try {
              await api.post(`/management/clients/${clientId}/reset-password`);
              Alert.alert(t('clientDetail.success'), t('clientDetail.passwordResetSuccess'));
            } catch (error) {
              console.error('Error resetting password:', error);
              Alert.alert(t('clientDetail.error'), t('clientDetail.passwordResetError'));
            }
          }
        },
      ]
    );
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
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editButton}>
          <Ionicons name={isEditing ? "checkmark" : "create-outline"} size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeleteClient} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>
      <ScrollView style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('clientDetail.firstName')}</Text>
          <TextInput
            style={styles.input}
            value={client.first_name}
            onChangeText={(text) => setClient({ ...client, first_name: text })}
            editable={isEditing}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('clientDetail.lastName')}</Text>
          <TextInput
            style={styles.input}
            value={client.last_name}
            onChangeText={(text) => setClient({ ...client, last_name: text })}
            editable={isEditing}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('clientDetail.email')}</Text>
          <TextInput
            style={styles.input}
            value={client.email}
            onChangeText={(text) => setClient({ ...client, email: text })}
            editable={isEditing}
            keyboardType="email-address"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('clientDetail.phone')}</Text>
          <TextInput
            style={styles.input}
            value={client.phone}
            onChangeText={(text) => setClient({ ...client, phone: text })}
            editable={isEditing}
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('clientDetail.role')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={client.role}
              onValueChange={(itemValue) => setClient({ ...client, role: itemValue })}
              enabled={isEditing}
              style={styles.picker}
            >
              <Picker.Item label={t('clientDetail.roleResponsable')} value="responsable" />
              <Picker.Item label={t('clientDetail.roleManagement')} value="management" />
            </Picker>
          </View>
        </View>
        {isEditing && (
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdateClient}>
            <Text style={styles.buttonText}>{t('clientDetail.updateButton')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.resetPasswordButton} onPress={handleResetPassword}>
          <Text style={styles.buttonText}>{t('clientDetail.resetPasswordButton')}</Text>
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
    marginLeft: 15,
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
});

export default ClientDetailScreen;

