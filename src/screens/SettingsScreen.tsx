import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../styles/theme';

const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
        <View style={styles.option}>
          <Text style={styles.optionText}>{t('settings.darkMode')}</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: theme.colors.textSecondary, true: theme.colors.primary }}
            thumbColor={darkMode ? theme.colors.background : theme.colors.textSecondary}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
        <View style={styles.option}>
          <Text style={styles.optionText}>{t('settings.pushNotifications')}</Text>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            trackColor={{ false: theme.colors.textSecondary, true: theme.colors.primary }}
            
            thumbColor={pushNotifications ? theme.colors.background : theme.colors.textSecondary}
          />
        </View>
        <View style={styles.option}>
          <Text style={styles.optionText}>{t('settings.emailNotifications')}</Text>
          <Switch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            trackColor={{ false: theme.colors.textSecondary, true: theme.colors.primary }}
            thumbColor={emailNotifications ? theme.colors.background : theme.colors.textSecondary}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
        <View style={styles.option}>
          <Text style={styles.optionText}>{t('settings.version')}</Text>
          <Text style={styles.optionValue}>1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  section: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  optionText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  optionValue: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },
});

export default SettingsScreen;