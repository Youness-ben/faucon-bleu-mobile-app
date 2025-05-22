import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { theme } from '../styles/theme';
import api from '../api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { Dropdown } from 'react-native-element-dropdown';

type RootStackParamList = {
  Fleet: undefined;
  VehicleDetail: { vehicleId: number };
};

type AddVehicleScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Fleet'>;

interface Brand {
  id: number;
  name: string;
}

interface Model {
  id: number;
  modele: string;
  annees: string[];
}

interface Client {
  id: number;
  first_name: string;
  last_name: string;
}

const AddVehicleScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AddVehicleScreenNavigationProp>();
  const [brandId, setBrandId] = useState<number | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [plateNumber, setPlateNumber] = useState('');
  const [vin_number, setVin] = useState('');
  const [kilometers, setMileage] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [transmission, setTransmission] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBrands, setIsFetchingBrands] = useState(true);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [conductorPassword, setConductorPassword] = useState('');
  const [conductorName, setConductorName] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
   const fetchBrands = async () => {
      try {
        const response = await api.get('/client/brands');
        setBrands(response.data);
      } catch (error) {
        console.error('Error fetching brands:', error);
        Toast.show({
          type: 'error',
          text1: t('addVehicle.brandsFetchFailed'),
          text2: t('addVehicle.tryAgainLater'),
        });
      } finally {
        setIsFetchingBrands(false);
      }
    };

    const fetchClients = async () => {
      try {
        const response = await api.get<Client[]>('/client/responsable/list');
        setClients(response.data);

      } catch (error) {
        console.error('Error fetching clients:', error);
        Toast.show({
          type: 'error',
          text1: t('addVehicle.clientsFetchFailed'),
          text2: t('addVehicle.tryAgainLater'),
        });
      }
    };

  useEffect(() => {
    fetchBrands();
    fetchClients();
  }, []);

  useEffect(() => {
    const fetchModels = async () => {
      if (brandId) {
        setIsFetchingModels(true);
        try {
          const response = await api.get(`/client/brands/${brandId}/models`);
          const processedModels = response.data.reduce((acc, item) => {
            if (!acc[item.modele]) {
              acc[item.modele] = {
                id: item.id,
                modele: item.modele,
                annees: []
              };
            }
            if (!acc[item.modele].annees.includes(item.annee)) {
              acc[item.modele].annees.push(item.annee);
            }
            return acc;
          }, {});

          const modelArray = Object.values(processedModels);
          setModels(modelArray);
        } catch (error) {
          console.error('Error fetching models:', error);
          Toast.show({
            type: 'error',
            text1: t('addVehicle.modelsFetchFailed'),
            text2: t('addVehicle.tryAgainLater'),
          });
        } finally {
          setIsFetchingModels(false);
        }
      } else {
        setModels([]);
      }
    };

    fetchModels();
  }, [brandId, t]);

  const handleSubmit = async () => {
    if (!brandId || !selectedModel || !selectedYear || !plateNumber || !vin_number || !kilometers || !fuelType || !transmission || !conductorPassword || !conductorName) {
      Toast.show({
        type: 'error',
        text1: t('addVehicle.fillAllFields'),
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/client/vehicles', {
        brand_id: brandId,
        model: selectedModel.modele,
        year: selectedYear,
        plate_number: plateNumber,
        vin_number,
        kilometers: parseInt(kilometers),
        fuel_type: fuelType,
        transmission,
        conductor_password: conductorPassword,
        conductor_name: conductorName,
        client_id: selectedClientId || null,
      });

      if (response.status === 201) {
        Toast.show({
          type: 'success',
          text1: t('addVehicle.vehicleAdded'),
        });
        navigation.navigate('VehicleDetail', { vehicleId: response.data.id });
      } else {
        throw new Error('Unexpected response status');
      }
    } catch (error) {
      console.error('Error adding vehicle:', error.response?.data || error.message);
      Toast.show({
        type: 'error',
        text1: t('addVehicle.addFailed'),
        text2: t('addVehicle.tryAgainLater'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  if (isFetchingBrands) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#028dd0" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#028dd0" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <LinearGradient colors={['#028dd0', '#01579B']} style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('addVehicle.title')}</Text>
        </LinearGradient>
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('addVehicle.vehicleInfo')}</Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('addVehicle.brand')}</Text>
              <View style={styles.pickerContainer}>
                <Dropdown
                  data={brands.map(brand => ({label: brand.name, value: brand.id}))}
                  labelField="label"
                  valueField="value"
                  placeholder={t('addVehicle.selectBrand')}
                  value={brandId}
                  onChange={(item) => {
                    setBrandId(item.value);
                    setSelectedModel(null);
                    setSelectedYear(null);
                  }}
                  style={styles.picker}
                >


                </Dropdown>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('addVehicle.modelAndYear')}</Text>
              <View style={styles.rowContainer}>
                <View style={[styles.pickerContainer, styles.halfWidth]}>
                  <Picker
                    selectedValue={selectedModel?.id}
                    onValueChange={(itemValue) => {
                      const model = models.find(m => m.id === itemValue) || null;
                      setSelectedModel(model);
                      setSelectedYear(null);
                    }}
                    style={styles.picker}
                    enabled={!isFetchingModels}
                  >
                    <Picker.Item label={t('addVehicle.selectModel')} value={null} />
                    {models.map((model) => (
                      <Picker.Item key={model.id} label={model.modele} value={model.id} />
                    ))}
                  </Picker>
                </View>
                <View style={[styles.pickerContainer, styles.halfWidth]}>
                  <Picker
                    selectedValue={selectedYear}
                    onValueChange={(itemValue) => setSelectedYear(itemValue)}
                    style={styles.picker}
                    enabled={!!selectedModel}
                  >
                    <Picker.Item label={t('addVehicle.selectYear')} value={null} />
                    {selectedModel?.annees.map((year) => (
                      <Picker.Item key={year} label={year} value={year} />
                    ))}
                  </Picker>
                </View>
              </View>
              {isFetchingModels && <ActivityIndicator style={styles.loader} size="small" color="#028dd0" />}
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
                  <Text style={styles.label}>{t('addVehicle.fuelTypeAndTransmission')}</Text>
              <View style={styles.rowContainer}>
                <View style={[styles.pickerContainer, styles.halfWidth]}>
                    <Picker
                      selectedValue={fuelType}
                      onValueChange={(itemValue) => setFuelType(itemValue)}
                      style={styles.picker}
                    >
                      <Picker.Item label={t('addVehicle.fuelType')} value="" />
                      <Picker.Item label={t('addVehicle.gasoline')} value="gasoline" />
                      <Picker.Item label={t('addVehicle.diesel')} value="diesel" />
                      <Picker.Item label={t('addVehicle.electric')} value="electric" />
                      <Picker.Item label={t('addVehicle.hybrid')} value="hybrid" />
                    </Picker>
                  </View>

                <View style={[styles.pickerContainer, styles.halfWidth]}>
                    <Picker
                      selectedValue={transmission}
                      onValueChange={(itemValue) => setTransmission(itemValue)}
                      style={styles.picker}
                    >
                      <Picker.Item label={t('addVehicle.transmission')} value="" />
                      <Picker.Item label={t('addVehicle.manual')} value="manual" />
                      <Picker.Item label={t('addVehicle.automatic')} value="automatic" />
                    </Picker>
                  </View>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('addVehicle.conductorInfo')}</Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('addVehicle.conductorName')}</Text>
              <TextInput
                style={styles.input}
                value={conductorName}
                onChangeText={setConductorName}
                placeholder={t('addVehicle.enterConductorName')}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>{t('addVehicle.responsable')}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedClientId}
                  onValueChange={(itemValue) => setSelectedClientId(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label={t('addVehicle.selectResposanble')} value={null} />
                  {clients.map((client) => (
                    <Picker.Item key={client.id} label={`${client.first_name} ${client.last_name}`} value={client.id} />
                  ))}
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
          </View>
        </ScrollView>
        <View style={styles.buttonContainer}>
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingView: {
    flex: 1,
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
  },
  content: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#028dd0',
    marginBottom: 15,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  loader: {
    marginTop: 10,
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#028dd0',
    padding: 15,
    borderRadius: 10,
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

