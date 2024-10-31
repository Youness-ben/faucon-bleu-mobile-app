import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { theme } from '../styles/theme';
import api from '../api';

type RootStackParamList = {
  Fleet: undefined;
};

type AddVehicleScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Fleet'>;

interface Brand {
  id: number;
  name: string;
}

const AddVehicleScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AddVehicleScreenNavigationProp>();
  const [brandId, setBrandId] = useState<number | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [model, setModel] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [year, setYear] = useState('');
  const [vin_number, setVin] = useState('');
  const [kilometers, setMileage] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [transmission, setTransmission] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBrands, setIsFetchingBrands] = useState(true);
  const [conductorPassword, setConductorPassword] = useState('');

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await api.get('/client/brands');
        setBrands(response.data);
      } catch (error) {
        console.error('Error fetching brands:', error);
        Alert.alert(t('addVehicle.error'), t('addVehicle.brandsFetchFailed'));
      } finally {
        setIsFetchingBrands(false);
      }
    };

    fetchBrands();
  }, [t]);

  const handleSubmit = async () => {
    if (!brandId || !model || !plateNumber || !year || !vin_number || !kilometers || !fuelType || !transmission || !conductorPassword) {
      Alert.alert(
        t('addVehicle.error'),
        t('addVehicle.fillAllFields'),
        [{ text: t('common.ok'), style: 'default' }],
        { cancelable: false }
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/client/vehicles', {
        brand_id: brandId,
        model,
        plate_number: plateNumber,
        year: parseInt(year),
        vin_number,
        kilometers: parseInt(kilometers),
        fuel_type: fuelType,
        transmission,
        conductor_password: conductorPassword,
      });

      if (response.status === 201) {
        Alert.alert(
          t('addVehicle.success'),
          t('addVehicle.vehicleAdded'),
          [{ text: t('common.ok'), onPress: () => navigation.navigate('Fleet') }],
          { cancelable: false }
        );
      } else {
        throw new Error('Unexpected response status');
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      Alert.alert(t('addVehicle.error'), t('addVehicle.addFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingBrands) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t('addVehicle.title')}</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('addVehicle.brand')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={brandId}
            onValueChange={(itemValue) => setBrandId(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label={t('addVehicle.selectBrand')} value={null} />
            {brands.map((brand) => (
              <Picker.Item key={brand.id} label={brand.name} value={brand.id} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('addVehicle.model')}</Text>
        <TextInput
          style={styles.input}
          value={model}
          onChangeText={setModel}
          placeholder={t('addVehicle.enterModel')}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('addVehicle.plateNumber')}</Text>
        <TextInput
          style={styles.input}
          value={plateNumber}
          onChangeText={setPlateNumber}
          placeholder={t('addVehicle.enterPlateNumber')}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('addVehicle.year')}</Text>
        <TextInput
          style={styles.input}
          value={year}
          onChangeText={setYear}
          placeholder={t('addVehicle.enterYear')}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('addVehicle.vin')}</Text>
        <TextInput
          style={styles.input}
          value={vin_number}
          onChangeText={setVin}
          placeholder={t('addVehicle.enterVin')}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('addVehicle.mileage')}</Text>
        <TextInput
          style={styles.input}
          value={kilometers}
          onChangeText={setMileage}
          placeholder={t('addVehicle.enterMileage')}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('addVehicle.fuelType')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={fuelType}
            onValueChange={(itemValue) => setFuelType(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label={t('addVehicle.selectFuelType')} value="" />
            <Picker.Item label={t('addVehicle.gasoline')} value="gasoline" />
            <Picker.Item label={t('addVehicle.diesel')} value="diesel" />
            <Picker.Item label={t('addVehicle.electric')} value="electric" />
            <Picker.Item label={t('addVehicle.hybrid')} value="hybrid" />
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('addVehicle.transmission')}</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={transmission}
            onValueChange={(itemValue) => setTransmission(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label={t('addVehicle.selectTransmission')} value="" />
            <Picker.Item label={t('addVehicle.manual')} value="manual" />
            <Picker.Item label={t('addVehicle.automatic')} value="automatic" />
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>{t('addVehicle.conductorPassword')}</Text>
        <TextInput
          style={styles.input}
          value={conductorPassword}
          onChangeText={setConductorPassword}
          placeholder={t('addVehicle.enterConductorPassword')}
          secureTextEntry
        />
      </View>

      <TouchableOpacity 
        style={[styles.submitButton, isLoading && styles.disabledButton]} 
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitButtonText}>{t('addVehicle.addVehicle')}</Text>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddVehicleScreen;