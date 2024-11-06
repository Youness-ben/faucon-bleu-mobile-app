import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

interface AudioPlayerProps {
  uri: string;
  messageId: string;
}

export default function AudioPlayer({ uri, messageId }: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const loadSound = async () => {
    const { sound } = await Audio.Sound.createAsync({ uri });
    setSound(sound);

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded) {
        setPosition(status.positionMillis);
        setDuration(status.durationMillis || 0);
        setIsPlaying(status.isPlaying);
      }
    });
  };

  useEffect(() => {
    loadSound();
  }, [uri]);

  const playPauseSound = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    }
  };

  const seekSound = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value);
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.audioMessage}>
      <TouchableOpacity onPress={playPauseSound}>
        <Ionicons 
          name={isPlaying ? "pause" : "play"} 
          size={20} 
          color={theme.colors.primary} 
        />
      </TouchableOpacity>
      <Slider
        style={styles.audioSlider}
        minimumValue={0}
        maximumValue={duration}
        value={position}
        onSlidingComplete={seekSound}
        minimumTrackTintColor={theme.colors.primary}
        maximumTrackTintColor={theme.colors.border}
      />
      <Text style={styles.timestamp}>
        {formatTime(position)} / {formatTime(duration)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  audioMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.roundness,
  },
  audioSlider: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  timestamp: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.muted,
  },
});