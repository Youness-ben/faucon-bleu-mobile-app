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
  Easing,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface RecordingModalProps {
  isVisible: boolean;
  onClose: () => void;

}

const RecordingModal: React.FC<RecordingModalProps> = ({ isVisible, onClose }) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'success' | 'error' | null>(null);
  const [textPrompt, setTextPrompt] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

const onSendAudio = async (audioUri: string) => {
  console.log('Audio recorded:', audioUri);
  // Simulate sending process
  await new Promise(resolve => setTimeout(resolve, 5000));
  // Simulate success or error randomly
  const isSuccess = Math.random() > 0.5;
  return isSuccess;
};
const onSendText = async (prompt: string) => {
  console.log('Text sent:', prompt);
  // Simulate sending process
  await new Promise(resolve => setTimeout(resolve, 5000));
  // Simulate success or error randomly
  const isSuccess = Math.random() > 0.5;
  return isSuccess;
};

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setRecordingDuration(0);
    }
  }, [isRecording]);

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
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

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      fadeIn();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    fadeOut();

    if (uri) {
      setAudioUri(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const playRecording = async () => {
    if (audioUri) {
      try {
        const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
        soundRef.current = sound;
        setIsPlaying(true);
        await sound.playAsync();
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  const stopPlayback = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      setIsPlaying(false);
    }
  };

  const handleSendAudio = async () => {
    if (audioUri) {
      setIsSending(true);
      setSendStatus(null);
      try {
        const result = await onSendAudio(audioUri);
        setSendStatus(result ? 'success' : 'error');
        Haptics.notificationAsync(
          result ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
        );
      } catch (error) {
        console.error('Error sending audio:', error);
        setSendStatus('error');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleSendText = async () => {
        if (textPrompt.trim()) {
      setIsSending(true);
      setSendStatus(null);
      try {
        const result = await onSendText(textPrompt);
        setSendStatus(result ? 'success' : 'error');
        Haptics.notificationAsync(
          result ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
        );
      } catch (error) {
        console.error('Error sending audio:', error);
        setSendStatus('error');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setIsSending(false);
      }
    }
 
  };

  const handleCancel = () => {
    setAudioUri(null);
    setTextPrompt('');
    setSendStatus(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }; 

  const handleClose = () => {
    handleCancel();
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <LinearGradient
          colors={['#028dd0', '#01579B']}
          style={styles.modalContent}
        >
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('recordingModal.title')}</Text>
          
          <View style={styles.promptContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={t('recordingModal.textPrompt')}
              placeholderTextColor="#A0A0A0"
              value={textPrompt}
              onChangeText={setTextPrompt}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !textPrompt.trim() && styles.sendButtonDisabled]}
              onPress={handleSendText}
              disabled={!textPrompt.trim() || isSending}
            >
              <Ionicons name="send" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.recordingContainer}>
            <Animated.View style={[styles.waveAnimation, { opacity: fadeAnim }]} />
            {!audioUri ? (
              <Animated.View style={[styles.recordButtonContainer, { transform: [{ scale: scaleAnim }] }]}>
                <TouchableOpacity
                  style={styles.recordButton}
                  onPressIn={() => {
                    animateButton();
                    startRecording();
                  }}
                  onPressOut={stopRecording}
                >
                  <Ionicons
                    name={isRecording ? "mic" : "mic-outline"}
                    size={36}
                    color="#028dd0"
                  />
                </TouchableOpacity>
              </Animated.View>
            ) : isSending ? (
              <LottieView
                source={require('../../assets/waves.json')}
                autoPlay
                loop
                speed={2}
                style={styles.lottieAnimation}
              />
            ) : sendStatus === 'success' ? (
              <LottieView
                source={require('../../assets/success.json')}
                autoPlay
                loop={false}
                style={styles.lottieAnimation}
              />
            ) : sendStatus === 'error' ? (
              <LottieView
                source={require('../../assets/error.json')}
                autoPlay
                loop={true}
                style={styles.lottieAnimation}
              />
            ) : (
              <View style={styles.controlsContainer}>
                <TouchableOpacity
                  style={[styles.controlButton, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Ionicons name="trash-outline" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlButton, styles.playButton]}
                  onPress={isPlaying ? stopPlayback : playRecording}
                >
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={32}
                    color="white"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlButton, styles.sendButton]}
                  onPress={handleSendAudio}
                >
                  <Ionicons name="send" size={24} color="white" />
                </TouchableOpacity>
              </View>
            )}
            <Text style={styles.instructions}>
              {isSending
                ? t('recordingModal.sending')
                : sendStatus === 'success'
                ? t('recordingModal.sendSuccess')
                : sendStatus === 'error'
                ? t('recordingModal.sendError')
                : audioUri
                ? t('recordingModal.playback')
                : isRecording
                ? `${t('recordingModal.recording')} (${recordingDuration}s)`
                : t('recordingModal.pressRecord')}
            </Text>
          </View>
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
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white',
    fontFamily: 'Roboto-Bold',
  },
  promptContainer: {
    width: '100%',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
  
    color: 'black',
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#34C759',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical:'auto',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(52, 199, 89, 0.5)',
  },
  recordingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  waveAnimation: {
    position: 'absolute',
    width: 150,
    height: 150,
    top:5,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  recordButtonContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  playButton: {
    backgroundColor: '#dec443',
  },
  instructions: {
    marginTop: 20,
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Roboto-Regular',
  },
  lottieAnimation: {
    width: 150,
    height: 150,
  },
});

export default RecordingModal;
