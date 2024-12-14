import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Text, Dimensions, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import api from '../api';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

export default function UserTypeScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  const handleAccountInquiry = async () => {
    if (!companyName || !fullName || !contactInfo) {
      Toast.show({
        type: 'error',
        text1: t('auth.error'),
        text2: t('auth.allFieldsRequired'),
      });
      return;
    }

    try {
      await api.post('/account-inquiry', { company_name : companyName, full_name : fullName, phone :contactInfo });

      setShowModal(false);
                  navigation.navigate("AccountCreationConfirmation");
    } catch (error) {
      console.error('Error sending inquiry:', error);
      Toast.show({
        type: 'error',
        text1: t('auth.error'),
        text2: t('auth.inquiryFailed'),
      });
    }
  };

  return (
    <LinearGradient colors={['#ffffff', '#f5f5f5']} style={styles.container}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <LinearGradient
            colors={['#028dd0', '#01579B']}
            style={styles.buttonGradient}
          >
            <View style={styles.buttonContent}>
              <Image
                source={require('../../assets/2.png')}
                style={styles.buttonIcon}
                resizeMode="contain"
              />
              <Text style={styles.buttonText}>{t('auth.clientLogin')}</Text>
              <View style={styles.arrowContainer}>
                <Ionicons name="arrow-forward" size={24} color="white" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('ConductorLogin')}
        >
          <LinearGradient
            colors={['#028dd0', '#01579B']}
            style={styles.buttonGradient}
          >
            <View style={styles.buttonContent}>
              <Image
                source={require('../../assets/3.png')}
                style={styles.buttonIcon}
                resizeMode="contain"
              />
              <Text style={styles.buttonText}>{t('auth.conductorLogin')}</Text>
              <View style={styles.arrowContainer}>
                <Ionicons name="arrow-forward" size={24} color="white" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createAccountButton}
           onPress={() => setShowModal(true)}
          >
          <Text style={styles.createAccountButtonText}>{t('auth.createAccount')}</Text>
        </TouchableOpacity>


      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('auth.accountInquiry')}</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder={t('auth.companyName')}
              value={companyName}
              onChangeText={setCompanyName}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder={t('auth.fullName')}
              value={fullName}
              onChangeText={setFullName}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder={t('auth.contactInfo')}
              value={contactInfo}
              onChangeText={setContactInfo}
            />
            
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={handleAccountInquiry}
            >
              <Text style={styles.modalButtonText}>{t('auth.sendInquiry')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </View>
    </LinearGradient>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
    marginBottom: 40,
  },
  buttonsContainer: {
    width: '100%',
    gap: 20,
  },
  button: {
    width: '100%',
    height: 100,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonGradient: {
    flex: 1,
    padding: 15,
  },
  buttonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonIcon: {
    width: 100,
    height: 100,
    marginRight: 10,
  },
  buttonText: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  arrowContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createAccountButton: {
    width: '100%',
    height: 50,
    borderRadius: 15,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#028dd0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createAccountButtonText: {
    color: '#028dd0',
    fontSize: 18,
    fontWeight: 'bold',
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: width * 0.05,
    width: width * 0.9,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: width * 0.06,
    fontWeight: '700',
    color: '#028dd0',
    marginBottom: height * 0.02,
  },
  modalInput: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: width * 0.03,
    fontSize: width * 0.04,
    marginBottom: height * 0.02,
  },
  modalButton: {
    backgroundColor: '#028dd0',
    borderRadius: 10,
    padding: height * 0.02,
    alignItems: 'center',
    width: '100%',
    marginTop: height * 0.02,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
    fontWeight: '600',
  },
  modalCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#028dd0',
  },
  modalCancelButtonText: {
    color: '#028dd0',
  },
});

