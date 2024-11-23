import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import api from '../api';
import { STORAGE_URL } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import LottieView from "lottie-react-native";
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';

type RootStackParamList = {
  OrderService: { serviceId: number };
  TicketScreen: { serviceId: number, service: any };
  ConductorServicesScreen: undefined;
};

type ConductorHomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OrderService'>;

interface Vehicle {
  id: number;
  brand_name: string;
  model: string;
  plate_number: string;
  year: number;
  vin_number: string;
  kilometers: number;
  last_service_date: string;
  fuel_type: string;
  transmission: string;
  logo_url: string;
}

interface Service {
  id: number;
  service: {
    name: string;
  };
  scheduled_at: string;
  status: 'completed' | 'cancelled' | 'pending' | 'in_progress';
}

interface Banner {
  id: number;
  image_path: string;
  title: string;
  description: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ConductorHomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ConductorHomeScreenNavigationProp>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [upcomingServices, setUpcomingServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullVin, setShowFullVin] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const bannerRef = useRef<FlatList>(null);
  const bannerInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vehicleResponse, bannersResponse, servicesResponse] = await Promise.all([
        api.get('/vehicle/data'),
        api.get('/vehicle/banners'),
        api.get('/vehicle/upcoming-services'),
      ]);
      setVehicle(vehicleResponse.data);
      setBanners(bannersResponse.data);
      setUpcomingServices(servicesResponse.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(t('conductorHome.fetchError'));
      Toast.show({
        type: 'error',
        text1: t('conductorHome.fetchError'),
        text2: t('conductorHome.tryAgainLater'),
      });
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().then(() => setRefreshing(false));
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    if (banners.length > 1) {
      bannerInterval.current = setInterval(() => {
        if (bannerRef.current) {
          bannerRef.current.scrollToIndex({
            index: (Math.floor(Date.now() / 5000) % banners.length),
            animated: true,
          });
        }
      }, 5000);
    }
    return () => {
      if (bannerInterval.current) {
        clearInterval(bannerInterval.current);
      }
    };
  }, [banners]);

  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Constants.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Toast.show({
          type: 'error',
          text1: t('notifications.permissionDenied'),
          text2: t('notifications.enableInSettings'),
        });
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
      Toast.show({
        type: 'error',
        text1: t('notifications.deviceNotSupported'),
        text2: t('notifications.usePhysicalDevice'),
      });
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (token) {
      await AsyncStorage.setItem('expoPushToken', token);
      try {
        await api.post('/vehicle/update-push-token', { token });
      } catch (error) {
        console.error('Error sending push token to backend:', error);
      }
    }
  };

  const handleOrderService = (serviceId: number, service: any) => {
    navigation.navigate('TicketScreen', { serviceId: serviceId, service: service });
  };

  const renderAdBanner = useCallback(() => (
    <View style={styles.carouselContainer}>
      <FlatList
        ref={bannerRef}
        data={banners}
        renderItem={({ item }) => (
          <View style={styles.adBannerItem}>
            <Image 
              source={{ uri: `${STORAGE_URL}/${item.image_path}` }} 
              style={styles.adBannerImage}
              defaultSource={require('../../assets/logo.png')}
            />

          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={200}
      />
    </View>
  ), [banners]);

  const getStatusColor = (status?: Service['status']) => {
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

  const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.serviceItem}
      onPress={() => handleOrderService(item.id, item)}
    >
      <View style={styles.serviceItemContent}>
        <Text style={styles.serviceType}>{item.service?.name || t('serviceHistory.unknownService')}</Text>
        <Text style={styles.serviceDate}>{item.scheduled_at ? format(new Date(item.scheduled_at), 'MMM dd, yyyy') : 'N/A'}</Text>
        <View style={styles.serviceDetails}>
          <Text style={[styles.serviceStatus, { color: getStatusColor(item.status) }]}>
            {item.status ? t(`serviceStatus.${item.status}`) : t('serviceHistory.unknownStatus')}
          </Text>
        </View>
      </View>
      <Ionicons name='chevron-forward' size={24} color="#028dd0" />
    </TouchableOpacity>
  );

  if (isLoading) {
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

  if (error || !vehicle) {
    return (
      <View style={styles.errorContainer}>
        <LottieView
          source={require('../../assets/error-animation.json')}
          autoPlay
          loop
          style={{ width: 150, height: 150 }}
        />
        <Text style={styles.errorText}>{error || t('conductorHome.unknownError')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#028dd0" />
      <LinearGradient colors={['#028dd0', '#01579B']} style={styles.header}>
        <View style={styles.brandLogoContainer}>
          <Image
            source={{ uri: `${STORAGE_URL}/${vehicle.logo_url}` }}
            style={styles.brandLogo}
            defaultSource={require('../../assets/logo-faucon.png')}
          />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.vehicleName}>{`${vehicle.brand_name} ${vehicle.model}`}</Text>
          <Text style={styles.licensePlate}>{vehicle.plate_number}</Text>
        </View>
      </LinearGradient>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderAdBanner()}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>{t('conductorHome.vehicleDetails')}</Text>
          <View style={styles.detailsGrid}>
            <DetailItem icon="calendar-outline" label={t('conductorHome.year')} value={vehicle.year.toString()} />
            <DetailItem icon="speedometer-outline" label={t('conductorHome.kilometers')} value={`${vehicle.kilometers} km`} />
            <DetailItem icon="water-outline" label={t('conductorHome.fuelType')} value={t(`conductorHome.fuelTypes.${vehicle.fuel_type}`)} />
            <DetailItem icon="cog-outline" label={t('conductorHome.transmission')} value={t(`conductorHome.transmissionTypes.${vehicle.transmission}`)} />
          </View>
          <TouchableOpacity onPress={() => setShowFullVin(!showFullVin)} style={styles.vinContainer}>
            <Ionicons name="barcode-outline" size={24} color="#028dd0" style={styles.vinIcon} />
            <View>
              <Text style={styles.detailLabel}>{t('conductorHome.vin')}</Text>
              <Text style={styles.detailValue}>
                {showFullVin ? vehicle.vin_number : vehicle.vin_number.slice(0, 5) + '...'}
              </Text>
            </View>
            <Ionicons
              name={showFullVin ? 'eye-off-outline' : 'eye-outline'}
              size={24}
              color="#028dd0"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>{t('conductorHome.upcomingServices')}</Text>
          {upcomingServices.length > 0 ? (
            <FlatList
              data={upcomingServices}
              renderItem={renderServiceItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <LottieView
                autoPlay={true}
                style={styles.emptyStateAnimation}
                source={require("../../assets/emptybag.json")}
              />
              <Text style={styles.noServicesText}>{t('conductorHome.noUpcomingServices')}</Text>
              <TouchableOpacity 
                style={styles.orderNewServiceButton} 
                onPress={() => navigation.navigate('ConductorServicesScreen')}
              >
                <Text style={styles.orderNewServiceButtonText}>{t('common.orderNewService')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const DetailItem: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={styles.detailItem}>
    <Ionicons name={icon} size={24} color="#028dd0" style={styles.detailIcon} />
    <View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    marginBottom: 20,
    
marginTop: 20,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 40,
  },
  brandLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  brandLogo: {
    width: '70%',
    height: '70%',
    resizeMode: 'contain',
  },
  headerTextContainer: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  licensePlate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  carouselContainer: {
    height: 200,
    marginVertical: 15,
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
  bannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 15,
  },
  bannerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  bannerDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  infoCard: {
    margin: 15,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#028dd0',
    marginBottom: 15,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
  },
  detailIcon: {
    marginRight: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  vinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  vinIcon: {
    marginRight: 10,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  serviceItemContent: {
    flex: 1,
  },
  serviceType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 5,
  },
  serviceDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateAnimation: {
    width: 200,
    height: 200,
  },
  noServicesText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  orderNewServiceButton: {
    backgroundColor: '#028dd0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  orderNewServiceButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConductorHomeScreen;

