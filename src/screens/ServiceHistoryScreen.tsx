import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  RefreshControl,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import LottieView from 'lottie-react-native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { STORAGE_URL } from '../../config';
import { theme } from '../styles/theme';

type RootStackParamList = {
  ServiceHistory: { vehicleId?: number };
  TicketScreen: { serviceId: string; service: any };
};

type ServiceHistoryScreenRouteProp = RouteProp<RootStackParamList, 'ServiceHistory'>;
type ServiceHistoryScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface ServiceRecord {
  id: string;
  vehicle?: {
    brand_name?: string;
    model?: string;
  };
  service?: {
    name?: string;
    icon?: string;
  };
  scheduled_at?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  final_price?: number;
}

const ITEMS_PER_PAGE = 10;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ServiceHistoryScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ServiceHistoryScreenNavigationProp>();
  const route = useRoute<ServiceHistoryScreenRouteProp>();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchServiceHistory = useCallback(async (pageNumber: number, refresh = false) => {
    if (pageNumber === 1) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const params: any = {
        page: pageNumber,
        per_page: ITEMS_PER_PAGE,
        status: filter !== 'all' ? filter : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      
      if (route.params?.vehicleId) {
        params.vehicle_id = route.params.vehicleId;
      }

      const response = await api.get('/client/service-orders-history', { params });
      const newRecords = response.data.data || [];

      if (pageNumber === 1 || refresh) {
        setServiceRecords(newRecords);
      } else {
        setServiceRecords(prevRecords => [...prevRecords, ...newRecords]);
      }
      setHasMore(newRecords.length === ITEMS_PER_PAGE);
      setPage(pageNumber);
    } catch (err) {
      console.error('Error fetching service history:', err);
      setError(t('serviceHistory.fetchError'));
      Toast.show({
        type: 'error',
        text1: t('serviceHistory.fetchError'),
        text2: t('serviceHistory.tryAgainLater'),
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filter, sortBy, sortOrder, t, route.params?.vehicleId]);

  useFocusEffect(
    useCallback(() => {
      fetchServiceHistory(1);
    }, [fetchServiceHistory])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchServiceHistory(1, true);
  }, [fetchServiceHistory]);

  const loadMore = () => {
    if (hasMore && !isLoading) {
      fetchServiceHistory(page + 1);
    }
  };

  const getStatusColor = (status?: ServiceRecord['status']) => {
    switch (status) {
      case 'completed':
        return '#4CD964';
      case 'pending':
        return '#FF9500';
      case 'in_progress':
        return '#5AC8FA';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const renderServiceItem = ({ item }: { item: ServiceRecord }) => (
    <TouchableOpacity
      style={styles.serviceItem}
      onPress={() => navigation.navigate('TicketScreen', { serviceId: item.id, service: item })}
    >
      <View style={styles.serviceIcon}>
        <Image 
          source={{ uri: `${STORAGE_URL}/${item.service?.icon}` }}
          style={styles.iconImage}
          defaultSource={require('../../assets/default_service_icon.png')}
        />
      </View>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{item.service?.name || t('serviceHistory.unknownService')}</Text>
        <Text style={styles.vehicleName}>
          {item.vehicle ? `${item.vehicle.brand_name || ''} ${item.vehicle.model || ''}`.trim() : t('serviceHistory.unknownVehicle')}
        </Text>
        <Text style={styles.serviceDate}>{formatDate(item.scheduled_at)}</Text>
        <View style={styles.serviceDetails}>
          <Text style={[styles.serviceStatus, { color: getStatusColor(item.status) }]}>
            {item.status ? t(`serviceStatus.${item.status}`) : t('serviceHistory.unknownStatus')}
          </Text>
          <Text style={styles.serviceCost}>{item.final_price ? `${item.final_price} MAD` : 'N/A'}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#028dd0" />
    </TouchableOpacity>
  );

  const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('serviceHistory.filterBy')}</Text>
          {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.modalOption, filter === status && styles.selectedOption]}
              onPress={() => {
                setFilter(status);
                setShowFilterModal(false);
                fetchServiceHistory(1, true);
              }}
            >
              <Text style={[styles.modalOptionText, filter === status && styles.selectedOptionText]}>
                {t(`serviceStatus.${status}`)}
              </Text>
              {filter === status && (
                <Ionicons name="checkmark" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowFilterModal(false)}
          >
            <Text style={styles.closeButtonText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const SortModal = () => (
    <Modal
      visible={showSortModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowSortModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('serviceHistory.sortBy')}</Text>
          {['date', 'cost'].map((sort) => (
            <TouchableOpacity
              key={sort}
              style={[styles.modalOption, sortBy === sort && styles.selectedOption]}
              onPress={() => {
                setSortBy(sort);
                setShowSortModal(false);
                fetchServiceHistory(1, true);
              }}
            >
              <Text style={[styles.modalOptionText, sortBy === sort && styles.selectedOptionText]}>
                {t(`serviceHistory.${sort}`)}
              </Text>
              {sortBy === sort && (
                <View style={styles.sortDirectionContainer}>
                  <Ionicons name={sortOrder === 'asc' ? "arrow-up" : "arrow-down"} size={24} color="#FFFFFF" />
                  <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowSortModal(false)}
          >
            <Text style={styles.closeButtonText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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

  if (error && serviceRecords.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <LottieView
          source={require('../../assets/error-animation.json')}
          autoPlay
          loop
          style={{ width: 150, height: 150 }}
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchServiceHistory(1)}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
    <StatusBar barStyle="light-content" backgroundColor="#028dd0" />
    <LinearGradient colors={['#028dd0', '#01579B']} style={styles.header}>
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('serviceHistory.title')}</Text>
      </View>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={24} color="#FFFFFF" />
          <Text style={styles.filterButtonText}>{t('serviceHistory.filter')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical" size={24} color="#FFFFFF" />
          <Text style={styles.filterButtonText}>{t('serviceHistory.sort')}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
    {serviceRecords.length === 0 ? (
      <View style={styles.emptyStateContainer}>
        <LottieView
          source={require('../../assets/empty-state-animation.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
        <Text style={styles.emptyStateText}>{t('serviceHistory.noRecords')}</Text>
      </View>
    ) : (
      <FlatList
        data={serviceRecords}
        style={{paddingTop:20}}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#028dd0']}
          />
        }
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
    <FilterModal />
    <SortModal />
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  filterButtonText: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 16,
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
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
  vehicleName: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
  },
  serviceDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  serviceCost: {
    fontSize: 16,
    fontWeight: '600',
    color: '#028dd0',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 15,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  selectedOption: {
    backgroundColor: '#028dd0',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  modalOptionText: {
    fontSize: 18,
    color: '#1C1C1E',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#028dd0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingMore: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  sortDirectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ServiceHistoryScreen;

