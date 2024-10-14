import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';

interface ServiceRecord {
  id: string;
  vehicleName: string;
  serviceType: string;
  date: string;
  status: 'completed' | 'scheduled' | 'in-progress' | 'cancelled';
  cost: number;
}

const dummyServiceRecords: ServiceRecord[] = [
  { id: '1', vehicleName: 'Toyota Camry', serviceType: 'Oil Change', date: '2023-05-15', status: 'completed', cost: 50 },
  { id: '2', vehicleName: 'Honda Civic', serviceType: 'Tire Rotation', date: '2023-05-20', status: 'scheduled', cost: 30 },
  { id: '3', vehicleName: 'Ford F-150', serviceType: 'Brake Inspection', date: '2023-05-25', status: 'in-progress', cost: 75 },
  { id: '4', vehicleName: 'Toyota Camry', serviceType: 'Air Filter Replacement', date: '2023-04-10', status: 'completed', cost: 25 },
  { id: '5', vehicleName: 'Honda Civic', serviceType: 'Battery Replacement', date: '2023-03-22', status: 'completed', cost: 120 },
  { id: '6', vehicleName: 'Ford F-150', serviceType: 'Transmission Fluid Change', date: '2023-06-05', status: 'scheduled', cost: 100 },
  { id: '7', vehicleName: 'Toyota Camry', serviceType: 'Wheel Alignment', date: '2023-05-30', status: 'scheduled', cost: 80 },
  { id: '8', vehicleName: 'Honda Civic', serviceType: 'Spark Plug Replacement', date: '2023-04-15', status: 'completed', cost: 60 },
];

const ServiceHistoryScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const filteredAndSortedRecords = dummyServiceRecords
    .filter(record => filter === 'all' || record.status === filter)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === 'cost') {
        return b.cost - a.cost;
      }
      return 0;
    });

  const getStatusColor = (status: ServiceRecord['status']) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'scheduled':
        return theme.colors.warning;
      case 'in-progress':
        return theme.colors.info;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.text;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const renderServiceItem = ({ item }: { item: ServiceRecord }) => (
    <TouchableOpacity
      style={styles.serviceItem}
      onPress={() => navigation.navigate('TicketScreen', { serviceId: item.id })}
    >
      <Text style={styles.serviceType}>{item.serviceType}</Text>
      <Text style={styles.vehicleName}>{item.vehicleName}</Text>
      <Text style={styles.serviceDate}>{formatDate(item.date)}</Text>
      <View style={styles.serviceDetails}>
        <Text style={[styles.serviceStatus, { color: getStatusColor(item.status) }]}>
          {t(`serviceStatusnm,m,mm,${item.status}`)}
        </Text>
        <Text style={styles.serviceCost}>${item.cost.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

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
          {['all', 'completed', 'scheduled', 'in-progress', 'cancelled'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.modalOption, filter === status && styles.selectedOption]}
              onPress={() => {
                setFilter(status);
                setShowFilterModal(false);
              }}
            >
              <Text style={[styles.modalOptionText, filter === status && styles.selectedOptionText]}>
                {t(`serviceStatus.${status}`)}
              </Text>
            </TouchableOpacity>
          ))}
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
              }}
            >
              <Text style={[styles.modalOptionText, sortBy === sort && styles.selectedOptionText]}>
                {t(`serviceHistory.sortBy${sort.charAt(0).toUpperCase() + sort.slice(1)}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

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

      <FlatList
        data={filteredAndSortedRecords}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />

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
});

export default ServiceHistoryScreen;