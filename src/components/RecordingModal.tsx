import React, { useState, useEffect, useRef } from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

interface RecordingModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSendAudio: (audioUri: string) => void;
}

const RecordingModal: React.FC<RecordingModalProps> = ({ isVisible, onClose, onSendAudio }) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const {t} = useTranslation();
  const waveAnimation = useSharedValue(0);

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

  const waveStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: 1 + waveAnimation.value * 0.2 }],
      opacity: 1 - waveAnimation.value * 0.5,
    };
  });

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

  const handleSend = () => {
    if (audioUri) {
      onSendAudio(audioUri);
      onClose();
    }
  };

  const handleCancel = () => {
    setAudioUri(null);
    onClose();
  };

  const handlePressIn = () => {
    startRecording();
  };

  const handlePressOut = () => {
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
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
            <Ionicons name="close" size={24} color="#028dd0" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('recordingModal.title')}</Text>
          <View style={styles.recordingContainer}>
            <Animated.View style={!audioUri ? [styles.waveAnimation, waveStyle] : [] } />
            {!audioUri ? (
              <TouchableOpacity
                style={styles.recordButton}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              >
                <Ionicons
                  name={isRecording ? "mic" : "mic-outline"}
                  size={36}
                  color="white"
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.controlsContainer}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={isPlaying ? stopPlayback : playRecording}
                >
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlButton, styles.sendButton]}
                  onPress={handleSend}
                >
                  <Ionicons name="send" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlButton, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            )}
            <Text style={styles.instructions}>
              {audioUri
                ? t('recordingModal.playback')
                : isRecording
                ? t('recordingModal.recording')
                : t('recordingModal.pressRecord')}
            </Text>
          </View>
        </View>
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
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: width * 0.8,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#028dd0',
  },
  recordingContainer: {
    alignItems: 'center',
  },
  waveAnimation: {
    position: 'absolute',
    top:-20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(2, 141, 208, 0.2)',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#028dd0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#028dd0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  sendButton: {
    backgroundColor: '#4CD964',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  instructions: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default RecordingModal;

