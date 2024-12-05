import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../api';

const StatisticsScreen = () => {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setStatistics(response.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(t('statistics.fetchError'));
    } finally {
      setIsLoading(false);
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
          onChange={(event, selectedDate) => {
            setShow(false);
            if (selectedDate) {
              onChange(selectedDate);
            }
          }}
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('statistics.title')}</Text>
        </View>
      </LinearGradient>
      <ScrollView style={styles.content}>
        <View style={styles.dateRangeContainer}>
          {renderDatePicker(startDate, setStartDate, showStartPicker, setShowStartPicker, t('statistics.startDate'))}
          {renderDatePicker(endDate, setEndDate, showEndPicker, setShowEndPicker, t('statistics.endDate'))}
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
            <Text style={styles.statsCardTitle}>{t('statistics.cancelledServices')}</Text>
            <Text style={styles.statsCardValue}>{statistics.cancelledServices}</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{t('statistics.servicesByMonth')}</Text>
          <LineChart
            data={{
              labels: statistics.servicesByMonth.map(item => item.month.toString()),
              datasets: [{ data: statistics.servicesByMonth.map(item => item.count) }]
            }}
            width={styles.chart.width}
            height={220}
            chartConfig={chartConfig}
            bezier
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{t('statistics.revenueByMonth')}</Text>
          <BarChart
            data={{
              labels: statistics.revenueByMonth.map(item => item.month.toString()),
              datasets: [{ data: statistics.revenueByMonth.map(item => item.revenue) }]
            }}
            width={styles.chart.width}
            height={220}
            chartConfig={chartConfig}
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>{t('statistics.popularServices')}</Text>
          <PieChart
            data={statistics.popularServices.map((service, index) => ({
              name: service.name,
              count: service.count,
              color: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 1)`,
              legendFontColor: '#7F7F7F',
              legendFontSize: 12
            }))}
            width={styles.chart.width}
            height={220}
            chartConfig={chartConfig}
            accessor="count"
            backgroundColor="transparent"
            paddingLeft="15"
          />
        </View>

        <View style={styles.statsCardContainer}>
          <View style={styles.statsCard}>
            <Text style={styles.statsCardTitle}>{t('statistics.totalRevenue')}</Text>
            <Text style={styles.statsCardValue}>{statistics.totalRevenue.toLocaleString()} MAD</Text>
          </View>
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
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  chart: {
    width: 300,
    height: 220,
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

