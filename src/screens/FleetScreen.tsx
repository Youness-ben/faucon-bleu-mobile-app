import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

type RootStackParamList = {
  VehicleDetail: { vehicleId: string };
  AddVehicle: undefined;
};

type FleetScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Vehicle {
  id: string;
  name: string;
  brand: string;
  licensePlate: string;
  logoUrl: string;
}

const FleetScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<FleetScreenNavigationProp>();

  const [vehicles] = useState<Vehicle[]>([
    { id: '1-', name: 'Renault R4', brand: 'Renault', licensePlate: '647586 A 20', logoUrl: 'https://api.dabablane.icamob.ma/faucon-demo/logo-renault.jpeg' },
    { id: '2', name: 'Peugeot 207', brand: 'Peugeot', licensePlate: '83758 A 20', logoUrl: 'https://api.dabablane.icamob.ma/faucon-demo/logo-peugeot.jpeg' },
    { id: '3', name: 'Ford Fiesta', brand: 'Ford', licensePlate: '9385 A 6', logoUrl: 'https://api.dabablane.icamob.ma/faucon-demo/logo-ford.jpeg' },
    { id: '4', name: 'Golf 3', brand: 'Volkswagon', licensePlate: '3957 A 6', logoUrl: 'https://api.dabablane.icamob.ma/faucon-demo/logo-volkswagon.jpeg' },
  ]);

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity
      style={styles.vehicleItem}
      onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
    >
      <Image source={{ uri: item.logoUrl }} style={styles.vehicleLogo} />
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleName}>{item.name}</Text>
        <Text style={styles.vehicleLicensePlate}>{item.licensePlate}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('fleet.title')}</Text>
      <FlatList
        data={vehicles}
        renderItem={renderVehicleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddVehicle')}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>{t('fleet.addVehicle')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.fontWeights.bold,
    marginBottom: theme.spacing.lg,
    color: theme.colors.primary,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    ...theme.elevation.small,
  },
  vehicleLogo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: theme.spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text,
  },
  vehicleLicensePlate: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
    position: 'absolute',
    bottom: theme.spacing.lg,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
  },
  addButtonText: {
    color: 'white',
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    marginLeft: theme.spacing.sm,
  },
});

export default FleetScreen;