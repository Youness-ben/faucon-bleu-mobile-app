import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator, RefreshControl, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import api from '../api';

type RootStackParamList = {
  ServiceHistory: { vehicleId?: number };
  TicketScreen: { serviceId: string };
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
  };
  scheduled_at?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  final_price?: number;
}

interface PaginationInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

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
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);


  
  const fetchServiceHistory = useCallback(async (page = 1, loadMore = false, refresh = false, currentFilter = filter) => {
    if (loadMore) {
      setIsLoadingMore(true);
    } else if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const params: any = {
        page,
        per_page: 10,
        status: currentFilter !== 'all' ? currentFilter : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      
      if (route.params?.vehicleId) {
        params.vehicle_id = route.params.vehicleId;
      }

      const response = await api.get('/client/service-orders-history', { params });

      let newRecords: ServiceRecord[] = [];
      let newPaginationInfo: PaginationInfo | null = null;

      if (Array.isArray(response.data)) {
        newRecords = response.data;
      } else if (typeof response.data === 'object' && Array.isArray(response.data.data)) {
        newRecords = response.data.data;
        newPaginationInfo = {
          current_page: response.data.current_page || 1,
          last_page: response.data.last_page || 1,
          per_page: response.data.per_page || newRecords.length,
          total: response.data.total || newRecords.length,
        };
      } else {
        throw new Error('Unexpected response format');
      }

      if (loadMore) {
        setServiceRecords(prevRecords => [...prevRecords, ...newRecords]);
      } else {
        setServiceRecords(newRecords);
      }

      if (newPaginationInfo) {
        setPaginationInfo(newPaginationInfo);
      }
    } catch (err) {
      console.error('Error fetching service history:', err);
      setError(t('serviceHistory.fetchError'));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [sortBy, sortOrder, t, route.params?.vehicleId]);

  useFocusEffect(
    useCallback(() => {
      fetchServiceHistory(1, false, false, filter);
    }, [fetchServiceHistory, filter])
  );

  const handleLoadMore = () => {
    if (paginationInfo && paginationInfo.current_page < paginationInfo.last_page && !isLoadingMore) {
      fetchServiceHistory(paginationInfo.current_page + 1, true, false, filter);
    }
  };

  const handleRefresh = () => {
    fetchServiceHistory(1, false, true, filter);
  };

  const applyFilterAndSort = () => {
    fetchServiceHistory(1, false, false, filter);
  };


  const getStatusColor = (status?: ServiceRecord['status']) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'in_progress':
        return theme.colors.info;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.text;
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
      onPress={() => navigation.navigate('TicketScreen', { serviceId: item.id ,service: item})}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.serviceType}>{item.service?.name || t('serviceHistory.unknownService')}</Text>
        <Text style={styles.vehicleName}>
          {item.vehicle ? `${item.vehicle.brand_name || ''} ${item.vehicle.model || ''}`.trim() : t('serviceHistory.unknownVehicle')}
        </Text>
        <Text style={styles.serviceDate}>{formatDate(item.scheduled_at)}</Text>
        <View style={styles.serviceDetails}>
          <Text style={[styles.serviceStatus, { color: getStatusColor(item.status) }]}>
            {item.status ? t(`serviceStatus.${item.status}`) : t('serviceHistory.unknownStatus')}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Ionicons name='arrow-forward-circle-outline' style={{ marginVertical: 'auto' }} size={40} color={theme.colors.primary} />
      </View>
    </TouchableOpacity>
  );

  const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="fade"
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
                const newFilter = status;
                setFilter(newFilter);
                setShowFilterModal(false);
                fetchServiceHistory(1, false, true, newFilter);
              }}
            >
              <Text style={[styles.modalOptionText, filter !== status && {color: getStatusColor(status as ServiceRecord['status'])}]}>
                {t(`serviceStatus.${status}`)}
              </Text>
              {filter === status && (
                <Ionicons name="checkmark" size={24} color={theme.colors.primary} />
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
                applyFilterAndSort();
              }}
            >
              <Text style={[styles.modalOptionText, sortBy === sort && styles.selectedOptionText]}>
                {t(`serviceHistory.${sort.charAt(0).toLowerCase() + sort.slice(1)}`)}
              </Text>
              {sortBy === sort && (
                <Ionicons name="checkmark" size={24} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
          <View style={styles.sortOrderContainer}>
            <TouchableOpacity
              style={[styles.sortOrderButton, sortOrder === 'asc' && styles.selectedSortOrder]}
              onPress={() => {
                setSortOrder('asc');
                setShowSortModal(false);
                applyFilterAndSort();
              }}
            >
              <Text style={[styles.sortOrderText, sortOrder === 'asc' && {color:'#FFF'}]}>{t('serviceHistory.ascending')}</Text>
              <Ionicons name="filter-outline"  color={ sortOrder === 'asc' ?'#FFF' : "#000"} style={{transform: [{rotate: '180deg'}],}} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortOrderButton, sortOrder === 'desc' && styles.selectedSortOrder]}
              onPress={() => {
                setSortOrder('desc');
                setShowSortModal(false);
                applyFilterAndSort();
              }}
            >
              <Text style={[styles.sortOrderText, sortOrder === 'desc' && {color:'#FFF'}]}>{t('serviceHistory.descending')}</Text>
              <Ionicons name="filter-outline" color={ sortOrder === 'desc' ?'#FFF' : "#000"} />
            </TouchableOpacity>
          </View>
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

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
      <Text style={styles.title}>{t('serviceHistory.title')}</Text>
      <View style={styles.headerRight} />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchServiceHistory()}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderHeader()}
      <View style={styles.container}>
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.filterButtonText}>{t('serviceHistory.filterBy')}: {t(`serviceStatus.${filter}`)}</Text>
            <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowSortModal(true)}
          >
            <Text style={styles.filterButtonText}>{t('serviceHistory.sort')}: {t(`serviceHistory.${sortBy.charAt(0).toLowerCase() + sortBy.slice(1)}`)}</Text>
            <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {serviceRecords.length > 0 ? (
          <FlatList
            data={serviceRecords}
            renderItem={renderServiceItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
            ListFooterComponent={() => (
              isLoadingMore ? (
                <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loadingMore} />
              ) : null
            )}
          />
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>{t('serviceHistory.noRecords')}</Text>
          </View>
        )}

        <FilterModal />
        <SortModal />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
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
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary,
  },
  headerRight: {
    width: 40,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary + '20',
    borderRadius: theme.roundness,
    padding: theme.spacing.sm,
  },
  filterButtonText: {
    color: theme.colors.primary,
    marginRight: theme.spacing.sm,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  serviceItem: {
    backgroundColor: 'white',
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.elevation.small,
    flexDirection: 'row',
  },
  serviceType: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  vehicleName: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  serviceDate: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceStatus: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
  },
  serviceCost: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  loadingMore: {
    marginVertical: theme.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: 10,
  },
  selectedOption: {
    backgroundColor: theme.colors.secondary,
  },
  modalOptionText: {
    fontSize: theme.typography.sizes.lg,
    paddingStart:10,
    color: theme.colors.text,
  },
  selectedOptionText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.bold,
  },
  closeButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.textSecondary,
    borderRadius: 20,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.background,
  },
  sortOrderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  sortOrderButton: {
    flex: 1,
    marginHorizontal:10,
    padding: theme.spacing.sm,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection:'row'
  },
  selectedSortOrder: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary
  },
  sortOrderText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
});

export default ServiceHistoryScreen;