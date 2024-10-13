import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

type RootStackParamList = {
  VehicleDetail: { vehicleId: string };
  OrderService: { vehicleId: string };
  ServiceHistory: { vehicleId: string };
};

type VehicleDetailScreenRouteProp = RouteProp<RootStackParamList, 'VehicleDetail'>;
type VehicleDetailScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const VehicleDetailScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<VehicleDetailScreenNavigationProp>();
  const route = useRoute<VehicleDetailScreenRouteProp>();
  const { vehicleId } = route.params;

  const vehicleData = {
    id: vehicleId,
    name: 'Peugeot 207 sportium',
    licensePlate: '349458 A 20',
    year: 2011,
    make: 'Peugeut',
    model: '207',
    vin: '1HGBH41JXMN109186',
    mileage: 35000,
    lastService: '2023-04-15',
    fuelType: 'Diesel',
    transmission: 'Manual',
    brandLogo: 'https://api.dabablane.icamob.ma/faucon-demo/logo-peugeot.jpeg', // Replace with actual logo URL
  };


  const [showFullVin, setShowFullVin] = useState(false);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.brandLogoContainer}>
          <Image
            source={{ uri: vehicleData.brandLogo }}
            style={styles.brandLogo}
          />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.vehicleName}>{vehicleData.name}</Text>
          <Text style={styles.licensePlate}>{vehicleData.licensePlate}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>{t('vehicleDetail.details')}</Text>
        <View style={styles.detailsGrid}>
          <DetailItem icon="calendar-outline" label={t('vehicleDetail.year')} value={vehicleData.year.toString()} />
          <DetailItem icon="car-outline" label={t('vehicleDetail.make')} value={vehicleData.make} />
          <DetailItem icon="options-outline" label={t('vehicleDetail.model')} value={vehicleData.model} />
          <DetailItem icon="speedometer-outline" label={t('vehicleDetail.mileage')} value={`${vehicleData.mileage} mi`} />
          <DetailItem icon="water-outline" label={t('vehicleDetail.fuelType')} value={vehicleData.fuelType} />
          <DetailItem icon="cog-outline" label={t('vehicleDetail.transmission')} value={vehicleData.transmission} />
        </View>
        <TouchableOpacity onPress={() => setShowFullVin(!showFullVin)} style={styles.vinContainer}>
          <Ionicons name="barcode-outline" size={24} color={theme.colors.primary} style={styles.vinIcon} />
          <View>
            <Text style={styles.detailLabel}>{t('vehicleDetail.vin')}</Text>
            <Text style={styles.detailValue}>
              {showFullVin ? vehicleData.vin : vehicleData.vin.slice(0, 5) + '...'}
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
          onPress={() => navigation.navigate('OrderService', { vehicleId: vehicleData.id })}
        >
          <Ionicons name="construct-outline" size={24} color="white" />
          <Text style={styles.buttonText}>{t('vehicleDetail.orderService')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('ServiceHistory', { vehicleId: vehicleData.id })}
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