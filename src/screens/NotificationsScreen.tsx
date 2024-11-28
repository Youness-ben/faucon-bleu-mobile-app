import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../api';
import { format } from 'date-fns';
import { theme } from '../styles/theme';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import Toast from 'react-native-toast-message';

interface Notification {
  id: number;
  title: string;
  body: string;
  created_at: string;
  client_read_at: string | null;
  type: string;
  data: any;
}

const ITEMS_PER_PAGE = 10;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const NotificationsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnims = useRef<{ [key: number]: Animated.Value }>({}).current;
  const pulseAnims = useRef<{ [key: number]: Animated.Value }>({}).current;

  const fetchNotifications = useCallback(async (pageNumber: number, refresh = false) => {
    if (pageNumber === 1) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const response = await api.get('/client/notifications', {
        params: { page: pageNumber, per_page: ITEMS_PER_PAGE }
      });
      const newNotifications = response.data.data;
      if (pageNumber === 1 || refresh) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prevNotifications => [...prevNotifications, ...newNotifications]);
      }
      setHasMore(newNotifications.length === ITEMS_PER_PAGE);
      setPage(pageNumber);

      // Start the fade-in animation for the list
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Create fade and pulse animations for new unread notifications
      newNotifications.forEach(notification => {
        if (!notification.client_read_at) {
          if (!fadeAnims[notification.id]) {
            fadeAnims[notification.id] = new Animated.Value(0);
            Animated.timing(fadeAnims[notification.id], {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }).start();
          }
          if (!pulseAnims[notification.id]) {
            pulseAnims[notification.id] = new Animated.Value(1);
            Animated.loop(
              Animated.sequence([
                Animated.timing(pulseAnims[notification.id], {
                  toValue: 1.2,
                  duration: 1000,
                  easing: Easing.inOut(Easing.ease),
                  useNativeDriver: true,
                }),
                Animated.timing(pulseAnims[notification.id], {
                  toValue: 1,
                  duration: 1000,
                  easing: Easing.inOut(Easing.ease),
                  useNativeDriver: true,
                }),
              ])
            ).start();
          }
        }
      });
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(t('notifications.fetchError'));
      Toast.show({
        type: 'error',
        text1: t('notifications.fetchError'),
        text2: t('notifications.tryAgainLater'),
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t, fadeAnim, fadeAnims, pulseAnims]);

  const markAllAsRead = useCallback(async () => {
    try {
      return;
      await api.post('/client/notifications/mark-all-read');
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({
          ...notification,
          client_read_at: notification.client_read_at || new Date().toISOString()
        }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications(1);
      markAllAsRead();
    }, [fetchNotifications, markAllAsRead])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchNotifications(1, true);
  }, [fetchNotifications]);

  const loadMore = () => {
    if (hasMore && !isLoading) {
      fetchNotifications(page + 1);
    }
  };

  const markAsRead = async (notification: Notification)  => {
    try {
      await api.post(`/client/notifications/${notification.id}/read`);
      setNotifications(prevNotifications =>
        prevNotifications.map(Lnotification =>
          Lnotification.id === notification.id
            ? { ...Lnotification, client_read_at: new Date().toISOString() }
            : Lnotification
        )
      ); 
      
        const data = JSON.parse(notification.data);
       if (data.type === 'new_message' && data.serviceId) {
        
        navigation.navigate('TicketScreen', { serviceId: data?.serviceId });
      } else if (data.type === 'redirect' && data.screen) {
        navigation.navigate(data?.screen, data?.params || {});
      } else {
     
        console.log('General notification tapped:', notification.body);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const isUnread = !item.client_read_at;
    const itemFadeAnim = fadeAnims[item.id] || new Animated.Value(1);
    const itemPulseAnim = pulseAnims[item.id] || new Animated.Value(1);

    return (
      <Animated.View style={{ opacity: itemFadeAnim }}>
        <TouchableOpacity
          style={[
            styles.notificationItem,
            isUnread && styles.unreadNotification,
          ]}
          onPress={() => markAsRead(item)}
        >
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationBody}>{item.body}</Text>
            <Text style={styles.notificationDate}>
              {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
            </Text>
          </View>
          {isUnread && (
            <Animated.View 
              style={[
                styles.unreadIndicator,
                {
                  transform: [{ scale: itemPulseAnim }],
                },
              ]} 
            />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isLoading && page === 1) {
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

  if (error && notifications.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <LottieView
          source={require('../../assets/error-animation.json')}
          autoPlay
          loop
          style={{ width: 150, height: 150 }}
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchNotifications(1)}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#028dd0" />
      <LinearGradient colors={['#028dd0', '#01579B']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('notifications.title')}</Text>
      </LinearGradient>
      {notifications.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <LottieView
            source={require('../../assets/empty-state-animation.json')}
            autoPlay
            loop
            style={{ width: 200, height: 200 }}
          />
          <Text style={styles.emptyStateText}>{t('notifications.noNotifications')}</Text>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            onEndReached={loadMore}
            onEndReachedThreshold={0.1}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }
            ListFooterComponent={() => (
              hasMore ? (
                <View style={styles.loadingMore}>
                  <LottieView
                    source={require('../../assets/loading-animation.json')}
                    autoPlay
                    loop
                    style={{ width: 50, height: 50 }}
                  />
                </View>
              ) : null
            )}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
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
    marginVertical: 20,
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
  listContent: {
    paddingVertical: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 2,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,

  },
  unreadNotification: {  
  
    shadowColor: 'rgba(2, 141, 208, 0.1)',
    backgroundColor: 'rgba(2, 141, 208, 0.1)',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 5,
  },
  notificationBody: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
  },
  notificationDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#028dd0',
    marginLeft: 10,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingMore: {
    alignItems: 'center',
    paddingVertical: 20,
  },
});

export default NotificationsScreen;

