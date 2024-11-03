import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../api';

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
  const navigation = useNavigation();
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

  const fetchServiceHistory = useCallback(async (page = 1, loadMore = false, refresh = false) => {
    if (loadMore) {
      setIsLoadingMore(true);
    } else if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const response = await api.get('/client/service-orders-history', {
        params: {
          page,
          per_page: 10,
          status: filter !== 'all' ? filter : undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        },
      });

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
  }, [filter, sortBy, sortOrder, t]);

  useFocusEffect(
    useCallback(() => {
      fetchServiceHistory();
    }, [fetchServiceHistory])
  );

  const handleLoadMore = () => {
    if (paginationInfo && paginationInfo.current_page < paginationInfo.last_page && !isLoadingMore) {
      fetchServiceHistory(paginationInfo.current_page + 1, true);
    }
  };

  const handleRefresh = () => {
    fetchServiceHistory(1, false, true);
  };

  const applyFilterAndSort = () => {
    fetchServiceHistory();
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

  const renderServiceItem = ({ item }: { item: ServiceRecord }) => {
    return (
    <TouchableOpacity
      style={styles.serviceItem}
      onPress={() => navigation.navigate('TicketScreen', { serviceId: item.id })}
    >
      <Text style={styles.serviceType}>{item.service?.name || t('serviceHistory.unknownService')}</Text>
      <Text style={styles.vehicleName}>
        {item.vehicle ? `${item.vehicle.brand_name || ''} ${item.vehicle.model || ''}`.trim() : t('serviceHistory.unknownVehicle')}
      </Text>
      <Text style={styles.serviceDate}>{formatDate(item.scheduled_at)}</Text>
      <View style={styles.serviceDetails}>
        <Text style={[styles.serviceStatus, { color: getStatusColor(item.status) }]}>
          {item.status ? t(`serviceStatus.${item.status}`) : t('serviceHistory.unknownStatus')}
        </Text>
        <Text style={styles.serviceCost}>
          {item.final_price !== undefined ? `${item.final_price} MAD` : t('serviceHistory.unknownCost')}
        </Text>
      </View>
    </TouchableOpacity>
  )};

  const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('serviceHistory.filterBy')}</Text>
          {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.modalOption, filter === status && styles.selectedOption]}
              onPress={() => {
                setFilter(status);
                setShowFilterModal(false);
                applyFilterAndSort();
              }}
            >
              <Text style={[styles.modalOptionText, filter === status && styles.selectedOptionText]}>
                {t(`serviceStatus.${status}`)}
              </Text>
              {filter === status && (
                <Ionicons name="checkmark" size={24} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setShowFilterModal(false)}
          >
            <Text style={styles.closeModalButtonText}>{t('common.close')}</Text>
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
      <View style={styles.modalContainer}>
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
                {t(`serviceHistory.sortBy${sort.charAt(0).toUpperCase() + sort.slice(1)}`)}
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
              <Text style={styles.sortOrderText}>{t('serviceHistory.ascending')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortOrderButton, sortOrder === 'desc' && styles.selectedSortOrder]}
              onPress={() => {
                setSortOrder('desc');
                setShowSortModal(false);
                applyFilterAndSort();
              }}
            >
              <Text style={styles.sortOrderText}>{t('serviceHistory.descending')}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={() => setShowSortModal(false)}
          >
            <Text style={styles.closeModalButtonText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchServiceHistory()}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('serviceHistory.title')}</Text>
      
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
          <Text style={styles.filterButtonText}>{t('serviceHistory.sortBy')}: {t(`serviceHistory.sortBy${sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}`)}</Text>
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

      <TouchableOpacity
        style={styles.exportButton}
        onPress={() => console.log('Export service history')}
      >
        <Ionicons name="download-outline" size={20} color="white" style={styles.buttonIcon} />
        <Text style={styles.exportButtonText}>{t('serviceHistory.export')}</Text>
      </TouchableOpacity>

      <FilterModal />
      <SortModal />
    </View>
  );
};

const styles = StyleSheet.create({
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
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
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
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  exportButtonText: {
    color: 'white',
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
  },
  buttonIcon: {
    marginRight: theme.spacing.sm,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.roundness,
    borderTopRightRadius: theme.roundness,
    padding: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  selectedOption: {
    backgroundColor: theme.colors.primaryLight,
  },
  modalOptionText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  selectedOptionText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.bold,
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
  sortOrderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  sortOrderButton: {
    flex: 1,
    padding: theme.spacing.sm,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  selectedSortOrder: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  sortOrderText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  closeModalButton: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: 'white',
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
  },
});

export default ServiceHistoryScreen;