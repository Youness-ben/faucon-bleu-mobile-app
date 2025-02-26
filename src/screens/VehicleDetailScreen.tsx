import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput, Alert, Animated, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';
import api from '../api';
import { STORAGE_URL } from '../../config';
import { useUser } from '../UserContext';
import LottieView from 'lottie-react-native';

type RootStackParamList = {
  VehicleDetail: { vehicleId: number };
  OrderService: { vehicleId: number };
  ServiceHistory: { vehicleId: number };
  Fleet: undefined;
  Services: { vehicleId: number; vehicule: Vehicle };
};

type VehicleDetailScreenRouteProp = RouteProp<RootStackParamList, 'VehicleDetail'>;
type VehicleDetailScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Vehicle {
  id: number;
  brand_name: string;
  model: string;
  plate_number: string;
  year: number;
  vin_number: string;
  kilometers: number;
  last_service_date: string;
  fuel_type: string;
  transmission: string;
  logo_url: string;
  client_id: number | null;
  conductor_name: string;
  responsable_name?: string; // Added responsable_name
}

interface Client {
  id: number;
  first_name: string;
  last_name: string;
}

interface ToastProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
}

const fuelTypes = ['gasoline', 'diesel', 'electric', 'hybrid'];
const transmissionTypes = ['manual', 'automatic'];

const Toast: React.FC<ToastProps> = ({ visible, message, type }) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        { opacity: fadeAnim },
        type === 'success' ? styles.successToast : styles.errorToast,
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const VehicleDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<VehicleDetailScreenNavigationProp>();
  const route = useRoute<VehicleDetailScreenRouteProp>();
  const { vehicleId } = route.params;
  const { user } = useUser();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullVin, setShowFullVin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedVehicle, setEditedVehicle] = useState<Vehicle | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [toast, setToast] = useState<ToastProps>({ visible: false, message: '', type: 'success' });
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [conductorName, setConductorName] = useState('');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
  };

  const fetchClients = useCallback(async () => {
    try {
      const response = await api.get<Client[]>('/client/responsable/list');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      showToast(t('vehicleDetail.clientFetchError'), 'error');
    }
  }, [t]);

  const fetchVehicleDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Vehicle>(`/client/vehicles/${vehicleId}`);
      setVehicle(response.data);
      setEditedVehicle(response.data);
      setSelectedClientId(response.data.client_id);
      setConductorName(response.data.conductor_name);
    } catch (err) {
      console.error('Error fetching vehicle details:', err);
      setError(t('vehicleDetail.fetchError'));
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId, t]);

  useEffect(() => {
    fetchVehicleDetails();
    fetchClients();
  }, [fetchVehicleDetails, fetchClients]);

  const handleEdit = () => {
    setEditedVehicle(vehicle);
    setSelectedClientId(vehicle?.client_id || null);
    setConductorName(vehicle?.conductor_name || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedVehicle) return;

    setIsLoading(true);
    try {
      const updatedVehicle = selectedClientId ? {
        ...editedVehicle,
        client_id: selectedClientId,
        conductor_name: conductorName,
      } : {
        ...editedVehicle,
        conductor_name: conductorName,
      };
      const response = await api.put(`/client/vehicles/${vehicleId}`, updatedVehicle);
      if (response.status === 200) {
        setVehicle(response.data);
        setIsEditing(false);
        showToast(t('vehicleDetail.updateSuccess'), 'success');
      }
    } catch (err) {
      console.error('Error updating vehicle:', err);
      showToast(t('vehicleDetail.updateFailed'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('vehicleDetail.deleteConfirmTitle'),
      t('vehicleDetail.deleteConfirmMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await api.delete(`/client/vehicles/${vehicleId}`);
              navigation.navigate('Fleet');
              showToast(t('vehicleDetail.deleteSuccess'), 'success');
            } catch (err) {
              console.error('Error deleting vehicle:', err);
              showToast(t('vehicleDetail.deleteFailed'), 'error');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      showToast(t('vehicleDetail.enterNewPassword'), 'error');
      return;
    }

    setIsLoading(true);
    try {
      await api.post(`/client/vehicles/${vehicleId}/reset-password`, { conductor_password: newPassword });
      showToast(t('vehicleDetail.passwordResetSuccess'), 'success');
      setNewPassword('');
    } catch (err) {
      console.error('Error resetting password:', err);
      showToast(t('vehicleDetail.passwordResetFailed'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedVehicle(vehicle);
    setSelectedClientId(vehicle?.client_id || null);
    setConductorName(vehicle?.conductor_name || '');
  };

   if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../assets/loading-animation.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
      </View>
    );
  }
  if (error || !vehicle) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || t('vehicleDetail.unknownError')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchVehicleDetails}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#028dd0', '#01579B']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.vehicleInfoContainer}>
            <View style={styles.brandLogoContainer}>
              <Image
                source={{ uri: `${STORAGE_URL}/${vehicle.logo_url}` }}
                style={styles.brandLogo}
                defaultSource={require('../../assets/logo-faucon.png')}
              />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.vehicleName}>{`${vehicle.brand_name} ${vehicle.model}`}</Text>
              <Text style={styles.licensePlate}>{vehicle.plate_number}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Services', { vehicleId: vehicle.id, vehicule: vehicle })}
          >
            <Ionicons name="construct-outline" size={24} color="white" />
            <Text style={styles.primaryButtonText}>{t('vehicleDetail.orderService')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('ServiceHistory', { vehicleId: vehicle.id })}
          >
            <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.secondaryButtonText}>
              {t('vehicleDetail.serviceHistory')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Text style={styles.sectionTitle}>{t('vehicleDetail.details')}</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={handleEdit} style={[styles.headerButton, styles.editButton]}>
                <Ionicons name="pencil-outline" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={[styles.headerButton, styles.deleteButton]}>
                <Ionicons name="trash-outline" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.detailsGrid}>
            <DetailItem
              icon="person-outline"
              label={t('vehicleDetail.responsable')}
              value={vehicle.responsable_name ? vehicle.responsable_name : t('vehicleDetail.noResponsable')}
            />
            <DetailItem
              icon="person-circle-outline"
              label={t('vehicleDetail.conductorName')}
              value={vehicle.conductor_name || t('vehicleDetail.noConductorName')}
            />
            <DetailItem icon="calendar-outline" label={t('vehicleDetail.year')} value={vehicle.year.toString()} />
            <DetailItem icon="car-outline" label={t('vehicleDetail.make')} value={vehicle.brand_name} />
            <DetailItem icon="options-outline" label={t('vehicleDetail.model')} value={vehicle.model} />
            <DetailItem icon="speedometer-outline" label={t('vehicleDetail.kilometers')} value={`${vehicle.kilometers} km`} />
            <DetailItem icon="water-outline" label={t('vehicleDetail.fuelType')} value={t(`vehicleDetail.fuelTypes.${vehicle.fuel_type}`)} />
            <DetailItem icon="cog-outline" label={t('vehicleDetail.transmission')} value={t(`vehicleDetail.transmissionTypes.${vehicle.transmission}`)} />
          </View>
          <TouchableOpacity onPress={() => setShowFullVin(!showFullVin)} style={styles.vinContainer}>
            <Ionicons name="barcode-outline" size={24} color={theme.colors.primary} style={styles.vinIcon} />
            <View>
              <Text style={styles.detailLabel}>{t('vehicleDetail.vin')}</Text>
              <Text style={styles.detailValue}>
                {showFullVin ? vehicle.vin_number : vehicle?.vin_number?.slice(0, 5) + '...'}
              </Text>
            </View>
            <Ionicons
              name={showFullVin ? 'eye-off-outline' : 'eye-outline'}
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>

        {isEditing && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={isEditing}
            onRequestClose={handleCancel}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <ScrollView>
                  <Text style={styles.modalTitle}>{t('vehicleDetail.edit')}</Text>
                  {user?.role === 'management' && (
                    <View style={styles.pickerContainer}>
                      <Text style={styles.detailLabel}>{t('vehicleDetail.responsable')}</Text>
                      <Picker
                        selectedValue={selectedClientId}
                        onValueChange={(itemValue) => setSelectedClientId(itemValue)}
                        style={styles.picker}
                      >
                        <Picker.Item label={t('vehicleDetail.noResponsable')} value={null} />
                        {clients.map((client) => (
                          <Picker.Item key={client.id} label={`${client.first_name} ${client.last_name}`} value={client.id} />
                        ))}
                      </Picker>
                    </View>
                  )}

                  <EditableDetailItem
                    label={t('vehicleDetail.conductorName')}
                    
                    value={conductorName}
                    onChangeText={setConductorName}
                  />
                  <EditableDetailItem
                    label={t('vehicleDetail.kilometers')}
                    value={editedVehicle?.kilometers.toString() || ''}
                    onChangeText={(text) => setEditedVehicle(prev => prev ? {...prev, kilometers: parseInt(text)} : null)}
                    keyboardType="numeric"
                    
                  />
                  <View style={styles.pickerContainer}>
                    <Text style={styles.detailLabel}>{t('vehicleDetail.fuelType')}</Text>
                    <Picker
                      selectedValue={editedVehicle?.fuel_type}
                      onValueChange={(itemValue) => setEditedVehicle(prev => prev ? {...prev, fuel_type: itemValue} : null)}
                      style={styles.picker}
                    >
                      {fuelTypes.map((type) => (
                        <Picker.Item key={type} label={t(`vehicleDetail.fuelTypes.${type}`)} value={type} />
                      ))}
                    </Picker>
                  </View>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.detailLabel}>{t('vehicleDetail.transmission')}</Text>
                    <Picker
                      selectedValue={editedVehicle?.transmission}
                      onValueChange={(itemValue) => setEditedVehicle(prev => prev ? {...prev, transmission: itemValue} : null)}
                      style={styles.picker}
                    >
                      {transmissionTypes.map((type) => (
                        <Picker.Item key={type} label={t(`vehicleDetail.transmissionTypes.${type}`)} value={type} />
                      ))}
                    </Picker>
                  </View>
                </ScrollView>
                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={handleCancel}>
                    <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>{t('vehicleDetail.save')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
  
          <View style={styles.passwordResetContainer}>
          <Text style={styles.accordionTitle}>{t('vehicleDetail.resetConductorPassword')}</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder={t('vehicleDetail.enterNewPassword')}
              secureTextEntry
            />
            <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
              <Ionicons name="key-outline" size={24} color="white" />
              <Text style={styles.buttonText}>{t('vehicleDetail.resetPassword')}</Text>
            </TouchableOpacity>
          </View>
        
      </ScrollView>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </View>
  );
};

const DetailItem: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={styles.detailItem}>
    <Ionicons name={icon} size={24} color={theme.colors.primary} style={styles.detailIcon} />
    <View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const EditableDetailItem: React.FC<{ label: string; value: string; onChangeText: (text: string) => void; keyboardType?: 'default' | 'numeric' }> = ({ label, value, onChangeText, keyboardType = 'default' }) => (
  <View style={[styles.detailItem,{minWidth:'100%',}]}>
    <View>
      <Text style={[styles.detailLabel]}>{label}</Text>
      <TextInput
        style={styles.editableDetailValue}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#028dd0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  vehicleInfoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  brandLogo: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain'
  },
  headerTextContainer: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  licensePlate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    padding: 15,
    flex: 1,
    marginRight: 10,
    ...theme.elevation.small,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 10,
    padding: 15,
    flex: 1,
    marginLeft: 10,
    ...theme.elevation.small,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 15,
    marginBottom:0,
    paddingBottom:0,
    padding: 20,
    ...theme.elevation.medium,
  },
  infoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
  },
  detailIcon: {
    marginRight: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  editableDetailValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
    minWidth:'100%',
    borderBottomWidth: 1,
    borderBottomColor: '#028dd0',
  },
  vinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  vinIcon: {
    marginRight: 10,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 10,
  },
  editButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#028dd0',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  passwordResetContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 5,
    paddingTop:0,
    padding: 20,
    ...theme.elevation.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  toast: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  successToast: {
    backgroundColor: 'rgba(0, 128, 0, 0.7)',
  },
  errorToast: {
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
  },
  toastText: {
    color: 'white',
    fontSize: 16,
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#028dd0',
    borderRadius: 10,
    padding: 15,
    flex: 1,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  saveButton: {
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#028dd0',
  },
  cancelButtonText: {
    color: '#028dd0',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
    ...theme.elevation.small,
  },
  accordionTitle: {
    fontSize: 16,
    marginStart:15,
    paddingVertical:15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginRight: 10,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  cancelButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default VehicleDetailScreen;

