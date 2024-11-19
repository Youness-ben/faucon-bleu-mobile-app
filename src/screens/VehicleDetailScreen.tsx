import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, TextInput, Alert, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { theme } from '../styles/theme';
import api from '../api';
import { STORAGE_URL } from '../../config';

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

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullVin, setShowFullVin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedVehicle, setEditedVehicle] = useState<Vehicle | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [toast, setToast] = useState<ToastProps>({ visible: false, message: '', type: 'success' });
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
  };

  const fetchVehicleDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Vehicle>(`/client/vehicles/${vehicleId}`);
      setVehicle(response.data);
      setEditedVehicle(response.data);
    } catch (err) {
      console.error('Error fetching vehicle details:', err);
      setError(t('vehicleDetail.fetchError'));
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId, t]);

  useEffect(() => {
    fetchVehicleDetails();
  }, [fetchVehicleDetails]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedVehicle) return;

    setIsLoading(true);
    try {
      const response = await api.put(`/client/vehicles/${vehicleId}`, editedVehicle);
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
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
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

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Services', { vehicleId: vehicle.id, vehicule: vehicle })}
          >
            <Ionicons name="construct-outline" size={24} color="white" />
            <Text style={styles.buttonText}>{t('vehicleDetail.orderService')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('ServiceHistory', { vehicleId: vehicle.id })}
          >
            <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
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
            <DetailItem icon="calendar-outline" label={t('vehicleDetail.year')} value={vehicle.year.toString()} />
            <DetailItem icon="car-outline" label={t('vehicleDetail.make')} value={vehicle.brand_name} />
            <DetailItem icon="options-outline" label={t('vehicleDetail.model')} value={vehicle.model} />
            {isEditing ? (
              <EditableDetailItem
                label={t('vehicleDetail.kilometers')}
                value={editedVehicle?.kilometers.toString() || ''}
                onChangeText={(text) => setEditedVehicle(prev => prev ? {...prev, kilometers: parseInt(text)} : null)}
                keyboardType="numeric"
              />
            ) : (
              <DetailItem icon="speedometer-outline" label={t('vehicleDetail.kilometers')} value={`${vehicle.kilometers} km`} />
            )}
            {isEditing ? (
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
            ) : (
              <DetailItem icon="water-outline" label={t('vehicleDetail.fuelType')} value={t(`vehicleDetail.fuelTypes.${vehicle.fuel_type}`)} />
            )}
            {isEditing ? (
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
            ) : (
              <DetailItem icon="cog-outline" label={t('vehicleDetail.transmission')} value={t(`vehicleDetail.transmissionTypes.${vehicle.transmission}`)} />
            )}
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
          <View style={styles.editButtonsContainer}>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Ionicons name="save-outline" size={24} color="white" />
              <Text style={styles.buttonText}>{t('vehicleDetail.save')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
              <Ionicons name="close-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.buttonText, styles.cancelButtonText]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={styles.accordionHeader} 
          onPress={() => setShowPasswordReset(!showPasswordReset)}
        >
          <Text style={styles.accordionTitle}>{t('vehicleDetail.resetConductorPassword')}</Text>
          <Ionicons 
            name={showPasswordReset ? 'chevron-up-outline' : 'chevron-down-outline'} 
            size={24} 
            color={theme.colors.primary} 
          />
        </TouchableOpacity>
        
        {showPasswordReset && (
          <View style={styles.passwordResetContainer}>
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
        )}
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
  <View style={styles.detailItem}>
    <View>
      <Text style={styles.detailLabel}>{label}</Text>
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
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.sm,
    borderRadius: theme.roundness,
  },
  retryButtonText: {
    color: 'white',
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  brandLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
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
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: 'white',
  },
  licensePlate: {
    fontSize: theme.typography.sizes.lg,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: theme.roundness,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    ...theme.elevation.medium,
  },
  infoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
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
    marginBottom: theme.spacing.md,
  },
  detailIcon: {
    marginRight: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeights.medium,
  },
  editableDetailValue: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeights.medium,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary,
  },
  vinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  vinIcon: {
    marginRight: theme.spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  buttonText: {
    color: 'white',
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
    marginLeft: theme.spacing.sm,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: theme.spacing.sm,
    padding: 8,
    borderRadius: 10,
  },
  editButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  passwordResetContainer: {
    backgroundColor: 'white',
    borderRadius: theme.roundness,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    ...theme.elevation.medium,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  pickerContainer: {
    width: '48%',
    marginBottom: theme.spacing.md,
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
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.md,
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  saveButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  cancelButtonText: {
    color: theme.colors.primary,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderRadius: theme.roundness,
    ...theme.elevation.small,
  },
  accordionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
  },
});

export default VehicleDetailScreen;