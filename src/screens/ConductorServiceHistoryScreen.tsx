import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Modal, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import api from '../api';

type RootStackParamList = {
  ServiceDetails: { serviceId: number };
};

type ServiceHistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ServiceDetails'>;

interface ServiceRecord {
  id: number;
  service_name: string;
  completion_date: string;
  status: 'completed' | 'cancelled' | 'in_progress' | 'pending';
  price: number;
}

const ITEMS_PER_PAGE = 10;

const ConductorServiceHistoryScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ServiceHistoryScreenNavigationProp>();
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchServiceHistory = useCallback(async (pageNumber: number, refresh = false, skipFocusFetch = false) => {
    if (pageNumber === 1) {
      setIsLoading(true);
    }
    setError(null);
    try {
      console.log('-',filter);
      const response = await api.get('vehicle/service-history', {
        params: { filter, sort_by: sortBy,status: filter, page: pageNumber, per_page: ITEMS_PER_PAGE },
      });
      const newRecords = response.data.data;
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
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filter, sortBy, t]);

  useFocusEffect(
    useCallback(() => {
      fetchServiceHistory(1,false, true);
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
    <View   style={{flex:1}}   >
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
     <View style={{alignItems:'center'}} >
      <Ionicons name='arrow-forward-circle-outline' style={{marginVertical:'auto'}} size={40} color={theme.colors.primary}/>
    </View>
    </TouchableOpacity>
  )};

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
          {['all', , 'pending' ,'in_progress' ,'completed', 'cancelled'  ].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.modalOption, filter === status && styles.selectedOption]}
              onPress={() => {
                setFilter(status);
                setShowFilterModal(false);
                fetchServiceHistory(1, true);
              }}
            >
              <Text style={[styles.modalOptionText, filter !== status && {color : getStatusColor(status)}]}>{t(`serviceStatus.${status}`)}</Text>
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
      animationType="fade" 
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
              <Text style={styles.modalOptionText}>{t(`serviceHistory.${sort}`)}</Text>
              {sortBy === sort && (
                <Ionicons name="checkbox-outline" size={24} color={theme.colors.primary} />
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error && serviceRecords.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchServiceHistory(1)}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('serviceHistory.title')}</Text>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={24} color={theme.colors.primary} />
          <Text style={styles.filterButtonText}>{t('serviceHistory.filter')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical" size={24} color={theme.colors.primary} />
          <Text style={styles.filterButtonText}>{t('serviceHistory.sort')}</Text>
        </TouchableOpacity>
      </View>
      {serviceRecords.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="document-text-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={styles.emptyStateText}>{t('serviceHistory.noRecords')}</Text>
        </View>
      ) : (
        <FlatList
          data={serviceRecords}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListFooterComponent={() => (
            hasMore ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loadingMore} />
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
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 20,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  filterButtonText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.md,
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
    borderRadius:10
  },
  selectedOption: {
    backgroundColor: theme.colors.secondary,
  },
  modalOptionText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text,
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
  filterContainer: {
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
    marginLeft: theme.spacing.sm,
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.md,
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
    flexDirection:'row',
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
    marginTop: theme.spacing.md,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
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
    borderBottomWidth: 0,
    borderRadius:10,
    paddingStart:10,
    borderBottomColor: theme.colors.border,
  },

  selectedOption: {
    backgroundColor: theme.colors.primary,
  },
  modalOptionText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  loadingMore: {
    marginVertical: theme.spacing.md,
  },
});

export default ConductorServiceHistoryScreen;