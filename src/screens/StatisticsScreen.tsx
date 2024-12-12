import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import api from '../api';
import LottieView from 'lottie-react-native';
import { format } from 'date-fns';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Toast from 'react-native-toast-message';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

const StatisticsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedConductor, setSelectedConductor] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchVehicles();
    fetchConductors();
    fetchStatistics();
    fetchServiceHistory();
  }, [startDate, endDate, selectedVehicle, selectedConductor]);

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/client/vehicles/list');
      setVehicles(response.data.data);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };

  const fetchConductors = async () => {
    try {
      const response = await api.get('/client/statistics/conductors/list');
      setConductors(response.data);
    } catch (err) {
      console.error('Error fetching conductors:', err);
    }
  };

  const fetchStatistics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/client/statistics/summary', {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          vehicle_id: selectedVehicle,
          conductor_name: selectedConductor,
        },
      });
      setStatistics(response.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(t('statistics.fetchError'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServiceHistory = async () => {
    try {
      const response = await api.get('/client/statistics/service-history', {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          vehicle_id: selectedVehicle,
          conductor_name: selectedConductor,
        },
      });
      setServiceHistory(response.data.data);
    } catch (err) {
      console.error('Error fetching service history:', err);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStatistics().then(() => setRefreshing(false));
    fetchServiceHistory();
  }, []);

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const renderDatePicker = (date, onChange, show, setShow, label) => (
    <View style={styles.datePickerContainer}>
      <Text style={styles.datePickerLabel}>{label}</Text>
      <TouchableOpacity style={styles.datePickerButton} onPress={() => setShow(true)}>
        <Text style={styles.datePickerButtonText}>
          {date.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onChange}
        />
      )}
    </View>
  );

  const renderServiceHistoryItem = (item) => (
    <View style={styles.serviceHistoryItem}>
      <Text style={styles.serviceHistoryName}>{item.service?.name || t('serviceHistory.unknownService')}</Text>
      <Text style={styles.serviceHistoryName}>{ item.vehicle.brand_name+' '+item.vehicle.model+' '+item.vehicle.year|| t('serviceHistory.unknownVehicle')}</Text>
      <Text style={styles.serviceHistoryDate}>{item.vehicle.plate_number}</Text>
      <Text style={styles.serviceHistoryDate}>{format(new Date(item.scheduled_at), 'MMM dd, yyyy')}</Text>
      <Text style={[styles.serviceHistoryStatus, { color: getStatusColor(item.status) }]}>
        {t(`serviceStatus.${item.status}`)}
      </Text>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CD964';
      case 'pending': return '#FF9500';
      case 'in_progress': return '#5AC8FA';
      case 'cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const fileName = `statistics_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

       
      const downloadResumable = FileSystem.createDownloadResumable(
        `${api.defaults.baseURL}/client/statistics/download-pdf?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}&vehicle_id=${selectedVehicle}&conductor_name=${selectedConductor}`,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${api.defaults.headers.common['Authorization']}`,
          },
          httpMethod: 'GET',
        
        },
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          console.log(`Download progress: ${progress * 100}%`);
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      console.log('File downloaded to:', uri);

      await Sharing.shareAsync(uri);
    
    } catch (error) {
      console.error('Error downloading PDF:', error);
        Toast.show({
          type: 'error',
          text1: t('statistics.downloadError'),
          text2: t('statistics.downloadErrorMessage'),
          onPress: () => navigation.goBack(),
        });
    } finally {
      setIsDownloading(false);
    }
  };
  

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
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStatistics}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
                 
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#028dd0', '#01579B']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{t('statistics.title')}</Text>
         <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownloadPDF}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#028dd0" />
            ) : (
              <Ionicons name="document" size={24} color="#028dd0" />
            )}
          </TouchableOpacity>
        </View>
        
      </LinearGradient>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#028dd0']} />
        }
      >

           <View style={styles.section}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedVehicle}
            onValueChange={(itemValue) => setSelectedVehicle(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label={t('statistics.allVehicles')} value="" />
            {vehicles.map((vehicle) => (
              <Picker.Item key={vehicle.id} label={`${vehicle.brand_name} ${vehicle.model} / ${vehicle.plate_number}`} value={vehicle.id} />
            ))}
          </Picker>
          <Picker
            selectedValue={selectedConductor}
            onValueChange={(itemValue) => setSelectedConductor(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label={t('statistics.allConductors')} value="" />
            {conductors.map((conductor) => (
              <Picker.Item key={conductor} label={conductor} value={conductor} />
            ))}
          </Picker>
        </View>
        <View style={styles.dateRangeContainer }>
          {renderDatePicker(startDate, handleStartDateChange, showStartPicker, setShowStartPicker, t('statistics.startDate'))}
          {renderDatePicker(endDate, handleEndDateChange, showEndPicker, setShowEndPicker, t('statistics.endDate'))}
        </View>
        </View>

        {statistics && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('statistics.serviceOrders')}</Text>
              <View style={styles.statsCardContainer}>
                <View style={styles.statsCard}>
                  <Text style={styles.statsCardTitle}>{t('statistics.totalOrders')}</Text>
                  <Text style={styles.statsCardValue}>{statistics.service_orders.total_count}</Text>
                </View>
                {statistics.service_orders.status_breakdown.map((status) => (
                  <View key={status.status} style={styles.statsCard}>
                    <Text style={styles.statsCardTitle}>{t(`statistics.${status.status}`)}</Text>
                    <Text style={styles.statsCardValue}>{status.count}</Text>
                  </View>
                ))}
              </View>
            </View>

           <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('statistics.financialMetrics')}</Text>
              <View style={styles.statsCardContainer}>
                <View style={styles.statsCard}>
                  <Text style={styles.statsCardTitle}>{t('statistics.totalRevenue')}</Text>
                  <Text style={styles.statsCardValueMoney}>{parseFloat(statistics.financial.total_service_revenue).toFixed(2)} MAD</Text>
                </View>
                <View style={styles.statsCard}>
                  <Text style={styles.statsCardTitle}>{t('statistics.averageServicePrice')}</Text>
                  <Text style={styles.statsCardValueMoney}>{parseFloat(statistics.financial.average_service_price).toFixed(2)} MAD</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('statistics.serviceHistory')}</Text>
              {serviceHistory.map((item) => renderServiceHistoryItem(item))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingBottom:80
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  content: {
    padding: 20,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  picker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    marginBottom: 10,
    elevation:5
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  datePickerContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  datePickerLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  datePickerButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
    elevation:5
  },
  datePickerButtonText: {
    color: '#028dd0',
    fontSize: 16,
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statsCardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    width: '48%',
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  statsCardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statsCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#028dd0',
  },
  statsCardValueMoney: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#028dd0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#028dd0',
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  serviceHistoryItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  serviceHistoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  serviceHistoryDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  serviceHistoryStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  downloadButton: {
    backgroundColor:"#FFFFFF",
    borderRadius:10,
    padding: 10,
  },
});

export default StatisticsScreen;

