import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

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
    <View style={styles.container}>
      <Text style={styles.title}>{t('invoices.title')}</Text>
      <FlatList
        data={dummyInvoices}
        renderItem={renderInvoiceItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.elevation.small,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceDate: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  invoiceAmount: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
  },
  invoiceActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invoiceStatus: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    marginRight: theme.spacing.md,
  },
  downloadButton: {
    padding: theme.spacing.sm,
  },
});

export default InvoicesScreen;