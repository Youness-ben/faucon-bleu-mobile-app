import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import api from '../api';
import { STORAGE_URL } from '../../config';

type RootStackParamList = {
  VehicleDetail: { vehicleId: number };
  OrderService: { vehicleId: number };
  ServiceHistory: { vehicleId: number };
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

const VehicleDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<VehicleDetailScreenNavigationProp>();
  const route = useRoute<VehicleDetailScreenRouteProp>();
  const { vehicleId } = route.params;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullVin, setShowFullVin] = useState(false);

  const fetchVehicleDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Vehicle>(`/client/vehicles/${vehicleId}`);
      setVehicle(response.data);
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
  console.log(`${STORAGE_URL}/${vehicle.logo_url}`);
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
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

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>{t('vehicleDetail.details')}</Text>
        <View style={styles.detailsGrid}>
          <DetailItem icon="calendar-outline" label={t('vehicleDetail.year')} value={vehicle.year.toString()} />
          <DetailItem icon="car-outline" label={t('vehicleDetail.make')} value={vehicle.brand_name} />
          <DetailItem icon="options-outline" label={t('vehicleDetail.model')} value={vehicle.model} />
          <DetailItem icon="speedometer-outline" label={t('vehicleDetail.kilometers')} value={`${vehicle.kilometers} km`} />
          <DetailItem icon="water-outline" label={t('vehicleDetail.fuelType')} value={vehicle.fuel_type} />
          <DetailItem icon="cog-outline" label={t('vehicleDetail.transmission')} value={vehicle.transmission} />
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

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('OrderService', { vehicleId: vehicle.id })}
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
    resizeMode: 'stretch'
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
});

export default VehicleDetailScreen;