import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  RefreshControl, 
  Animated, 
  Dimensions,
  TextInput,
  StatusBar
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';
import api from '../api';
import { STORAGE_URL } from '../../config';

type RootStackParamList = {
  ClientDetail: { clientId: number };
  AddClient: undefined;
};

type ClientAccountsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Client {
  id: number;
  email: string;
  raison_social: string;
  first_name: string;
  last_name: string;
  phone: string;
  client_type: string;
  avatar: string;
}

interface PaginatedResponse {
  data: Client[];
  current_page: number;
  last_page: number;
}

const ITEMS_PER_PAGE = 10;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SkeletonItem: React.FC = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.clientCard, { opacity }]}>
      <View style={[styles.clientAvatar, styles.skeleton]} />
      <View style={styles.clientInfo}>
        <View style={[styles.skeletonText, { width: '70%' }]} />
        <View style={[styles.skeletonText, { width: '50%', marginTop: 8 }]} />
      </View>
    </Animated.View>
  );
};

const EmptyState: React.FC<{ onAddClient: () => void }> = ({ onAddClient }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.emptyStateContainer}>
      <LottieView
        source={require('../../assets/empty-state-animation.json')}
        autoPlay
        loop
        style={styles.emptyStateAnimation}
      />
      <Text style={styles.emptyStateTitle}>{t('clientAccounts.emptyStateTitle')}</Text>
      <Text style={styles.emptyStateDescription}>{t('clientAccounts.emptyStateDescription')}</Text>
      <TouchableOpacity style={styles.emptyStateButton} onPress={onAddClient}>
        <Ionicons name="add-circle-outline" size={24} color="white" style={styles.emptyStateButtonIcon} />
        <Text style={styles.emptyStateButtonText}>{t('clientAccounts.addFirstClient')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const ClientAccountsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ClientAccountsScreenNavigationProp>();

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchClients = useCallback(async (page: number, refresh: boolean = false, search: string = '') => {
    if (refresh) {
      setIsRefreshing(true);
    } else if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const response = await api.get<PaginatedResponse>(`client/accounts?page=${page}&per_page=${ITEMS_PER_PAGE}&search=${search}`);
      if (response && response.data && Array.isArray(response.data.data)) {
        const newClients = response.data.data;

        setClients(prevClients => (refresh || page === 1 ? newClients : [...prevClients, ...newClients]));
        setCurrentPage(response.data.current_page);
        setLastPage(response.data.last_page);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(t('clientAccounts.fetchError'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [t]);
  
  useFocusEffect(
    useCallback(() => {
      fetchClients(1, true, searchQuery);
    }, [fetchClients, searchQuery])
  );

  const handleRefresh = useCallback(() => {
    fetchClients(1, true, searchQuery);
  }, [fetchClients, searchQuery]);

  const handleLoadMore = useCallback(() => {
    if (currentPage < lastPage && !isLoading && !isLoadingMore) {
      fetchClients(currentPage + 1, false, searchQuery);
    }
  }, [currentPage, lastPage, isLoading, isLoadingMore, fetchClients, searchQuery]);

  const handleAddClient = useCallback(() => {
    navigation.navigate('AddClient');
  }, [navigation]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    fetchClients(1, true, text);
  }, [fetchClients]);

  const renderClientItem = useCallback(({ item }: { item: Client }) => (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={() => navigation.navigate('ClientDetail', { clientId: item.id })}
    >
      <View style={styles.clientAvatar}>
        <Image 
          source={{ uri: item.avatar ? `${STORAGE_URL}/${item.avatar}` : 'https://via.placeholder.com/150' }} 
          style={styles.avatarImage} 
          defaultSource={require('../../assets/default_user.png')}
        />
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{`${item.first_name} ${item.last_name}`}</Text>
        <Text style={styles.clientEmail}>{item.email}</Text>
        <Text style={styles.clientType}>{item.client_type}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#028dd0" />
    </TouchableOpacity>
  ), [navigation]);

  const renderFooter = useMemo(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }, [isLoadingMore]);

  const renderContent = useMemo(() => {
    if (isLoading && (!clients || clients.length === 0)) {
      return (
        <FlatList
          data={Array(ITEMS_PER_PAGE).fill(0)}
          renderItem={() => <SkeletonItem />}
          keyExtractor={(_, index) => `skeleton-${index}`}
          contentContainerStyle={styles.listContent}
        />
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <LottieView
            source={require('../../assets/error-animation.json')}
            autoPlay
            loop
            style={styles.errorAnimation}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchClients(1, true)}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!clients || clients.length === 0) {
      return <EmptyState onAddClient={handleAddClient} />;
    }

    return (
      <FlatList
        data={clients}
        renderItem={renderClientItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={10}
        updateCellsBatchingPeriod={50}
      />
    );
  }, [isLoading, clients, error, isRefreshing, handleRefresh, handleLoadMore, renderClientItem, renderFooter, t, fetchClients, handleAddClient]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#028dd0" />
      <LinearGradient colors={['#028dd0', '#01579B']} style={styles.header}>
        <Text style={styles.title}>{t('clientAccounts.title')}</Text>
      </LinearGradient>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={24} color={theme.colors.primary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('clientAccounts.searchPlaceholder')}
          placeholderTextColor="#A0A0A0"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      {renderContent}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddClient}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    marginVertical: 10,
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
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(2, 141, 208, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 5,
  },
  clientEmail: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
  },
  clientType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#028dd0',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: theme.colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation:5,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerLoader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  skeleton: {
    backgroundColor: '#F0F0F0',
  },
  skeletonText: {
    height: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyStateAnimation: {
    width: 200,
    height: 200,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  emptyStateButtonIcon: {
    marginRight: 10,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    marginHorizontal: 20,
    marginVertical: 10,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: theme.colors.text,
  },
  errorAnimation: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
});

export default ClientAccountsScreen;

