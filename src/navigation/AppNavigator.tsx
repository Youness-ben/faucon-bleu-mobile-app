import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import ConductorLoginScreen from '../screens/ConductorLoginScreen';
import HomeScreen from '../screens/HomeScreen';
import FleetScreen from '../screens/FleetScreen';
import ServicesScreen from '../screens/ServicesScreen';
import OrderServiceScreen from '../screens/OrderServiceScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ServiceHistoryScreen from '../screens/ServiceHistoryScreen';
import AddVehicleScreen from '../screens/AddVehicleScreen';
import VehicleDetailScreen from '../screens/VehicleDetailScreen';
import InvoicesScreen from '../screens/InvoicesScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SupportScreen from '../screens/SupportScreen';
import ChatScreen from '../screens/ChatScreen';
import TicketScreen from '../screens/TicketScreen';
import ConductorHomeScreen from '../screens/ConductorHomeScreen';
import ConductorOrderServiceScreen from '../screens/ConductorOrderServiceScreen';
import ConductorServiceHistoryScreen from '../screens/ConductorServiceHistoryScreen';
import ConductorServicesScreen from '../screens/ConductorServicesScreen';
import ConductorSettingsScreen from '../screens/ConductorSettingsScreen';
import AccountDeletionConfirmation from '../screens/AccountDeletionConfirmation';

import { theme } from '../styles/theme';
import CustomTabBar from '../components/CustomTabBar';
import NotificationsScreen from '../screens/NotificationsScreen';
import ClientAccountsScreen from '../screens/ClientAccountsScreen';
import AddClientScreen from '../screens/AddClientScreen';
import ClientDetailScreen from '../screens/ClientDetailScreen';
import AccountFleetScreen from '../screens/AccountFleetScreen';
import AccountCreationConfirmation from '../screens/AccountCreationConfirmation';
import StatisticsScreen from '../screens/StatisticsScreen';

type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  ConductorLogin: undefined;
  Main: undefined;
  ConductorMain: undefined;
  OrderService: { Service?: any; vehicleId?: string };
  ServiceHistory: undefined;
  AddVehicle: undefined;
  VehicleDetail: { vehicleId: string };
  Invoices: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Support: undefined;
  TicketScreen: { ticketId: string };
  ConductorOrderServiceScreen: undefined;
  AccountDeletionConfirmation: undefined;
  Notifications : undefined;
  ClientAccounts : undefined;
  AddClient : undefined;
  AccountFleetScreen : undefined;
  ClientDetail : undefined;
  AccountCreationConfirmation :  undefined;
  statistics : undefined;
};

type MainTabParamList = {
  Home: undefined;
  Fleet: undefined;
  Services: undefined;
  Profile: undefined;
};

type ConductorTabParamList = {
  ConductorHome: undefined;
  ConductorServiceHistory: undefined;
  ConductorServicesScreen: undefined;
  ConductorSettings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const ConductorTab = createBottomTabNavigator<ConductorTabParamList>();

const MainTabs: React.FC = () => {
  const { t } = useTranslation();

  return (
    <MainTab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Fleet') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'Services') {
            iconName = focused ? 'construct' : 'construct-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'alert-circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      })}
    >
      <MainTab.Screen name="Home" component={HomeScreen} options={{ title: t('navigation.home') }} />
      <MainTab.Screen name="Fleet" component={FleetScreen} options={{ title: t('navigation.fleet') }} />
      <MainTab.Screen name="Services" component={ServicesScreen} options={{ title: t('navigation.services') }} />
      <MainTab.Screen name="Profile" component={ProfileScreen} options={{ title: t('navigation.profile') }} />
    </MainTab.Navigator>
  );
};

const ConductorTabs: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ConductorTab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'ConductorHome') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ConductorServicesScreen') {
            iconName = focused ? 'construct' : 'construct-outline';
          } else if (route.name === 'ConductorServiceHistory') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'ConductorSettings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'alert-circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
      })}
    >
      <ConductorTab.Screen name="ConductorHome" component={ConductorHomeScreen} options={{ title: t('navigation.home') }} />
      <ConductorTab.Screen name="ConductorServicesScreen" component={ConductorServicesScreen} options={{ title: t('navigation.orderService') }} />
      <ConductorTab.Screen name="ConductorServiceHistory" component={ConductorServiceHistoryScreen} options={{ title: t('navigation.serviceHistory') }} />
      <ConductorTab.Screen name="ConductorSettings" component={ConductorSettingsScreen} options={{ title: t('navigation.settings') }} />
    </ConductorTab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ConductorLogin" component={ConductorLoginScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="ConductorMain" component={ConductorTabs} />
      <Stack.Screen name="OrderService" component={OrderServiceScreen} />
      <Stack.Screen name="ConductorOrderServiceScreen" component={ConductorOrderServiceScreen} />
      <Stack.Screen name="ServiceHistory" component={ServiceHistoryScreen} />
      <Stack.Screen name="AddVehicle" component={AddVehicleScreen} />
      <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} />
      <Stack.Screen name="Invoices" component={InvoicesScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="AccountDeletionConfirmation" component={AccountDeletionConfirmation} />
      <Stack.Screen name="AccountCreationConfirmation" component={AccountCreationConfirmation} />
      <Stack.Screen name="TicketScreen" component={TicketScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen}  />
       <Stack.Screen name="ClientAccounts" component={ClientAccountsScreen} />
        <Stack.Screen name="AddClient" component={AddClientScreen} />
        <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
        <Stack.Screen name="AccountFleetScreen" component={AccountFleetScreen} />
        <Stack.Screen name="statistics" component={StatisticsScreen} />
       
    </Stack.Navigator>
  );
};

export default AppNavigator;

