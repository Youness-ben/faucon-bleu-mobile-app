import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, FlatList, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../styles/theme';
import api from '../api';

type RootStackParamList = {
  OrderService: { serviceType: string; serviceId: number };
};

type OrderServiceScreenRouteProp = RouteProp<RootStackParamList, 'OrderService'>;
type OrderServiceScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderService'>;

interface Vehicle {
  id: number;
  brand_name: string;
  model: string;
  plate_number: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  estimated_duration: number;
  base_price: number;
}

const OrderServiceScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<OrderServiceScreenNavigationProp>();
  const route = useRoute<OrderServiceScreenRouteProp>();
  const { serviceId } = route.params;

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [servicePrice, setServicePrice] = useState(null);
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vehiclesResponse, serviceResponse] = await Promise.all([
        api.get('/client/vehicles'),
        api.get(`/client/services/${serviceId}`),
      ]);
      setVehicles(vehiclesResponse.data);
      setService(serviceResponse.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(t('services.fetchError'));
    } finally {
      setIsLoading(false);
    }
  }, [serviceId, t]);

   useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );
 
 const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
      
      <Text style={styles.title}>{t('services.orderService')}</Text>

      <View style={styles.headerRight} />
    </View>
  );
  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(false);
    setSelectedDate(currentDate);
  };


  const handleSubmit = async () => {
    if (!selectedVehicle || !service) return;

    const scheduledAt =  selectedDate.getFullYear()+"-"+(selectedDate.getMonth()+1)+"-"+selectedDate.getDate()+" 00:00:00";

    const orderData = {
      vehicle_id: selectedVehicle.id,
      service_id: service.id,
      scheduled_at: scheduledAt,
    };

    try {
      const response = await api.post('/client/service-orders', orderData);
      console.log('Order submitted:', response.data);
      navigation.navigate("ServiceHistory");
    } catch (error) {
      console.error('Error submitting order:', error);
      setError(t('services.submitError'));
    }
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity
      style={styles.vehicleItem}
      onPress={async () => {
        setSelectedVehicle(item);
        //FETCH PRICE
        try{
        // setServicePrice(null);

        const response = await api.post(`/client/vehicles/client-service-prices?`,{
          vehicle : item.id ,
          service : service?.id
        });
          if(response.data){
            setServicePrice(response.data);
          }else
            setServicePrice(service?.base_price);

        }catch(err){
        console.log("-ses",err);

        }
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
          <Text style={styles.errorText}>{error || t('services.serviceNotFound')}</Text>
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
        <Text style={styles.sectionTitle}>{t('services.serviceDetails')}</Text>
        <Text style={styles.serviceType}>{service.name}</Text>
        <Text style={styles.serviceDescription}>{service.description}</Text>
        <Text style={styles.serviceDuration}>
          {t('services.estimatedDuration', { duration: service.estimated_duration, unite: service.estimated_duration_unite  })}
        </Text>
        {servicePrice &&
        <Text style={styles.servicePrice}>
          {t('services.servicePrice')} {servicePrice} MAD
        </Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('services.selectVehicle')}</Text>
        <TouchableOpacity
          style={styles.vehicleSelector}
          onPress={() => setShowVehicleModal(true)}
        >
          <Text style={styles.vehicleSelectorText}>
            {selectedVehicle
              ? `${selectedVehicle.brand_name} ${selectedVehicle.model}`
              : t('services.selectVehiclePrompt')}
          </Text>
          <Ionicons name="chevron-down" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('services.serviceDate')}</Text>
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
          />
        )}
      </View>

  
      <TouchableOpacity
        style={[
          styles.submitButton,
          (!selectedVehicle || !selectedDate || !selectedTime) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!selectedVehicle || !selectedDate || !selectedTime}
      >
        <Text style={styles.submitButtonText}>{t('services.confirmOrder')}</Text>
      </TouchableOpacity>

      <Modal
        visible={showVehicleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('services.selectVehicle')}</Text>
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
      
    </ScrollView>  
      </SafeAreaView>
  );
};

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
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary,
    padding: theme.spacing.md,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: theme.roundness,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    ...theme.elevation.small,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  serviceType: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  serviceDescription: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  serviceDuration: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  servicePrice: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary,
  },
  vehicleSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary + '20',
    borderRadius: theme.roundness,
    padding: theme.spacing.sm,
  },
  vehicleSelectorText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary + '20',
    borderRadius: theme.roundness,
    padding: theme.spacing.sm,
  },
  dateTimeButtonText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  submitButtonText: {
    color: 'white',
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  }
  
  ,  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
  },
  headerRight: {
    width: 40, // To balance the back button on the left
  },
});

export default OrderServiceScreen;