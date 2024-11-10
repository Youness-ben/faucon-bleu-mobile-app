import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../styles/theme';
import api from '../api';

type RootStackParamList = {
  OrderService: { serviceId: number };
};

type OrderServiceScreenRouteProp = RouteProp<RootStackParamList, 'OrderService'>;
type OrderServiceScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderService'>;

interface Service {
  id: number;
  name: string;
  description: string;
  estimated_duration: number;
  base_price: number;
}

const ConductorOrderServiceScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<OrderServiceScreenNavigationProp>();
  const route = useRoute<OrderServiceScreenRouteProp>();
  const { serviceId } = route.params;

  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/vehicle/get-service/${serviceId}`);
      setService(response.data);
    } catch (err) {
      console.error('Error fetching service details:', err);
      setError(t('orderService.fetchError'));
    } finally {
      setIsLoading(false);
    }
  }, [serviceId, t]);

  useFocusEffect(
    useCallback(() => {
      fetchServiceDetails();
    }, [fetchServiceDetails])
  );

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(false);
    setSelectedDate(currentDate);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
      
      <Text style={styles.title}>{t('services.orderService')}</Text>

      <View style={styles.headerRight} />
    </View>
  );
  const handleConfirmOrder = async () => {
    if (!service) return;

    setIsLoading(true);
    try {
      const orderData = {
        service_id: service.id,
        scheduled_at:  selectedDate.getFullYear()+"-"+(selectedDate.getMonth()+1)+"-"+selectedDate.getDate()+" 00:00:00",
      };
      await api.post('/vehicle/confirm-service', orderData);
      Alert.alert(
        t('orderService.success'),
        t('orderService.serviceConfirmed'),
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error('Error confirming service:', err);
      Alert.alert(t('orderService.error'), t('orderService.confirmError'));
    } finally {
      setIsLoading(false);
    }
  };

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
        <Text style={styles.errorText}>{error || t('orderService.unknownError')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchServiceDetails}>
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
        <Text style={styles.sectionTitle}>{t('orderService.serviceDetails')}</Text>
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text style={styles.serviceDescription}>{service.description}</Text>
        <Text style={styles.serviceDuration}>
          {t('services.estimatedDuration', { duration: service.estimated_duration, unite: service.estimated_duration_unite  })}
        </Text>

      </View>

      <View style={styles.section}>
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
      </View>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleConfirmOrder}
      >
        <Text style={styles.confirmButtonText}>{t('orderService.confirmService')}</Text>
      </TouchableOpacity>
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
  serviceName: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  serviceDescription: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
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
  confirmButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
    margin: theme.spacing.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
  },
    safeArea: {
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

export default ConductorOrderServiceScreen;