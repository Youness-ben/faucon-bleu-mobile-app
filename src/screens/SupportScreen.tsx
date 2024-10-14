import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

const SupportScreen: React.FC = () => {
  const { t } = useTranslation();

  const contactMethods = [
    { icon: 'call-outline', title: t('support.phone'), value: '+212 5 22 34 56 78', action: () => Linking.openURL('tel:+212522345678') },
    { icon: 'mail-outline', title: t('support.email'), value: 'support@fleetapp.com', action: () => Linking.openURL('mailto:support@fleetapp.com') },
    { icon: 'logo-whatsapp', title: t('support.whatsapp'), value: '+212 6 12 34 56 78', action: () => Linking.openURL('https://wa.me/212612345678') },
    { icon: 'location-outline', title: t('support.address'), value: t('support.officeAddress'), action: () => Linking.openURL('https://maps.google.com/?q=Casablanca+Morocco') },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="help-buoy-outline" size={60} color={theme.colors.primary} />
        <Text style={styles.title}>{t('support.title')}</Text>
        <Text style={styles.subtitle}>{t('support.subtitle')}</Text>
      </View>

      <View style={styles.contactContainer}>
        {contactMethods.map((method, index) => (
          <TouchableOpacity key={index} style={styles.contactItem} onPress={method.action}>
            <View style={styles.iconContainer}>
              <Ionicons name={method.icon} size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{method.title}</Text>
              <Text style={styles.contactValue}>{method.value}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.faqSection}>
        <Text style={styles.faqTitle}>{t('support.faqTitle')}</Text>
        <TouchableOpacity style={styles.faqButton}>
          <Text style={styles.faqButtonText}>{t('support.viewFaq')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  contactContainer: {
    marginTop: theme.spacing.lg,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },
  contactValue: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeights.medium,
  },
  faqSection: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  faqTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  faqButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.roundness,
  },
  faqButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
  },
});

export default SupportScreen;