import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

type RootStackParamList = {
  ServiceOrder: { vehicleId: string };
  ServiceHistory: { vehicleId: string };
};

type ConductorHomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  year: number;
  make: string;
  model: string;
  vin: string;
  mileage: number;
  lastService: string;
  fuelType: string;
  transmission: string;
  brandLogo: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
}

const ConductorHomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ConductorHomeScreenNavigationProp>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [showFullVin, setShowFullVin] = useState(false);

  useEffect(() => {
    fetchVehicleData();
    registerForPushNotificationsAsync();
  }, []);

  const fetchVehicleData = async () => {
    // Fetch vehicle and available services data
    // This is a mock implementation. Replace with actual API calls.
    setVehicle({
      id: '1',
      name: 'Peugeot 207 sportium',
      licensePlate: '349458 A 20',
      year: 2011,
      make: 'Peugeot',
      model: '207',
      vin: '1HGBH41JXMN109186',
      mileage: 35000,
      lastService: '2023-04-15',
      fuelType: 'Diesel',
      transmission: 'Manual',
      brandLogo: 'https://api.dabablane.icamob.ma/faucon-demo/logo-peugeot.jpeg',
    });

    setServices([
      { id: '1', name: 'Oil Change', description: 'Regular oil change service' },
      { id: '2', name: 'Tire Rotation', description: 'Rotate tires for even wear' },
      { id: '3', name: 'Brake Inspection', description: 'Inspect and service brakes' },
    ]);
  };

  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Constants.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
      alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (token) {
      // Store the token locally
      await AsyncStorage.setItem('expoPushToken', token);
      // Send the token to your backend
      try {
        await api.post('/api/update-push-token', { token });
      } catch (error) {
        console.error('Error sending push token to backend:', error);
      }
    }
  };

  const handleServiceOrder = (serviceId: string) => {
    navigation.navigate('ServiceOrder', { vehicleId: vehicle?.id || '' });
  };

  const handleServiceHistory = () => {
    navigation.navigate('ServiceHistory', { vehicleId: vehicle?.id || '' });
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

  if (!vehicle) {
    return <View style={styles.container}><Text>{t('conductor.loading')}</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandLogoContainer}>
          <Image
            source={{ uri: vehicle.brandLogo }}
            style={styles.brandLogo}
          />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.vehicleName}>{vehicle.name}</Text>
          <Text style={styles.licensePlate}>{vehicle.licensePlate}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>{t('conductor.vehicleDetails')}</Text>
        <View style={styles.detailsGrid}>
          <DetailItem icon="calendar-outline" label={t('conductor.year')} value={vehicle.year.toString()} />
          <DetailItem icon="car-outline" label={t('conductor.make')} value={vehicle.make} />
          <DetailItem icon="options-outline" label={t('conductor.model')} value={vehicle.model} />
          <DetailItem icon="speedometer-outline" label={t('conductor.mileage')} value={`${vehicle.mileage} mi`} />
          <DetailItem icon="water-outline" label={t('conductor.fuelType')} value={vehicle.fuelType} />
          <DetailItem icon="cog-outline" label={t('conductor.transmission')} value={vehicle.transmission} />
        </View>
        <TouchableOpacity onPress={() => setShowFullVin(!showFullVin)} style={styles.vinContainer}>
          <Ionicons name="barcode-outline" size={24} color={theme.colors.primary} style={styles.vinIcon} />
          <View>
            <Text style={styles.detailLabel}>{t('conductor.vin')}</Text>
            <Text style={styles.detailValue}>
              {showFullVin ? vehicle.vin : vehicle.vin.slice(0, 5) + '...'}
            </Text>
          </View>
          <Ionicons
            name={showFullVin ? 'eye-off-outline' : 'eye-outline'}
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>{t('conductor.availableServices')}</Text>
        {services.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceItem}
            onPress={() => handleServiceOrder(service.id)}
          >
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceDescription}>{service.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.historyButton} onPress={handleServiceHistory}>
        <Ionicons name="time-outline" size={24} color={theme.colors.buttonText} />
        <Text style={styles.historyButtonText}>{t('conductor.viewServiceHistory')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    resizeMode: 'contain',
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
    backgroundColor: theme.colors.surface,
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
  serviceItem: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.sm,
  },
  serviceName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
  },
  serviceDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
    margin: theme.spacing.md,
  },
  historyButtonText: {
    color: theme.colors.buttonText,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
    marginLeft: theme.spacing.sm,
  },
});

export default ConductorHomeScreen;