import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect, RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import { STORAGE_URL } from '../../config';
import LottieView from 'lottie-react-native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';

type RootStackParamList = {
  Services: { vehicleId?: number };
  OrderService: { serviceType: string; serviceId: number; vehicleId?: number; vehicle?: any };
};

type ServicesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Services'>;
type ServicesScreenRouteProp = RouteProp<RootStackParamList, 'Services'>;

interface Service {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string | null;
  long_description: string;
  estimated_duration: number;
  estimated_duration_unite: string;
}

const ITEMS_PER_PAGE = 10;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ServicesScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ServicesScreenNavigationProp>();
  const route = useRoute<ServicesScreenRouteProp>();
  const { vehicleId } = route.params || {};

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const fetchServices = useCallback(async (pageNumber: number, refresh = false) => {
    if (pageNumber === 1) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const response = await api.get('/client/services', {
        params: { page: pageNumber, per_page: ITEMS_PER_PAGE }
      });
      if (pageNumber === 1 || refresh) {
        setServices(response.data);
      } else {
        setServices(prevServices => [...prevServices, ...response.data]);
      }
      setHasMore(response.data.length === ITEMS_PER_PAGE);
      setPage(pageNumber);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(t('services.fetchError'));
      Toast.show({
        type: 'error',
        text1: t('services.fetchError'),
        text2: t('services.tryAgainLater'),
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchServices(1);
    }, [fetchServices])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchServices(1, true);
  }, [fetchServices]);

  const loadMore = () => {
    if (hasMore && !isLoading) {
      fetchServices(page + 1);
    }
  };

  const categories = Array.from(new Set(services.map(service => service.category || t('services.uncategorized'))));

  const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.serviceItem}
      onPress={() => navigation.navigate('OrderService', { 
        serviceType: item.name, 
        serviceId: item.id,
        vehicleId: vehicleId 
      })}
    >
      <View style={styles.serviceIcon}>
        <Image 
          source={{ uri: `${STORAGE_URL}/${item.icon}` }}
          style={styles.iconImage}
          defaultSource={require('../../assets/default_service_icon.png')}
        />
      </View>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.serviceDescription} numberOfLines={2}>{item.description}</Text>
        <Text style={styles.servicePrice}>
          {t('services.estimatedDuration', { duration: item.estimated_duration, unite: item.estimated_duration_unite })}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.infoButton}
        onPress={() => setSelectedService(item)}
      >
        <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
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

  if (isLoading && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../assets/loading-animation.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
      </View>
    );
  }

  if (error && services.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <LottieView
          source={require('../../assets/error-animation.json')}
          autoPlay
          loop
          style={{ width: 150, height: 150 }}
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchServices(1)}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#028dd0" />
      <LinearGradient colors={['#028dd0', '#01579B']} style={styles.header}>
        <Text style={styles.title}>{t('services.availableServices')}</Text>
      </LinearGradient>
      {services.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <LottieView
            source={require('../../assets/empty-state-animation.json')}
            autoPlay
            loop
            style={{ width: 200, height: 200 }}
          />
          <Text style={styles.emptyStateText}>{t('services.noServicesAvailable')}</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item || 'uncategorized'}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          ListFooterComponent={() => (
            hasMore ? (
              <View style={styles.loadingMore}>
                <LottieView
                  source={require('../../assets/loading-animation.json')}
                  autoPlay
                  loop
                  style={{ width: 50, height: 50 }}
                />
              </View>
            ) : null
          )}
        />
      )}
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
              <Text style={styles.modalPrice}>
                {t('services.estimatedDuration', { 
                  duration: selectedService?.estimated_duration, 
                  unite: selectedService?.estimated_duration_unite 
                })}
              </Text>
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
    backgroundColor: '#FFFFFF',
    paddingBottom:50
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: '#028dd0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#028dd0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(2, 141, 208, 0.1)',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(2, 141, 208, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 5,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#028dd0',
  },
  infoButton: {
    padding: 10,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingMore: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: SCREEN_WIDTH * 0.8,
    maxHeight: SCREEN_WIDTH * 1.2,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#028dd0',
    marginBottom: 15,
  },
  modalDescription: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 15,
  },
  modalLongDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 15,
  },
  modalPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#028dd0',
    marginBottom: 20,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  modalCloseButtonText: {
    color: '#028dd0',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ServicesScreen;

