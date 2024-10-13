import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../styles/theme';

type RootStackParamList = {
  OrderService: { serviceType: string };
};

type OrderServiceScreenRouteProp = RouteProp<RootStackParamList, 'OrderService'>;
type OrderServiceScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderService'>;

interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
}

const OrderServiceScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<OrderServiceScreenNavigationProp>();
  const route = useRoute<OrderServiceScreenRouteProp>();
  const { serviceType } = route.params;

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Mock data - replace with actual data fetching in a real app
  const vehicles: Vehicle[] = [
    { id: '1', name: 'Toyota Camry', licensePlate: 'ABC 123' },
    { id: '2', name: 'Honda Civic', licensePlate: 'XYZ 789' },
    { id: '3', name: 'Ford F-150', licensePlate: 'DEF 456' },
  ];

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(false);
    setSelectedDate(currentDate);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || new Date();
    setShowTimePicker(false);
    setSelectedTime(currentTime);
  };

  const handleSubmit = () => {
    // Here you would typically send the order to your backend
    console.log('Order submitted:', {
      serviceType,
      vehicle: selectedVehicle,
      date: selectedDate,
      time: selectedTime,
    });
    // Navigate to a confirmation screen or back to the services list
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('services.orderService')}</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('services.serviceType')}</Text>
        <Text style={styles.serviceType}>{serviceType}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('services.selectVehicle')}</Text>
        {vehicles.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={[
              styles.vehicleItem,
              selectedVehicle?.id === vehicle.id && styles.selectedVehicle,
            ]}
            onPress={() => setSelectedVehicle(vehicle)}
          >
            <Ionicons
              name={selectedVehicle?.id === vehicle.id ? 'checkbox' : 'square-outline'}
              size={24}
              color={theme.colors.primary}
            />
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{vehicle.name}</Text>
              <Text style={styles.vehicleLicensePlate}>{vehicle.licensePlate}</Text>
            </View>
          </TouchableOpacity>
        ))}
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('services.serviceTime')}</Text>
        <TouchableOpacity style={styles.dateTimeButton}   onPress={() => setShowTimePicker(true)}>
          <Text style={styles.dateTimeButtonText}>
            {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display="default"
            onChange={handleTimeChange}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    color: theme.colors.textSecondary,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary + '20',
  },
  selectedVehicle: {
    backgroundColor: theme.colors.primary + '10',
  },
  vehicleInfo: {
    marginLeft: theme.spacing.md,
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
});

export default OrderServiceScreen;