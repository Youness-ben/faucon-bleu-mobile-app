import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, ListRenderItem } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import VehicleItem from '../components/VehicleItem';

type RootStackParamList = {
  ServiceHistory: undefined;
  VehicleDetail: { vehicleId: string };
  OrderService: { serviceType: string };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Service {
  id: string;
  type: string;
  date: string;
  status: string;
}

interface AdBanner {
  id: string;
  imageUrl: string;
  title: string;
}

interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  lastService: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [activeSlide, setActiveSlide] = useState(0);

  const dummyServices: Service[] = [
    { id: '1', type: 'Oil Change', date: '2023-05-15', status: 'Completed' },
    { id: '2', type: 'Tire Rotation', date: '2023-05-20', status: 'Scheduled' },
    { id: '3', type: 'Brake Inspection', date: '2023-05-25', status: 'In Progress' },
  ];

  const dummyAdBanners: AdBanner[] = [
    { id: '1', imageUrl: 'https://api.dabablane.icamob.ma/faucon-demo/banner1.jpeg', title: 'Summer Service Special' },
    { id: '2', imageUrl: 'https://api.dabablane.icamob.ma/faucon-demo/banner2.jpeg', title: 'New Tire Promotion' },
    { id: '3', imageUrl: 'https://api.dabablane.icamob.ma/faucon-demo/banner3.jpeg', title: 'Free Battery Check' },
  ];

  const dummyVehicles: Vehicle[] = [
    { id: '1', name: 'Toyota Camry', licensePlate: 'ABC 123', lastService: '2023-04-10' },
    { id: '2', name: 'Honda Civic', licensePlate: 'XYZ 789', lastService: '2023-03-22' },
    { id: '3', name: 'Ford F-150', licensePlate: 'DEF 456', lastService: '2023-05-05' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return theme.colors.success;
      case 'Scheduled':
        return theme.colors.warning;
      case 'In Progress':
        return theme.colors.info;
      default:
        return theme.colors.text;
    }
  };

  const renderAdBanner = useCallback(() => (
    <View style={styles.carouselContainer}>
      <FlatList
        data={dummyAdBanners}
        renderItem={({ item }) => (
          <View style={styles.adBannerItem}>
            <Image source={{ uri: item.imageUrl }} style={styles.adBannerImage} />
          </View>
        )}
        keyExtractor={(item) => item.id}
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
      <View style={styles.pagination}>
        {dummyAdBanners.map((_, index) => (
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
  ), [activeSlide]);

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
      <FlatList
        data={dummyVehicles}
        renderItem={({ item }) => (
          <VehicleItem
            id={item.id}
            name={item.name}
            licensePlate={item.licensePlate}
            lastService={item.lastService}
          />
        )}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.vehicleList}
      />
    </View>
  ), [t]);

  const renderServiceItem: ListRenderItem<Service> = useCallback(({ item }) => (
    <TouchableOpacity 
      style={styles.serviceItem}
      onPress={() => navigation.navigate('OrderService', { serviceType: item.type })}
    >
      <View style={styles.serviceIcon}>
        <Ionicons name="construct-outline" size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceType}>{item.type}</Text>
        <Text style={styles.serviceDate}>{item.date}</Text>
      </View>
      <Text style={[styles.serviceStatus, { color: getStatusColor(item.status) }]}>{item.status}</Text>
    </TouchableOpacity>
  ), [navigation]);

  const renderServices = useCallback(() => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{t('home.upcomingServices')}</Text>
      <FlatList
        data={dummyServices}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
      <TouchableOpacity
        style={styles.viewAllButton}
        onPress={() => navigation.navigate('ServiceHistory')}
      >
        <Text style={styles.viewAllButtonText}>{t('home.viewAllServices')}</Text>
      </TouchableOpacity>
    </View>
  ), [t, navigation, renderServiceItem]);

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

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      style={styles.container}
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
});

export default HomeScreen;