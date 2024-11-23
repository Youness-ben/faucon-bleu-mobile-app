import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, StatusBar, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
}

const dummyInvoices: Invoice[] = [
  { id: '1', date: '2023-05-15', amount: 150.00, status: 'paid' },
  { id: '2', date: '2023-05-20', amount: 75.50, status: 'pending' },
  { id: '3', date: '2023-05-25', amount: 200.00, status: 'overdue' },
  { id: '4', date: '2023-06-01', amount: 100.00, status: 'paid' },
  { id: '5', date: '2023-06-05', amount: 180.00, status: 'pending' },
];

const InvoicesScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredInvoices, setFilteredInvoices] = useState(dummyInvoices);

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'overdue':
        return theme.colors.error;
      default:
        return theme.colors.text;
    }
  };

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    const filtered = dummyInvoices.filter(
      (invoice) =>
        invoice.date.includes(text) ||
        invoice.amount.toString().includes(text) ||
        t(`invoices.status.${invoice.status}`).toLowerCase().includes(text.toLowerCase())
    );
    setFilteredInvoices(filtered);
  }, [t]);

  const renderInvoiceItem = ({ item }: { item: Invoice }) => (
    <View style={styles.invoiceItem}>
      <View style={styles.invoiceInfo}>
        <Text style={styles.invoiceDate}>{item.date}</Text>
        <Text style={styles.invoiceAmount}>${item.amount.toFixed(2)}</Text>
      </View>
      <View style={styles.invoiceActions}>
        <Text style={[styles.invoiceStatus, { color: getStatusColor(item.status) }]}>
          {t(`invoices.status.${item.status}`)}
        </Text>
        <TouchableOpacity
          onPress={() => console.log(`Download invoice ${item.id}`)}
          style={styles.downloadButton}
        >
          <Ionicons name="download-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#028dd0" />
      <LinearGradient colors={['#028dd0', '#01579B']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('invoices.title')}</Text>
      </LinearGradient>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={24} color={theme.colors.primary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('invoices.searchPlaceholder')}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#A0A0A0"
        />
      </View>
      <FlatList
        data={filteredInvoices}
        renderItem={renderInvoiceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
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
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
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
    fontFamily: 'Poppins-Regular',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceDate: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 5,
    fontFamily: 'Poppins-Regular',
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    fontFamily: 'Poppins-Bold',
  },
  invoiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invoiceStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 15,
    fontFamily: 'Poppins-SemiBold',
  },
  downloadButton: {
    padding: 5,
  },
});

export default InvoicesScreen;

