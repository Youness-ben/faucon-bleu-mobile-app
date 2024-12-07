import React, { useState, useEffect, useRef } from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

interface RecordingModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSendAudio: (audioUri: string) => Promise<boolean>;
}

const RecordingModal: React.FC<RecordingModalProps> = ({ isVisible, onClose }) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'success' | 'error' | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const { t } = useTranslation();
  const waveAnimation = useSharedValue(0);
  const buttonScale = useSharedValue(1);

const handleSendAudio = async (audioUri: string) => {
  console.log('Audio recorded:', audioUri);
  // Simulate sending process
  await new Promise(resolve => setTimeout(resolve, 5000));
  // Simulate success or error randomly
  const isSuccess = Math.random() > 0.5;
  return isSuccess;
};

  useEffect(() => {
    if (isRecording) {
      waveAnimation.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.linear }),
        -1,
        true
      );
    } else {
      waveAnimation.value = 0;
    }
  }, [isRecording]);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + waveAnimation.value * 0.2 }],
    opacity: 1 - waveAnimation.value * 0.5,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

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

    if (uri) {
      setAudioUri(uri);
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

  const handleSend = async () => {
    if (audioUri) {
      setIsSending(true);
      setSendStatus(null);
      try {
        const result = await handleSendAudio(audioUri);
        setSendStatus(result ? 'success' : 'error');
      } catch (error) {
        console.error('Error sending audio:', error);
        setSendStatus('error');
      } finally {
        console.log('here');
        setIsSending(false);
      }
    }
  };

  const handleCancel = () => {
    setAudioUri(null);
    setSendStatus(null);
    onClose();
  };

  const handlePressIn = () => {
    buttonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    startRecording();
  };

  const handlePressOut = () => {
    buttonScale.value = withSequence(
      withTiming(1.1, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    stopRecording();
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['#028dd0', '#01579B']}
          style={styles.modalContent}
        >
          <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('recordingModal.title')}</Text>
          <View style={styles.recordingContainer}>
            <Animated.View style={!audioUri ? [styles.waveAnimation, waveStyle] : []} />
            {!audioUri ? (
              <Animated.View style={buttonStyle}>
                <TouchableOpacity
                  style={styles.recordButton}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                >
                  <Ionicons
                    name={isRecording ? "mic" : "mic-outline"}
                    size={36}
                    color="#028dd0"
                  />
                </TouchableOpacity>
              </Animated.View>
            ) : isSending ? (
              <>
                  <LottieView
                source={require('../../assets/waves.json')}
                autoPlay
                loop
                speed={2}
                style={{height:60,width:200}}
              />
              </>
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
                  onPress={handleSend}
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
                ? t('recordingModal.recording')
                : t('recordingModal.pressRecord')}
            </Text>
          </View>
        </LinearGradient>
      </View>
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: 'white',
    fontFamily: 'Roboto',
  },
  recordingContainer: {
    alignItems: 'center',
  },
  waveAnimation: {
    position: 'absolute',
    bottom:40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  sendButton: {
    backgroundColor: '#34C759',
  },
  instructions: {
    marginTop: 40,
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  lottieAnimation: {
    width: 300,
    height: 250,
  },
});

export default RecordingModal;

