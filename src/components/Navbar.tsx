import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ICON_SIZE = 24;
const NAVBAR_HEIGHT = 60;

const navItems = [
  { name: 'Home', icon: 'home-outline' },
  { name: 'Fleet', icon: 'car-outline' },
  { name: 'Services', icon: 'construct-outline' },
  { name: 'Profile', icon: 'person-outline' },
];

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();

  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const iconScales = useRef(navItems.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    const currentIndex = navItems.findIndex(item => item.name === route.name);
    moveIndicator(currentIndex);
    animateIcon(currentIndex);
  }, [route]);

  const moveIndicator = (index: number) => {
    Animated.spring(indicatorPosition, {
      toValue: index * (SCREEN_WIDTH / navItems.length),
      useNativeDriver: true,
    }).start();
  };

  const animateIcon = (index: number) => {
    iconScales.forEach((scale, i) => {
      Animated.spring(scale, {
        toValue: i === index ? 1.2 : 1,
        useNativeDriver: true,
      }).start();
    });
  };

  const handlePress = (index: number, routeName: string) => {
    moveIndicator(index);
    animateIcon(index);
    navigation.navigate(routeName);
  };

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.indicator, 
          { transform: [{ translateX: indicatorPosition }] }
        ]} 
      />
      {navItems.map((item, index) => {
        const isActive = route.name === item.name;
        const textColor = isActive ? theme.colors.primary : theme.colors.textSecondary;

        return (
          <TouchableOpacity
            key={item.name}
            style={styles.navItem}
            onPress={() => handlePress(index, item.name)}
          >
            <Animated.View style={{ transform: [{ scale: iconScales[index] }] }}>
              <Ionicons name={item.icon as any} size={ICON_SIZE} color={textColor} />
            </Animated.View>
            <Text style={[styles.navText, { color: textColor }]}>
              {t(`navbar.${item.name.toLowerCase()}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: NAVBAR_HEIGHT,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    elevation: 8,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH / navItems.length,
    height: 3,
    backgroundColor: theme.colors.primary,
  },
});

export default Navbar;