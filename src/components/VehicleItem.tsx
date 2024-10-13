import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

type RootStackParamList = {
  VehicleDetail: { vehicleId: string };
};

type VehicleItemNavigationProp = StackNavigationProp<RootStackParamList, 'VehicleDetail'>;

interface VehicleItemProps {
  id: string;
  name: string;
  licensePlate: string;
  lastService: string;
}

const VehicleItem: React.FC<VehicleItemProps> = ({ id, name, licensePlate, lastService }) => {
  const navigation = useNavigation<VehicleItemNavigationProp>();

  return (
    <TouchableOpacity 
      style={styles.vehicleItem}
      onPress={() => navigation.navigate('VehicleDetail', { vehicleId: id })}
    >
      <View style={styles.vehicleIcon}>
        <Ionicons name="car-outline" size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleName} numberOfLines={1} ellipsizeMode="tail">{name}</Text>
        <View style={styles.vehicleDetails}>
          <View style={styles.licensePlateContainer}>
            <Ionicons name="card-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.vehicleLicensePlate}>{licensePlate}</Text>
          </View>
          <View style={styles.lastServiceContainer}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.lastServiceDate}>{lastService}</Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: theme.roundness,
    marginHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    width: 300,
    ...theme.elevation.small,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  vehicleInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  vehicleName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  vehicleDetails: {
    flexDirection: 'column',
  },
  licensePlateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  lastServiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleLicensePlate: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  lastServiceDate: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
});

export default VehicleItem;