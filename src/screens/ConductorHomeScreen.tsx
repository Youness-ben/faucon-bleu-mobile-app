import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, FlatList, Platform,Animated, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import api from '../api';
import { STORAGE_URL } from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import LottieView from "lottie-react-native";


type RootStackParamList = {
  OrderService: { serviceId: number };
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

interface ServiceRecord {
  id: number;
  service_name: string;
  completion_date: string;
  status: 'completed' | 'cancelled';
  price: number;
}

interface Service {
  id: number;
  name: string;
  description: string;
  scheduled_at: string;
}

interface Banner {
  id: number;
  image_path: string;
  title: string;
  description: string;
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

const ConductorHomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ConductorHomeScreenNavigationProp>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [upcomingServices, setUpcomingServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullVin, setShowFullVin] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);



  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [vehicleResponse,bannersResponse, servicesResponse] = await Promise.all([
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
    } finally {
      setIsLoading(false);
    }
  }, [t]);

   useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  ); 
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    let token;
    if (Constants.isDevice || true) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
      alert('Must use physical device for Push Notifications');
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
  const handleOrderService = (serviceId: number,service : any) => {
    navigation.navigate('TicketScreen', { serviceId : serviceId ,service : service});
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
              <Image source={{ uri: `${STORAGE_URL}/${item.image_path}` }} style={styles.adBannerImage}
              defaultSource={require('../../assets/logo.png') }
              />
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


  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !vehicle) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || t('conductorHome.unknownError')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }


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

 const renderServiceItem = ({ item }: { item: ServiceRecord }) => {
    return (
    <TouchableOpacity
      style={styles.serviceItem}
      onPress={()=>handleOrderService(item.id,item)}
    >
    <View   style={{flex:1}}   >
        <Text style={styles.serviceType}>{item.service?.name || t('serviceHistory.unknownService')}</Text>

        <Text style={styles.serviceDate}>{item.scheduled_at ? format(item.scheduled_at, 'MM/dd/yyyy') : 'N/A' }</Text>
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
  return (
    <ScrollView style={styles.container}>
      {renderAdBanner()}
      <View style={styles.header}>
        <View style={styles.brandLogoContainer}>
          <Image
            source={{ uri: `${STORAGE_URL}/${vehicle.logo_url}` }}
            style={styles.brandLogo}
            width={24}
            defaultSource={require('../../assets/logo-faucon.png')}
          />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.vehicleName}>{`${vehicle.brand_name} ${vehicle.model}`}</Text>
          <Text style={styles.licensePlate}>{vehicle.plate_number}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>{t('conductorHome.vehicleDetails')}</Text>
        <View style={styles.detailsGrid}>
          <DetailItem icon="calendar-outline" label={t('conductorHome.year')} value={vehicle.year.toString()} />
          <DetailItem icon="speedometer-outline" label={t('conductorHome.kilometers')} value={`${vehicle.kilometers} km`} />
          <DetailItem icon="water-outline" label={t('conductorHome.fuelType')} value={t(`conductorHome.fuelTypes.${vehicle.fuel_type}`)} />
          <DetailItem icon="cog-outline" label={t('conductorHome.transmission')} value={t(`conductorHome.transmissionTypes.${vehicle.transmission}`)} />
        </View>
        <TouchableOpacity onPress={() => setShowFullVin(!showFullVin)} style={styles.vinContainer}>
          <Ionicons name="barcode-outline" size={24} color={theme.colors.primary} style={styles.vinIcon} />
          <View>
            <Text style={styles.detailLabel}>{t('conductorHome.vin')}</Text>
            <Text style={styles.detailValue}>
              {showFullVin ? vehicle.vin_number : vehicle.vin_number.slice(0, 5) + '...'}
            </Text>
          </View>
          <Ionicons
            name={showFullVin ? 'eye-off-outline' : 'eye-outline'}
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.infoCardUp}>
        <Text style={styles.sectionTitle}>{t('conductorHome.upcomingServices')}</Text>
        {upcomingServices.length > 0 ? (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={upcomingServices}
            renderItem={renderServiceItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        ) : (
          <>
            <LottieView
                      
                    autoPlay={true}
                    style={{width:200,height:undefined,aspectRatio:1,marginHorizontal:'auto'}}
                    source={require("../../assets/emptybag.json")}
                  />
          <Text style={styles.noServicesText}>{t('conductorHome.noUpcomingServices')}</Text>
                  <TouchableOpacity style={[styles.retryButton,{width:150,marginHorizontal:'auto',marginTop:20,alignItems:'center'}]} onPress={()=>navigation.navigate('ConductorServicesScreen')}>
          <Text style={styles.retryButtonText}>{t('common.orderNewService')}</Text>
        </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const DetailItem: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <View style={styles.detailItem}>
    <Ionicons name={icon} size={24} color={theme.colors.primary} style={styles.detailIcon} />
    <View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  brandLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    overflow: 'hidden',
  },
  brandLogo: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  headerTextContainer: {
    flex: 1,
  },
  vehicleName: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: 'white',
  },
  licensePlate: {
    fontSize: theme.typography.sizes.lg,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  infoCard: {
    borderRadius: theme.roundness,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    ...theme.elevation.medium,

    paddingTop:5,
    paddingBottom:0,
  },
  infoCardUp: {
    borderRadius: theme.roundness,
    marginTop:0,
    paddingTop:0,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    ...theme.elevation.medium,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
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
    marginBottom: theme.spacing.md,
  },
  detailIcon: {
    marginRight: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeights.medium,
  },
  vinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  vinIcon: {
    marginRight: theme.spacing.sm,
  },

  listContent: {
    paddingBottom: theme.spacing.xl,
  },

  serviceName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
  },
  serviceDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  serviceDate: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
  },
  noServicesText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
   serviceItem: {
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.sm,
    backgroundColor: 'white',
    flexDirection:'row',
    flex:1,
    margin:5
  },
  serviceType: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  vehicleName: {
    fontSize: theme.typography.sizes.md,
    color: 'white',
    fontWeight:'bold',
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
});

export default ConductorHomeScreen;