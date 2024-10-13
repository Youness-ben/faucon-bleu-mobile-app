import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { theme } from '../styles/theme';

const AddVehicleScreen: React.FC = () => {
  const { t } = useTranslation();
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [licensePlate, setLicensePlate] = useState('');

  const handleSubmit = () => {
    if (!vehicleName || !vehicleType || !licensePlate) {
      Alert.alert(t('addVehicle.error'), t('addVehicle.fillAllFields'));
      return;
    }

    // Here you would typically send the data to your backend
    console.log('Vehicle added:', { vehicleName, vehicleType, licensePlate });
    Alert.alert(t('addVehicle.success'), t('addVehicle.vehicleAdded'));

    // Reset form
    setVehicleName('');
    setVehicleType('');
    setLicensePlate('');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('addVehicle.title')}</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('addVehicle.vehicleName')}</Text>
        <TextInput
          style={styles.input}
          value={vehicleName}
          onChangeText={setVehicleName}
          placeholder={t('addVehicle.enterVehicleName')}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('addVehicle.vehicleType')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={vehicleType}
            onValueChange={(itemValue) => setVehicleType(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label={t('addVehicle.selectType')} value="" />
            <Picker.Item label={t('addVehicle.car')} value="car" />
            <Picker.Item label={t('addVehicle.truck')} value="truck" />
            <Picker.Item label={t('addVehicle.motorcycle')} value="motorcycle" />
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('addVehicle.licensePlate')}</Text>
        <TextInput
          style={styles.input}
          value={licensePlate}
          onChangeText={setLicensePlate}
          placeholder={t('addVehicle.enterLicensePlate')}
        />
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>{t('addVehicle.addVehicle')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: theme.colors.primary,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    borderRadius: 5,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddVehicleScreen;