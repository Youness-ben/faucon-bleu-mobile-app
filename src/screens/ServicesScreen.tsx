import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView,Image, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import api from '../api';
import { STORAGE_URL } from '../../config';

type RootStackParamList = {
  OrderService: { serviceType: string; serviceId: number };
};

type ServicesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderService'>;

interface Service {
  id: number;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: string | null;
  long_description: string;
  price: number;
}

const ServicesScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ServicesScreenNavigationProp>();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/client/services');
      setServices(response.data);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(t('services.fetchError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchServices();
    }, [fetchServices])
  );

  const categories = Array.from(new Set(services.map(service => service.category || t('services.uncategorized'))));
  
 
  const renderServiceItem = ({ item }: { item: Service }) => (
    <View style={styles.serviceItem}>
      <TouchableOpacity
        style={styles.serviceButton}
        onPress={() => navigation.navigate('OrderService', { serviceType: item.name, serviceId: item.id })}
      >
        <View style={styles.serviceIcon}>
          <Image source={{ uri: `${STORAGE_URL}/${item.icon}` }} 
          defaultSource={require('../../assets/logo.png')}
          style={{width:24}} height={24} />

        </View>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text style={styles.servicePrice}>{t('services.estimatedDuration', { duration: item.estimated_duration, unite: item.estimated_duration_unite })}</Text>
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
      <Text style={styles.categoryTitle}>
        {category ? t(`services.categories.${category.toLowerCase()}`, category) : t('services.uncategorized')}
      </Text>
      <FlatList
        data={services.filter(service => (service.category || t('services.uncategorized')) === category)}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchServices}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('services.title')}</Text>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item || 'uncategorized'}
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
              <Text style={styles.modalDescription}>{selectedService?.description}</Text>
              <Text style={styles.modalLongDescription}>{selectedService?.long_description}</Text>
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
  servicePrice: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
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
    marginBottom: theme.spacing.md,
  },
  modalLongDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  modalPrice: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary,
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