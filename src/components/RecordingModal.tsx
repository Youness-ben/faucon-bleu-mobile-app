import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import Toast from 'react-native-toast-message';
import api from '../api';
import * as FileSystem from 'expo-file-system';
const { width, height } = Dimensions.get('window');

interface RecordingModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const RecordingModal: React.FC<RecordingModalProps> = ({ isVisible, onClose }) => {
  const { t } = useTranslation();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [textPrompt, setTextPrompt] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  const navigation = useNavigation();
  useEffect(() => {
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, []);


  const handleClose = async () => {

      setAudioUri(null);
      handleClearText();
      setRecordingDuration(0);
      if (isPlaying) {
            await soundRef.current?.stopAsync();
            setIsPlaying(false);
          }
      setIsRecording(false); 
    
    onClose();

  };

 const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.metering) {
            // Normalize the metering level to a value between 0 and 1
            const normalizedMeteringLevel = Math.min(Math.max((status.metering + 160) / 160, 0), 1);
            // Animate the view based on the metering level
            Animated.timing(fadeAnim, {
              toValue: normalizedMeteringLevel,
              duration: 100,
              useNativeDriver: true,
            }).start();
          }
        },
        100 // Update every 100ms
      );
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      recordingInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      const uri = recording.getURI();
      setRecording(null);
      fadeOut();

      if (uri) {
        setAudioUri(uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const playRecording = async () => {
    if (audioUri) {
      try {
        if (isPlaying) {
          await soundRef.current?.stopAsync();
          setIsPlaying(false);
        } else {
          const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
          soundRef.current = sound;
          setIsPlaying(true);
          await sound.playAsync();
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
              setIsPlaying(false);
            }
          });
        }
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

 const handleSendAudio = async () => {
    if (audioUri) {
      try {
        setIsLoading(true);
  
        const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
          encoding: FileSystem.EncodingType.Base64,
        });


        const response = await api.post('/vehicle/ai/request', {
          file: `data:audio/m4a;base64,${base64Audio}`,
        });
        if (response.data.status === 'success') {
            const serviceID = response.data.data.service_id;
            const service = response.data.data.service;
           navigation.navigate('TicketScreen', { serviceId: serviceID, service: service });
        } else {

          throw new Error(response.data || 'Failed to process audio');
        }
      } catch (error) {
        console.error('Error sending audio:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to process audio. Please try again.',
        });
      } finally {
        setIsLoading(false);
        setAudioUri(null);
        setRecordingDuration(0);
        setIsRecording(false);
        onClose();
      }
    }
  };
  

 const onSendText = async (textPrompt : string) => {
    if (textPrompt) {
      try {
        setIsLoading(true);

        const response = await api.post('/vehicle/ai/prompt', {
          text: textPrompt,
        });
        if (response.data.status === 'success') {
            const serviceID = response.data.data.service_id;
            const service = response.data.data.service;
           navigation.navigate('TicketScreen', { serviceId: serviceID, service: service });

        } else {

          throw new Error(response.data || 'Failed to process prompt');
        }
      } catch (error) {
        console.error('Error sending prompt:', error.response.data);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to process prompt. Please try again.',
        });
      } finally {
        setIsLoading(false);
        setTextPrompt("");
        onClose();
      }
    }
  };
  


  const handleSendText = async () => {
    if (textPrompt.trim()) {
      await onSendText(textPrompt);
      setTextPrompt('');
    }
  };

  const handleClearText = async () => {
          setTextPrompt('');
  };
  
  const cancelRecording = async () => {
    setAudioUri(null);
    setRecordingDuration(0);
    if (isPlaying) {
          await soundRef.current?.stopAsync();
          setIsPlaying(false);
        }
    setIsRecording(false); 
  };

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <LinearGradient
          colors={['#028dd0', '#01579B']}
          style={styles.modalContent}
        >
          <TouchableOpacity style={styles.closeButton} onPress={handleClose} accessibilityLabel={t('common.close')}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('recordingModal.title')}</Text>

          {!isRecording && !audioUri && (
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  placeholder={t('recordingModal.textPrompt')}
                  placeholderTextColor="#A0A0A0"
                  value={textPrompt}
                  onChangeText={setTextPrompt}
                  multiline
                />
                {textPrompt.trim() ? (
                  <>
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClearText}
                    accessibilityLabel={t('common.clear')}
                  >
                    <Ionicons name="close" size={24} color="#A0A0A0" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSendText}
                    accessibilityLabel={t('common.send')}
                  >
                    <Ionicons name="send" size={24} color="#028dd0" />
                  </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.micButton}
                    onPress={startRecording}
                    accessibilityLabel={t('recordingModal.startRecording')}
                  >
                    <Ionicons name="mic" size={24} color="#028dd0" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {isRecording && (
            <View style={styles.recordingContainer}>
              <Animated.View 
                style={[
                  styles.waveAnimation, 
                  { 
                    opacity: fadeAnim,
                    transform: [{ scale: fadeAnim.interpolate({
                      inputRange: [0, 2],
                      outputRange: [0.1, 2]
                    }) }]
                  }
                ]} 
              />
              <TouchableOpacity onPress={stopRecording} style={styles.stopRecordingButton} accessibilityLabel={t('recordingModal.stopRecording')}>
                <Ionicons name="stop" size={24} color="#FF3B30" />
              </TouchableOpacity>
              <Text style={styles.recordingDuration}>{formatDuration(recordingDuration)}</Text>

            </View>
          )}

          {audioUri && !isRecording && (
            <View style={styles.audioControlsContainer}>
              <TouchableOpacity onPress={playRecording} style={styles.playButton} accessibilityLabel={isPlaying ? t('common.pause') : t('common.play')}>
                <Ionicons name={isPlaying ? "pause" : "play"} size={24} color="#028dd0" />
              </TouchableOpacity>
              <Text style={styles.recordingDuration}>{formatDuration(recordingDuration)}</Text>
              <TouchableOpacity onPress={handleSendAudio} style={styles.sendAudioButton} accessibilityLabel={t('common.send')}>
                <Ionicons name="send" size={24} color="#028dd0" />
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelRecording} style={styles.cancelButton} accessibilityLabel={t('common.cancel')}>
                <Ionicons name="close" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          )}
          {isLoading && ( 
              <View style={styles.loadingContainer}>
              <LottieView source={require('../../assets/waves.json')} loop={true} autoPlay={true} style={{width:((width*0.9)-20),height:100}} />
            </View>
          )}
        </LinearGradient>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.8,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'column',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingRight: 30,
    position: 'relative',
    minHeight: 100,
  },
  textInput: {
    flex: 1,
    color: '#333333',
    fontSize: 16,
    marginHorizontal: 8,
    textAlignVertical:'top',
    paddingTop:8,
    minHeight: 100,
  },
  sendButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    zIndex: 1,
  },  
  clearButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  micButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    zIndex: 1,
  },
  recordingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    width: '100%',
  },
  waveAnimation: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    top:-8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  recordingDuration: {
    fontSize: 14,
    color: 'white',
    marginTop: 2,
  },
  stopRecordingButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendAudioButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
    loadingContainer: { 
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 16,
  },
});

export default RecordingModal;

