import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, ListRenderItem, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import VehicleItem from '../components/VehicleItem';
import api from '../api';
import { STORAGE_URL } from '../../config';
type RootStackParamList = {
  ServiceHistory: undefined;
  VehicleDetail: { vehicleId: number };
  OrderService: { serviceType: string };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Service {
  id: number;
  service_type: string;
  scheduled_date: string;
  status: string;
}

interface Banner {
  id: number;
  image_path: string;
  title: string;
  description: string;
}

interface Vehicle {
  id: number;
  brand_name: string;
  model: string;
  plate_number: string;
  last_service_date: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Placeholder: React.FC<{ style: any }> = ({ style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return <Animated.View style={[style, { opacity, backgroundColor: theme.colors.secondary }]} />;
};

const ErrorView: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.errorContainer}>
      <Image
        source={{ uri: require('../../assets/error.svg') }}
        style={styles.errorIllustration}
      />
      <Text style={styles.errorTitle}>{t('error.title')}</Text>
      <Text style={styles.errorText}>{t('error.fetchFailed')}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Ionicons name="refresh-outline" size={24} color="white" style={styles.retryIcon} />
        <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [activeSlide, setActiveSlide] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const storageUrl = process.env.REACT_APP_STORAGE_URL;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [servicesResponse, bannersResponse, vehiclesResponse] = await Promise.all([
        api.get('/client/services'),
        api.get('/client/banners'),
        api.get('/client/home-vehicles')
      ]);
      setServices(servicesResponse.data);
      setBanners(bannersResponse.data);
      setVehicles(vehiclesResponse.data);
      console.log(`${STORAGE_URL}/${bannersResponse.data[0].image_path}`)
      
    } catch (err) {
      console.log(err);
      setError('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'scheduled':
        return theme.colors.warning;
      case 'in_progress':
        return theme.colors.info;
      default:
        return theme.colors.text;
    }
  };
  const renderAdBanner = useCallback(() => (
    <View style={styles.carouselContainer}>
      {isLoading ? (
        <Placeholder style={{ width: SCREEN_WIDTH, height: 200 }} />
      ) : (
        <FlatList
          data={banners}
          renderItem={({ item }) => (
            <View style={styles.adBannerItem}>
            <Image source={{ uri: `${STORAGE_URL}/${item.image_path}` }} style={styles.adBannerImage} />
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const slideSize = event.nativeEvent.layoutMeasurement.width;
            const index = event.nativeEvent.contentOffset.x / slideSize;
            const roundIndex = Math.round(index);
            setActiveSlide(roundIndex);
          }}
          scrollEventThrottle={200}
        />
      )}
      <View style={styles.pagination}>
        {banners.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === activeSlide ? styles.paginationDotActive : null,
            ]}
          />
        ))}
      </View>
    </View>
  ), [isLoading, banners, activeSlide]);

  const renderQuickActions = useCallback(() => (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('OrderService', { serviceType: 'Quick Service' })}>
        <Ionicons name="flash-outline" size={24} color={theme.colors.primary} />
        <Text style={styles.quickActionText}>{t('home.quickService')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('ServiceHistory')}>
        <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
        <Text style={styles.quickActionText}>{t('home.serviceHistory')}</Text>
      </TouchableOpacity>
    </View>
  ), [navigation, t]);

  const renderVehicles = useCallback(() => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{t('home.myVehicles')}</Text>
      {isLoading ? (
        <View style={[styles.vehicleList, { flexDirection: 'row' }]}>
          {[...Array(3)].map((_, index) => (
            <Placeholder
              key={index}
              style={{ width: 150, height: 100, marginRight: 10, borderRadius: 8 }}
            />
          ))}
        </View>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={({ item }) => (
            <VehicleItem
              id={item.id}
              name={`${item.brand_name} ${item.model}`}
              licensePlate={item.plate_number}
              lastService={item.last_service_date || t('home.no_service')}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vehicleList}
        />
      )}
    </View>
  ), [isLoading, vehicles, t]);

  const renderServiceItem: ListRenderItem<Service> = useCallback(({ item }) => (
    <TouchableOpacity 
      style={styles.serviceItem}
      onPress={() => navigation.navigate('OrderService', { serviceType: item.service_type })}
    >
      <View style={styles.serviceIcon}>
        <Ionicons name="construct-outline" size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceType}>{item.service_type}</Text>
        <Text style={styles.serviceDate}>{item.scheduled_date}</Text>
      </View>
      <Text style={[styles.serviceStatus, { color: getStatusColor(item.status) }]}>{item.status}</Text>
    </TouchableOpacity>
  ), [navigation]);

  const renderServices = useCallback(() => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{t('home.upcomingServices')}</Text>
      {isLoading ? (
        <View>
          {[...Array(3)].map((_, index) => (
            <Placeholder
              key={index}
              style={{ height: 60, marginBottom: 10, borderRadius: 8 }}
            />
          ))}
        </View>
      ) : (
        <>
          <FlatList
            data={services}
            renderItem={renderServiceItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('ServiceHistory')}
          >
            <Text style={styles.viewAllButtonText}>{t('home.viewAllServices')}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  ), [isLoading, services, t, navigation, renderServiceItem]);

  const renderItem: ListRenderItem<any> = useCallback(({ item }) => {
    switch (item.type) {
      case 'welcome':
        return <Text style={styles.welcomeText}>{t('home.welcome')}</Text>;
      case 'adBanner':
        return renderAdBanner();
      case 'quickActions':
        return renderQuickActions();
      case 'vehicles':
        return renderVehicles();
      case 'services':
        return renderServices();
      default:
        return null;
    }
  }, [t, renderAdBanner, renderQuickActions, renderVehicles, renderServices]);

  const data = [
    { id: 'welcome', type: 'welcome' },
    { id: 'adBanner', type: 'adBanner' },
    { id: 'quickActions', type: 'quickActions' },
    { id: 'vehicles', type: 'vehicles' },
    { id: 'services', type: 'services' },
  ];

  if (error) {
    return <ErrorView onRetry={fetchData} />;
  }

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={styles.container}
      refreshing={isLoading}
      onRefresh={fetchData}
    />
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  welcomeText: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary,
    padding: theme.spacing.md,
  },
  carouselContainer: {
    height: 200,
    marginBottom: theme.spacing.md,
  },
  adBannerItem: {
    width: SCREEN_WIDTH,
    height: 200,
  },
  adBannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: theme.spacing.sm,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: theme.colors.secondary,
  },
  paginationDotActive: {
    backgroundColor: theme.colors.primary,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.md,
  },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.secondary + '20',
    borderRadius: theme.roundness,
    padding: theme.spacing.sm,
  },
  quickActionText: {
    marginTop: theme.spacing.xs,
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.sm,
  },
  sectionContainer: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text,
  },
  vehicleList: {
    paddingHorizontal: theme.spacing.sm,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.sm,
    ...theme.elevation.small,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceType: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text,
  },
  serviceDate: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  serviceStatus: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
  },
  viewAllButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.sm,
    borderRadius: theme.roundness,
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  viewAllButtonText: {
    color: 'white',
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  errorIllustration: {
    width: 200,
    height: 200,
    marginBottom: theme.spacing.lg,
  },
  errorTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.roundness,
  },
  retryIcon: {
    marginRight: theme.spacing.sm,
  },
  retryButtonText: {
    color: 'white',
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
  },
});


export default HomeScreen;