import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Animated, PanResponder, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

interface FloatingAudioButtonProps {
  onSendAudio: (audioUri: string) => void;
}

const FloatingAudioButton: React.FC<FloatingAudioButtonProps> = ({ onSendAudio }) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => !isExpanded,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value
        });
      },
      onPanResponderMove: Animated.event(
        [
          null,
          { dx: pan.x, dy: pan.y }
        ],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      }
    })
  ).current;

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

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
      onSendAudio(uri);
    }
  };

  const handlePress = () => {
    if (!isExpanded) {
      Animated.spring(scale, {
        toValue: 2,
        useNativeDriver: true,
      }).start();
      setIsExpanded(true);
    }
  };

  const handlePressOut = () => {
    if (isExpanded) {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
      setIsExpanded(false);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scale }
          ]
        }
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        onPressIn={handlePress}
        onPressOut={handlePressOut}
        onLongPress={startRecording}
        onPress={stopRecording}
        style={styles.button}
      >
        <Ionicons
          name={isRecording ? "mic" : "mic-outline"}
          size={24}
          color="white"
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#028dd0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default FloatingAudioButton;

