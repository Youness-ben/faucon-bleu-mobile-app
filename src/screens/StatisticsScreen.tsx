import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../api';
import { VictoryPie, VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryLabel } from 'victory-native';
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

  useEffect(() => {
    fetchStatistics();
  }, [startDate, endDate]);

  const fetchStatistics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/client/company-statistics', {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchStatistics().then(() => setRefreshing(false));
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#028dd0" />
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
        </View>
      </LinearGradient>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#028dd0']} />
        }
      >
        <View style={styles.dateRangeContainer}>
          {renderDatePicker(startDate, handleStartDateChange, showStartPicker, setShowStartPicker, t('statistics.startDate'))}
          {renderDatePicker(endDate, handleEndDateChange, showEndPicker, setShowEndPicker, t('statistics.endDate'))}
        </View>


        {statistics && (
          <>

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
                              <View style={styles.statsCard}>
                <Text style={styles.statsCardTitle}>{t('statistics.totalVehicles')}</Text>
                <Text style={styles.statsCardValue}>{statistics.vehicles.total_vehicles}</Text>
              </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('statistics.mostRequestedServices')}</Text>
              <VictoryChart
                theme={VictoryTheme.material}
                domainPadding={{ y: 20 }}
                width={SCREEN_WIDTH - 40}
                height={200}
                padding={{ top: 10, bottom: 30, left: 90, right: 30 }}
              >
              
                <VictoryAxis
                   tickFormat={(tick) => {
                    if(tick===null || !tick || tick.length<=0 || tick === undefined)
                        return tick;
                    const maxLength = 1; 
                    const words = tick.split(' '); 
                    let lines = [];
                    let currentLine = '';

                    words.forEach((word) => {
                      if ((currentLine + ' ' + word).trim().split(' ').length > maxLength) {
                        lines.push(currentLine.trim());
                        currentLine = word;
                      } else {
                        currentLine += ' ' + word;
                      }
                    });

                    if (currentLine.trim()) {
                      lines.push(currentLine.trim());
                    }

                    return lines.join('\n'); 
                  }}
                  style={{
                    tickLabels: { fontSize: 10, fill: '#666'},
                    axisLabel: { fontSize: 10 },
                  }}
                />
                <VictoryBar
                  horizontal
                  data={statistics.services.most_requested_services.map(service => ({
                    x: service.name,
                    y: service.count,
                  }))}
                  style={{
                    data: { fill: '#028dd0', height: 20,padding:5 },
                  }}
                  labels={({ datum }) => `${datum.y}`}
                  labelComponent={
                    <VictoryLabel 
                      dx={-5} 
                      textAnchor="middle" 
                      style={{ fill: '#fff', fontSize: 12, margin:2 }}
                    />
                  }
                />
              </VictoryChart>
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
});

const chartConfig = {
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientTo: '#FFFFFF',
  color: (opacity = 1) => `rgba(2, 141, 208, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
};

export default StatisticsScreen;

