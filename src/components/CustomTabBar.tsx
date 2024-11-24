import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, Animated, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const animatedValues = useRef(state.routes.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const focusedTab = state.index;
    Animated.parallel(
      animatedValues.map((anim, index) =>
        Animated.spring(anim, {
          toValue: index === focusedTab ? 1 : 0,
          useNativeDriver: true,
          friction: 4,
          tension: 40,
        })
      )
    ).start();
  }, [state.index, animatedValues]);

  return (
    <View style={styles.container}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#028dd0" stopOpacity="1" />
            <Stop offset="1" stopColor="#01579B" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Path
          d={`M0 0L${width} 0L${width} 60C${width} 88 ${width - 30} 100 ${width - 70} 100L70 100C30 100 0 88 0 60L0 0Z`}
          fill="url(#grad)"
        />
      </Svg>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const animatedIconStyle = {
          transform: [
            {
              scale: animatedValues[index].interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1],
              }),
            },
            {
              translateY: animatedValues[index].interpolate({
                inputRange: [0, 1],
                outputRange: [10, 7],
              }),
            },
          ],
        };

        const animatedTextStyle = {
          opacity: animatedValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0.7, 1],
          }),
          transform: [
            {
              translateY: animatedValues[index].interpolate({
                inputRange: [1, 1],
                outputRange: [6, 6],
              }),
            },
          ],
        };

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabButton}
          >
            <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
              <Ionicons
                name={options.tabBarIcon({ focused: isFocused, color: '', size: 24 }).props.name}
                size={24}
                color={isFocused ?'rgba(2, 141, 208, 1)' : 'rgba(2, 141, 208, 1)'}
              />
            </Animated.View>
            <Animated.Text style={[styles.tabText, animatedTextStyle]}>
              {label}
            </Animated.Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 80,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    marginBottom: 5,
  },
  tabText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginTop: 2,
    fontWeight:'bold',
    color: 'white',
  },
});

export default CustomTabBar;

