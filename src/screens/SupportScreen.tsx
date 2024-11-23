import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../UserContext';
import { FAUCON_ADDRESS, FAUCON_EMAIL, FAUCON_LOCATION, FAUCON_PHONE, FAUCON_WHATSAPP } from '../../config';

const SupportScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const {user} = useUser();
  const contactMethods = [
    { icon: 'call-outline', title: t('support.phone'), value: FAUCON_PHONE, action: () => Linking.openURL('tel:'+FAUCON_PHONE.replace(' ','')) },
    { icon: 'mail-outline', title: t('support.email'), value: FAUCON_EMAIL, action: () => Linking.openURL('mailto:'+FAUCON_EMAIL) },
    { icon: 'logo-whatsapp', title: t('support.whatsapp'), value: FAUCON_WHATSAPP, action: () => Linking.openURL('https://wa.me/'+FAUCON_WHATSAPP.replace(' ','').replace('+','')) },
    { icon: 'location-outline', title: t('support.address'), value:FAUCON_ADDRESS, action: () => Linking.openURL('https://maps.google.com?q=loc:'+FAUCON_LOCATION) },
  ];
  return (
    <>
       <TouchableOpacity onPress={() => navigation.navigate(user?.type=='client' ? 'Profile' : 'ConductorSettings')} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
      </TouchableOpacity>
      
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
              <Ionicons name={method.icon} size={24} color="white" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{method.title}</Text>
              <Text style={styles.contactValue}>{method.value}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
    </>
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
    backgroundColor: theme.colors.primary,
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
  backButton: {
    padding: theme.spacing.lg,
  },
});

export default SupportScreen;