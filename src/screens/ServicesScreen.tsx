import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

type RootStackParamList = {
  OrderService: { serviceType: string };
};

type ServicesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderService'>;

interface Service {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: string;
  longDescription: string;
}

const ServicesScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ServicesScreenNavigationProp>();
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const services: Service[] = [
    {
      id: '1',
      name: 'Oil Change',
      description: 'Regular oil change service',
      icon: 'water-outline',
      category: 'Maintenance',
      longDescription: 'Our oil change service includes draining old oil, replacing the oil filter, and refilling with high-quality motor oil suitable for your vehicle. This service helps maintain engine performance and longevity.'
    },
    {
      id: '2',
      name: 'Tire Rotation',
      description: 'Rotate and balance tires',
      icon: 'disc-outline',
      category: 'Maintenance',
      longDescription: 'Tire rotation involves moving tires from one position on the vehicle to another. This service ensures even wear, extends tire life, and maintains optimal vehicle handling and fuel efficiency.'
    },
    {
      id: '3',
      name: 'Brake Service',
      description: 'Inspect and repair brakes',
      icon: 'stop-circle-outline',
      category: 'Repair',
      longDescription: 'Our comprehensive brake service includes inspection of brake pads, rotors, calipers, and brake fluid. We\'ll replace worn components and ensure your braking system is functioning safely and efficiently.'
    },
    {
      id: '4',
      name: 'Battery Replacement',
      description: 'Replace old or faulty battery',
      icon: 'battery-charging-outline',
      category: 'Repair',
      longDescription: 'We\'ll test your current battery, and if necessary, replace it with a new, high-quality battery suitable for your vehicle. This service includes proper disposal of the old battery.'
    },
    {
      id: '5',
      name: 'Air Conditioning',
      description: 'AC system check and repair',
      icon: 'thermometer-outline',
      category: 'Comfort',
      longDescription: 'Our AC service includes a system performance check, refrigerant level check, and leak detection. We\'ll recharge the system if needed and repair any identified issues to ensure your AC runs efficiently.'
    },
    {
      id: '6',
      name: 'Wheel Alignment',
      description: 'Adjust wheel angles',
      icon: 'resize-outline',
      category: 'Maintenance',
      longDescription: 'Wheel alignment involves adjusting the angles of the wheels to the manufacturer\'s specifications. This service improves handling, reduces tire wear, and can improve fuel efficiency.'
    },
    {
      id: '7',
      name: 'Engine Diagnostics',
      description: 'Diagnose engine issues',
      icon: 'construct-outline',
      category: 'Diagnostics',
      longDescription: 'Using advanced diagnostic tools, we\'ll identify any issues with your engine\'s performance. This service helps catch potential problems early and ensures your engine runs at its best.'
    },
    {
      id: '8',
      name: 'Transmission Service',
      description: 'Transmission fluid change',
      icon: 'cog-outline',
      category: 'Maintenance',
      longDescription: 'Our transmission service includes draining old fluid, replacing the transmission filter if applicable, and refilling with new fluid. This service helps maintain smooth gear shifts and extends transmission life.'
    },
  ];

  const categories = Array.from(new Set(services.map(service => service.category)));

  const renderServiceItem = ({ item }: { item: Service }) => (
    <View style={styles.serviceItem}>
      <TouchableOpacity
        style={styles.serviceButton}
        onPress={() => navigation.navigate('OrderService', { serviceType: item.name })}
      >
        <View style={styles.serviceIcon}>
          <Ionicons name={item.icon} size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text style={styles.serviceDescription}>{item.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.infoButton}
        onPress={() => setSelectedService(item)}
      >
        <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderCategory = ({ item: category }: { item: string }) => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{t(`services.${category.toLowerCase()}`)}</Text>
      <FlatList
        data={services.filter(service => service.category === category)}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('services.title')}</Text>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContent}
      />
      <Modal
        visible={!!selectedService}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedService(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>{selectedService?.name}</Text>
              <Text style={styles.modalDescription}>{selectedService?.longDescription}</Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSelectedService(null)}
            >
              <Text style={styles.modalCloseButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  categoryContainer: {
    marginBottom: theme.spacing.lg,
  },
  categoryTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.secondary + '20', // 20% opacity
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: theme.roundness,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    ...theme.elevation.small,
  },
  serviceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20', // 20% opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text,
  },
  serviceDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  infoButton: {
    padding: theme.spacing.sm,
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
  modalDescription: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    padding: theme.spacing.sm,
  },
  modalCloseButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.medium,
  },
});

export default ServicesScreen;