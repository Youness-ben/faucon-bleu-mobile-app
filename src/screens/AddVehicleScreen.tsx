import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { theme } from '../styles/theme';
import api from '../api';
import Toast from '../components/Toast';

type RootStackParamList = {
  Fleet: undefined;
  VehicleDetail: { vehicleId: number };
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
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' | 'info' }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), 3000);
  };

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await api.get('/client/brands');
        setBrands(response.data);
      } catch (error) {
        console.error('Error fetching brands:', error);
        showToast(t('addVehicle.brandsFetchFailed'), 'error');
      } finally {
        setIsFetchingBrands(false);
      }
    };

    fetchBrands();
  }, [t]);

  const handleSubmit = async () => {
    if (!brandId || !model || !plateNumber || !year || !vin_number || !kilometers || !fuelType || !transmission || !conductorPassword) {
      showToast(t('addVehicle.fillAllFields'), 'error');
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
        showToast(t('addVehicle.vehicleAdded'), 'success');
        navigation.navigate('VehicleDetail', { vehicleId: response.data.id });
      } else {
        throw new Error('Unexpected response status');
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      showToast(t('addVehicle.addFailed'), 'error');
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
    <View style={styles.container}>
      <ScrollView>
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
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    marginBottom: theme.spacing.lg,
    color: theme.colors.primary,
  },
  formGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.sizes.md,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness,
    padding: theme.spacing.sm,
    fontSize: theme.typography.sizes.md,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.roundness,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
  },
});

export default AddVehicleScreen;