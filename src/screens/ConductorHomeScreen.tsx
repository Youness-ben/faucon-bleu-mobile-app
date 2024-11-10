import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, FlatList, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import api from '../api';
import { STORAGE_URL } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  OrderService: { serviceId: number };
};

type ConductorHomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderService'>;

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

interface Service {
  id: number;
  name: string;
  description: string;
  scheduled_at: string;
}

const ConductorHomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ConductorHomeScreenNavigationProp>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [upcomingServices, setUpcomingServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullVin, setShowFullVin] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vehicleResponse, servicesResponse] = await Promise.all([
        api.get('/vehicle/data'),
        api.get('/vehicle/upcoming-services'),
      ]);
      setVehicle(vehicleResponse.data);
      setUpcomingServices(servicesResponse.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(t('conductorHome.fetchError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

/*   useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  ); */
  useEffect(() => {
    fetchData();
    registerForPushNotificationsAsync();
  }, [fetchData]);

  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Constants.isDevice || true) {
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
      await AsyncStorage.setItem('expoPushToken', token);
      try { 
        await api.post('/vehicle/update-push-token', { token });
      } catch (error) {
        console.error('Error sending push token to backend:', error);
      }
    }
  };
  const handleOrderService = (serviceId: number) => {
    navigation.navigate('OrderService', { serviceId });
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
        <Text style={styles.errorText}>{error || t('conductorHome.unknownError')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandLogoContainer}>
          <Image
            source={{ uri: `${STORAGE_URL}/${vehicle.logo_url}` }}
            style={styles.brandLogo}
            width={24}
            defaultSource={require('../../assets/logo-faucon.png')}
          />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.vehicleName}>{`${vehicle.brand_name} ${vehicle.model}`}</Text>
          <Text style={styles.licensePlate}>{vehicle.plate_number}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>{t('conductorHome.vehicleDetails')}</Text>
        <View style={styles.detailsGrid}>
          <DetailItem icon="calendar-outline" label={t('conductorHome.year')} value={vehicle.year.toString()} />
          <DetailItem icon="speedometer-outline" label={t('conductorHome.kilometers')} value={`${vehicle.kilometers} km`} />
          <DetailItem icon="water-outline" label={t('conductorHome.fuelType')} value={t(`conductorHome.fuelTypes.${vehicle.fuel_type}`)} />
          <DetailItem icon="cog-outline" label={t('conductorHome.transmission')} value={t(`conductorHome.transmissionTypes.${vehicle.transmission}`)} />
        </View>
        <TouchableOpacity onPress={() => setShowFullVin(!showFullVin)} style={styles.vinContainer}>
          <Ionicons name="barcode-outline" size={24} color={theme.colors.primary} style={styles.vinIcon} />
          <View>
            <Text style={styles.detailLabel}>{t('conductorHome.vin')}</Text>
            <Text style={styles.detailValue}>
              {showFullVin ? vehicle.vin_number : vehicle.vin_number.slice(0, 5) + '...'}
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
        <Text style={styles.sectionTitle}>{t('conductorHome.upcomingServices')}</Text>
        {upcomingServices.length > 0 ? (
          <FlatList
            data={upcomingServices}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.serviceItem}
                onPress={() => handleOrderService(item.id)}
              >
                <Text style={styles.serviceName}>{item.service.name}</Text>
                <Text style={styles.serviceDescription}>{item.service.description}</Text>
                <Text style={styles.serviceDate}>{new Date(item.scheduled_at).toLocaleDateString()}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.noServicesText}>{t('conductorHome.noUpcomingServices')}</Text>
        )}
      </View>
    </ScrollView>
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
  serviceDate: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  noServicesText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
});

export default ConductorHomeScreen;