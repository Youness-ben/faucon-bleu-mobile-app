import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../api';

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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState(0);

  useEffect(() => {
    fetchStatistics();
  }, [startDate, endDate]);

  const fetchStatistics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/client/statistics', {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        },
      });
      console.log(response.data);
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
      if (selectedDate > endDate) {
        const newEndDate = new Date(selectedDate);
        newEndDate.setDate(newEndDate.getDate() + 1);
        setEndDate(newEndDate);
      }
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) {
      if (selectedDate > startDate) {
        setEndDate(selectedDate);
      } else {
        const newEndDate = new Date(startDate);
        newEndDate.setDate(newEndDate.getDate() + 1);
        setEndDate(newEndDate);
      }
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

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 1));
  };

  const handlePanLeft = () => {
    setPanOffset(prev => Math.max(prev - 1, 0));
  };

  const handlePanRight = () => {
    setPanOffset(prev => Math.min(prev + 1, Math.floor(statistics.servicesOverTime.length * (1 - 1/zoomLevel))));
  };

  const getVisibleData = () => {
    if (!statistics || !statistics.servicesOverTime) return [];
    const visibleDataCount = Math.floor(statistics.servicesOverTime.length / zoomLevel);
    return statistics.servicesOverTime.slice(panOffset, panOffset + visibleDataCount);
  };

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
          { false &&
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>}
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

        <View style={styles.statsCardContainer}>
          <View style={styles.statsCard}>
            <Text style={styles.statsCardTitle}>{t('statistics.totalServices')}</Text>
            <Text style={styles.statsCardValue}>{statistics.totalServices}</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsCardTitle}>{t('statistics.completedServices')}</Text>
            <Text style={styles.statsCardValue}>{statistics.completedServices}</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsCardTitle}>{t('statistics.pendingServices')}</Text>
            <Text style={styles.statsCardValue}>{statistics.pendingServices}</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsCardTitle}>{t('statistics.inProgressServices')}</Text>
            <Text style={styles.statsCardValue}>{statistics.inProgressServices}</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsCardTitle}>{t('statistics.cancelledServices')}</Text>
            <Text style={styles.statsCardValue}>{statistics.cancelledServices}</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsCardTitle}>{t('statistics.averageServiceDuration')}</Text>
            <Text style={styles.statsCardValue}>{statistics.averageServiceDuration} min</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{t('statistics.serviceStatus')}</Text>
          <PieChart
            data={[
              { name: 'Completed', count: statistics.completedServices, color: '#4CAF50' },
              { name: 'Pending', count: statistics.pendingServices, color: '#FFC107' },
              { name: 'Cancelled', count: statistics.cancelledServices, color: '#F44336' },
              { name: 'In Progress', count: statistics.inProgressServices, color: '#2196F3' },
            ]}
            width={SCREEN_WIDTH - 40}
            height={220}
            chartConfig={chartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{t('statistics.servicesByType')}</Text>
          <BarChart
            data={{
              labels: statistics.servicesByType.map(item => item.name),
              datasets: [{ data: statistics.servicesByType.map(item => item.count) }]
            }}
            width={SCREEN_WIDTH - 40}
            height={300}
            chartConfig={{
              ...chartConfig,
              formatYLabel: (label) => label.length > 10 ? label.slice(0, 10) + '...' : label,
            }}
            verticalLabelRotation={0}
            horizontalLabelRotation={0}
            showValuesOnTopOfBars
            fromZero
            withInnerLines={false}
            showBarTops={false}
            horizontal
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{t('statistics.vehiclesByBrand')}</Text>
          <PieChart
            data={statistics.vehiclesByBrand.map((brand, index) => ({
              name: brand.name,
              count: brand.count,
              color: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 1)`,
              legendFontColor: '#7F7F7F',
              legendFontSize: 12
            }))}
            width={SCREEN_WIDTH - 40}
            height={220}
            chartConfig={chartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        </View>


        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{t('statistics.servicesOverTime')}</Text>
          <LineChart
          verticalLabelRotation={90}
            data={{
              labels: getVisibleData().map(item => new Date(item.date).toLocaleDateString()),
              datasets: [{ data: getVisibleData().map(item => item.count) }]
            }}
            width={SCREEN_WIDTH - 40}
            height={300}
            chartConfig={chartConfig}
            bezier
          />
        
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
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
  backButton: {
    marginRight: 15,
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
  statsCardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
    height: 500, // Increased height for the horizontal bar chart
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  chartControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  controlButton: {
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
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

