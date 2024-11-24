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
import { theme } from '../styles/theme';

type RootStackParamList = {
  ServiceHistory: undefined;
  VehicleDetail: { vehicleId: number };
  OrderService: { serviceType: string };
  Services: undefined;
  Support: undefined;
  TicketScreen: { serviceId: number, service: any };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Service {
  id: number;
  service: {
    name: string;
    icon: string;
  };
  scheduled_at: string;
  status: 'completed' | 'cancelled' | 'pending' | 'in_progress';
  vehicle?: {
    brand_name: string;
    model: string;
    plate_number: string;
  };
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
  logo_url: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [services, setServices] = useState<Service[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const bannerRef = useRef<FlatList>(null);
  const bannerInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [servicesResponse, bannersResponse, vehiclesResponse] = await Promise.all([
        api.get('/client/coming-order-services'),
        api.get('/client/banners'),
        api.get('/client/home-vehicles')
      ]);
      setServices(servicesResponse.data);
      setBanners(bannersResponse.data);
      setVehicles(vehiclesResponse.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(t('home.fetchError'));
      Toast.show({
        type: 'error',
        text1: t('home.fetchError'),
        text2: t('home.tryAgainLater'),
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
    // ... (keep the existing implementation)
  };

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

  const renderAdBanner = () => (
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
  );

  const renderVehicles = () => (
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>{t('home.myVehicles')}</Text>
      {vehicles.length > 0 ? (
        <FlatList
          data={vehicles}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.vehicleItem}
              onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
            >
              <View style={styles.vehicleLogoContainer}>
                <Image
                  source={{ uri: `${STORAGE_URL}/${item.logo_url}` }}
                  style={styles.vehicleLogo}
                  defaultSource={require('../../assets/logo-faucon.png')}
                />
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{`${item.brand_name} ${item.model}`}</Text>
                <Text style={styles.vehiclePlate}>{item.plate_number}</Text>
                <Text style={styles.lastServiceDate}>
                  {t('home.lastService')}: {item.last_service_date ? format(new Date(item.last_service_date), 'dd/MM/yyyy') : t('home.noService')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#028dd0" />
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <LottieView
            autoPlay={true}
            style={styles.emptyStateAnimation}
            source={require("../../assets/emptybag.json")}
          />
          <Text style={styles.noVehiclesText}>{t('home.noVehicles')}</Text>
        </View>
      )}
    </View>
  );

  const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.serviceItem}
      onPress={() => navigation.navigate('TicketScreen', { serviceId: item.id, service: item })}
    >
      <View style={styles.serviceItemContent}>
        <View style={styles.serviceIcon}>
          <Image 
            source={{ uri: `${STORAGE_URL}/${item.service.icon}` }} 
            style={styles.serviceIconImage} 
            defaultSource={require('../../assets/logo.png')}
          />
        </View>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceType}>{item.service.name}</Text>
          <Text style={styles.serviceVehicle}>
            {item.vehicle ? `${item.vehicle.brand_name} ${item.vehicle.model}` : t('home.unknownVehicle')}
          </Text>
          <Text style={styles.serviceDate}>{item.scheduled_at ? format(new Date(item.scheduled_at), 'dd/MM/yyyy') : 'N/A'}</Text>
        </View>
        <View style={styles.serviceStatus}>
          <Text style={[styles.serviceStatusText, { color: getStatusColor(item.status) }]}>
            {t(`serviceStatus.${item.status}`)}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#028dd0" />
    </TouchableOpacity>
  );

  const renderServices = () => (
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>{t('home.upcomingServices')}</Text>
      {services.length > 0 ? (
        <FlatList
          data={services}
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
          <Text style={styles.noServicesText}>{t('home.noUpcomingServices')}</Text>
          <TouchableOpacity 
            style={styles.orderNewServiceButton} 
            onPress={() => navigation.navigate('Services')}
          >
            <Text style={styles.orderNewServiceButtonText}>{t('home.orderNewService')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <LottieView
          source={require('../../assets/error-animation.json')}
          autoPlay
          loop
          style={{ width: 150, height: 150 }}
        />
        <Text style={styles.errorText}>{error}</Text>
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
        <Text style={styles.headerTitle}>{t('home.welcome')}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('ServiceHistory')}
          >
            <Ionicons name="time-outline" size={24} color="#028dd0" />
            <Text style={styles.headerButtonText}>{t('home.serviceHistory')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Services')}
          >
            <Ionicons name="construct-outline" size={24} color="#028dd0" />
            <Text style={styles.headerButtonText}>{t('home.quickService')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Support')}
          >
            <Ionicons name="help-circle-outline" size={24} color="#028dd0" />
            <Text style={styles.headerButtonText}>{t('home.callSupport')}</Text>
          </TouchableOpacity>
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
        {renderVehicles()}
        {renderServices()}
      </ScrollView>
    </View>
  );
};

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
    padding: 15,
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  headerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  headerButtonText: {
    color: '#028dd0',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
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
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginRight: 15,
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
  },
  vehicleLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  vehicleLogo: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  vehiclePlate: {
    fontSize: 14,
    color: '#666666',
  },
  lastServiceDate: {
    fontSize: 12,
    color: '#999999',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  serviceIconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  serviceVehicle: {
    fontSize: 14,
    color: '#666666',
  },
  serviceDate: {
    fontSize: 12,
    color: '#999999',
  },
  serviceStatus: {
    marginLeft: 10,
  },
  serviceStatusText: {
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
  noVehiclesText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 20,
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

export default HomeScreen;

