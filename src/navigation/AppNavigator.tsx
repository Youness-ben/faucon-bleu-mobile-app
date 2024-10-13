import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import FleetScreen from '../screens/FleetScreen';
import ServicesScreen from '../screens/ServicesScreen';
import OrderServiceScreen from '../screens/OrderServiceScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ServiceHistoryScreen from '../screens/ServiceHistoryScreen';
import AddVehicleScreen from '../screens/AddVehicleScreen';
import VehicleDetailScreen from  '../screens/VehicleDetailScreen';
import { theme } from '../styles/theme';
import InvoicesScreen from '../screens/InvoicesScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SupportScreen from '../screens/SupportScreen';

type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  OrderService: { serviceType: string; vehicleId?: string };
  ServiceHistory: undefined;
  AddVehicle: undefined;
  VehicleDetail: { vehicleId: string };
};

type MainTabParamList = {
  Home: undefined;
  Fleet: undefined;
  Services: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
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
      })}
      tabBarOptions={{
        activeTintColor: theme.colors.primary,
        inactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('navigation.home') }} />
      <Tab.Screen name="Fleet" component={FleetScreen} options={{ title: t('navigation.fleet') }} />
      <Tab.Screen name="Services" component={ServicesScreen} options={{ title: t('navigation.services') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('navigation.profile') }} />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="OrderService" component={OrderServiceScreen} options={{ title: 'Order Service' }} />
        <Stack.Screen name="ServiceHistory" component={ServiceHistoryScreen} options={{ title: 'Service History' }} />
        <Stack.Screen name="AddVehicle" component={AddVehicleScreen} options={{ title: 'Add Vehicle' }} />
        <Stack.Screen name="VehicleDetail" component={VehicleDetailScreen} options={{ title: 'Vehicle Details' }} />
        <Stack.Screen name="Invoices" component={InvoicesScreen} options={{ title: 'Invoices' }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit profile' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'Support' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;