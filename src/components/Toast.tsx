import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../contexts/ToastContext';

const { width } = Dimensions.get('window');

const Toast: React.FC = () => {
  const { toastMessage, toastType, isVisible, hideToast } = useToast();
  const opacity = new Animated.Value(0);

  useEffect(() => {
    if (isVisible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => hideToast());
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const icon = toastType === 'error' ? 'alert-circle' : toastType === 'success' ? 'checkmark-circle' : 'information-circle';
  const backgroundColor = toastType === 'error' ? '#FF3B30' : toastType === 'success' ? '#4CD964' : '#0A84FF';

  return (
    <Animated.View style={[styles.container, { opacity, backgroundColor }]}>
      <Ionicons name={icon} size={24} color="#FFFFFF" />
      <Text style={styles.message}>{toastMessage}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: width * 0.05,
    right: width * 0.05,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 10,
    
  },
});

export default Toast;

