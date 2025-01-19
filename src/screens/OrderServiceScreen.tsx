import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, FlatList, SafeAreaView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';
import api from '../api';

type RootStackParamList = {
  OrderService: { serviceType: string; serviceId: number; vehicleId?: number; vehicle?: any };
};

type OrderServiceScreenRouteProp = RouteProp<RootStackParamList, 'OrderService'>;
type OrderServiceScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderService'>;

interface Vehicle {
  id: number;
  brand_name: string;
  model: string;
  plate_number: string;
  year?: number;
  color?: string;
  vin?: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  estimated_duration: number;
  estimated_duration_unite: string;
  base_price: number;
}

const OrderServiceScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<OrderServiceScreenNavigationProp>();
  const route = useRoute<OrderServiceScreenRouteProp>();
  const { serviceId, vehicleId, vehicle } = route.params;

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(vehicle || null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [servicePrice, setServicePrice] = useState<number | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vehicleResponse, vehiclesResponse, serviceResponse] = await Promise.all([
        vehicleId ? api.get(`/client/vehicles/${vehicleId}`) : { data: [] },
        api.get('/client/vehicles'),
        api.get(`/client/services/${serviceId}`),
      ]);
      
      if (vehicleId) {
        setSelectedVehicle(vehicleResponse.data);
      } 
      setVehicles(vehiclesResponse.data);
      setService(serviceResponse.data);

      if (vehicleId) {
        const priceResponse = await api.post('/client/vehicles/client-service-prices', {
          vehicle: vehicleId,
          service: serviceId
        });
        setServicePrice(priceResponse.data || serviceResponse.data.base_price);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(t('services.fetchError'));
    } finally {
      setIsLoading(false);
    }
  }, [serviceId, vehicleId, t]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  useEffect(() => {
    if (selectedVehicle && service) {
      fetchServicePrice(selectedVehicle.id, service.id);
    }
  }, [selectedVehicle, service]);

  const fetchServicePrice = async (vehicleId: number, serviceId: number) => {
    try {
      const response = await api.post('/client/vehicles/client-service-prices', {
        vehicle: vehicleId,
        service: serviceId
      });

      setServicePrice(response.data || service?.base_price);
    } catch (err) {
      console.log("Error fetching service price:", err);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(false);
    setSelectedDate(currentDate);
  };

  const handleConfirmOrder = async () => {
    if (!selectedVehicle || !service) {
      Alert.alert(t('orderService.error'), t('orderService.missingInfo'));
      return;
    }

    setIsLoading(true);
    try {
      const orderData = {
        vehicle_id: selectedVehicle.id,
        service_id: service.id,
        scheduled_at: selectedDate.toISOString().split('T')[0]//`${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()} 00:00:00`,
      };
      const resp = await api.post('/client/service-orders', orderData);
      navigation.navigate('TicketScreen', { serviceId: resp.data.id, service: resp.data });
    } catch (err) {
      console.error('Error confirming service:', err);
      Alert.alert(t('orderService.error'), t('orderService.confirmError'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = () => (
    <LinearGradient colors={['#028dd0', '#01579B']} style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{t('services.orderService')}</Text>
      <View style={styles.headerRight} />
    </LinearGradient>
  );

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity
      style={styles.vehicleItem}
      onPress={() => {
        setSelectedVehicle(item);
        fetchServicePrice(item.id, service?.id || 0);
        setShowVehicleModal(false);
      }}
    >
      <Text style={styles.vehicleName}>{`${item.brand_name} ${item.model}`}</Text>
      <Text style={styles.vehicleLicensePlate}>{item.plate_number}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !service) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error || t('orderService.unknownError')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderHeader()}
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.serviceName}>{service?.name}</Text>
          <Text style={styles.serviceDescription}>{service.description}</Text>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.serviceDuration}>
              {t('services.estimatedDuration', { duration: service.estimated_duration, unite: service.estimated_duration_unite })}
            </Text>
          </View>
          {servicePrice && (
            <View style={styles.detailRow}>
              <Ionicons name="pricetag-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.servicePrice}>
                {t('services.servicePrice')}  {servicePrice >0 ? servicePrice+" MAD" : t('services.quote') } 
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('orderService.selectVehicle')}</Text>
          {selectedVehicle ? (
            <View>
              <Text style={styles.vehicleInfo}>{`${selectedVehicle.brand_name} ${selectedVehicle.model}`}</Text>
              <Text style={styles.vehicleInfo}>{selectedVehicle.plate_number}</Text>
              <TouchableOpacity style={styles.changeVehicleButton} onPress={() => setShowVehicleModal(true)}>
                <Text style={styles.changeVehicleButtonText}>{t('orderService.changeVehicle')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.selectVehicleButton} onPress={() => setShowVehicleModal(true)}>
              <Text style={styles.selectVehicleButtonText}>{t('orderService.selectVehicle')}</Text>
            </TouchableOpacity>
          )}
        </View>

      {/*   <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('orderService.serviceDate')}</Text>
          <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateTimeButtonText}>
              {selectedDate.toLocaleDateString()}
            </Text>
            <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View> */}

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmOrder}
        >
          <Text style={styles.confirmButtonText}>{t('orderService.confirmService')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showVehicleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('orderService.selectVehicle')}</Text>
            <FlatList
              data={vehicles}
              renderItem={renderVehicleItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.vehicleList}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowVehicleModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    paddingTop: theme.spacing.lg,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: 'white',
  },
  headerRight: {
    width: 40,
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
    marginVertical: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.roundness,
  },
  retryButtonText: {
    color: 'white',
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: theme.roundness,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    ...theme.elevation.medium,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  serviceName: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  serviceDescription: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  serviceDuration: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  servicePrice: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  vehicleInfo
: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  changeVehicleButton: {
    marginTop: theme.spacing.sm,
  },
  changeVehicleButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.medium,
  },
  selectVehicleButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  selectVehicleButtonText: {
    color: 'white',
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.medium,
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary + '20',
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  dateTimeButtonText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    ...theme.elevation.small,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: theme.roundness,
    padding: theme.spacing.lg,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  vehicleList: {
    maxHeight: 300,
  },
  vehicleItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary + '20',
  },
  vehicleName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text,
  },
  vehicleLicensePlate: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  modalCloseButton: {
    marginTop: theme.spacing.md,
    alignSelf: 'flex-end',
  },
  modalCloseButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.medium,
  },
});

export default OrderServiceScreen;

