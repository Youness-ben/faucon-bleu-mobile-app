import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Animated, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import api from '../api';
import { STORAGE_URL } from '../../config';

type RootStackParamList = {
  VehicleDetail: { vehicleId: number };
  AddVehicle: undefined;
};

type FleetScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Vehicle {
  id: number;
  brand_name: string;
  year: string;
  model: string;
  plate_number: string;
  logo_url: string;
}

interface PaginatedResponse {
  data: Vehicle[];
  current_page: number;
  last_page: number;
}

const ITEMS_PER_PAGE = 10;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SkeletonItem: React.FC = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  const startAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  useEffect(() => {
    startAnimation();
  }, [startAnimation]);

  return (
    <Animated.View style={[styles.vehicleItem, { opacity }]}>
      <View style={[styles.vehicleLogo, styles.skeleton]} />
      <View style={styles.vehicleInfo}>
        <View style={[styles.skeletonText, { width: '70%' }]} />
        <View style={[styles.skeletonText, { width: '50%', marginTop: 8 }]} />
      </View>
    </Animated.View>
  );
};

const EmptyState: React.FC<{ onAddVehicle: () => void }> = ({ onAddVehicle }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIconContainer}>
        <Ionicons name="car-sport-outline" size={80} color={theme.colors.primary} />
      </View>
      <Text style={styles.emptyStateTitle}>{t('fleet.emptyStateTitle')}</Text>
      <Text style={styles.emptyStateDescription}>{t('fleet.emptyStateDescription')}</Text>
      <TouchableOpacity style={styles.emptyStateButton} onPress={onAddVehicle}>
        <Ionicons name="add-circle-outline" size={24} color="white" style={styles.emptyStateButtonIcon} />
        <Text style={styles.emptyStateButtonText}>{t('fleet.addFirstVehicle')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const FleetScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<FleetScreenNavigationProp>();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchVehicles = useCallback(async (page: number, refresh: boolean = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const response = await api.get<PaginatedResponse>(`/client/vehicles/list?page=${page}&per_page=${ITEMS_PER_PAGE}`);
      if (response && response.data && Array.isArray(response.data.data)) {
        const newVehicles = response.data.data;

        setVehicles(prevVehicles => (refresh || page === 1 ? newVehicles : [...prevVehicles, ...newVehicles]));
        setCurrentPage(response.data.current_page);
        setLastPage(response.data.last_page);
      } else {
        console.log(response.data);
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError(t('fleet.fetchError'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [t]);

  useEffect(() => {
    fetchVehicles(1);
  }, [fetchVehicles]);

  const handleRefresh = useCallback(() => {
    fetchVehicles(1, true);
  }, [fetchVehicles]);

  const handleLoadMore = useCallback(() => {
    if (currentPage < lastPage && !isLoading && !isLoadingMore) {
      fetchVehicles(currentPage + 1);
    }
  }, [currentPage, lastPage, isLoading, isLoadingMore, fetchVehicles]);

  const handleAddVehicle = useCallback(() => {
    navigation.navigate('AddVehicle');
  }, [navigation]);

  const renderVehicleItem = useCallback(({ item }: { item: Vehicle }) => (
    <TouchableOpacity
      style={styles.vehicleItem}
      onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
    >
      <Image 
        source={{ uri: `${STORAGE_URL}/${item.logo_url}` }} 
        style={styles.vehicleLogo} 
        defaultSource={require('../../assets/logo-faucon.png')}
        onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
      />
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleName}>{`${item.brand_name} ${item.model}`}<Text style={{fontSize:12 , marginLeft:20}}>  {item.year}</Text></Text>
        <Text style={styles.vehicleLicensePlate}>{item.plate_number}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
    </TouchableOpacity>
  ), [navigation]);

  const renderFooter = useMemo(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }, [isLoadingMore]);

  const renderContent = useMemo(() => {
    if (isLoading && (!vehicles || vehicles.length === 0)) {
      return (
        <FlatList
          data={Array(ITEMS_PER_PAGE).fill(0)}
          renderItem={() => <SkeletonItem />}
          keyExtractor={(_, index) => `skeleton-${index}`}
          contentContainerStyle={styles.listContent}
        />
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchVehicles(1, true)}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!vehicles || vehicles.length === 0) {
      return <EmptyState onAddVehicle={handleAddVehicle} />;
    }

    return (
      <FlatList
        data={vehicles}
        renderItem={renderVehicleItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={10}
        updateCellsBatchingPeriod={50}
      />
    );
  }, [isLoading, vehicles, error, isRefreshing, handleRefresh, handleLoadMore, renderVehicleItem, renderFooter, t, fetchVehicles, handleAddVehicle]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('fleet.title')}</Text>
      {renderContent}
      {vehicles && vehicles.length > 0 && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddVehicle}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>{t('fleet.addVehicle')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  footerLoader: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  skeleton: {
    backgroundColor: theme.colors.secondary,
  },
  skeletonText: {
    height: 16,
    backgroundColor: theme.colors.secondary,
    borderRadius: 4,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  emptyStateIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyStateTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyStateDescription: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.roundness,
  },
  emptyStateButtonIcon: {
    marginRight: theme.spacing.sm,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
  },
});

export default FleetScreen;