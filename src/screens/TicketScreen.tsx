import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Animated,
  SafeAreaView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { RouteProp } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import api from '../api';

type RootStackParamList = {
  TicketScreen: { serviceId: string };
};

type TicketScreenRouteProp = RouteProp<RootStackParamList, 'TicketScreen'>;

interface Participant {
  id: string;
  name: string;
  role: 'client' | 'vehicle' | 'agent';
}

interface Message {
  id: string;
  text: string;
  sender: Participant;
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'audio' | 'location';
  content?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  location?: {
    latitude: number;
    longitude: number;
  };
  fileName?: string;
}

const TicketScreen: React.FC<{ route: TicketScreenRouteProp }> = ({ route }) => {
  const { t } = useTranslation();
  const { serviceId  } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll for new messages every 5 seconds

    return () => {
      clearInterval(interval);
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [serviceId]);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/client/service-orders/${serviceId}/chat`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Failed to fetch messages. Please try again.');
    } finally {
      setIsLoading(false);
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const sendMessage = async (newMessage: Message) => {
    setMessages(prevMessages => [...prevMessages, newMessage]);
    try {
      await api.post(`/client/service-orders/${serviceId}/chat`, newMessage);
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== newMessage.id));
    }
  };

  const sendTextMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        sender: { id: 'currentUser', name: 'Current User', role: 'client' }, // Replace with actual user info
        timestamp: new Date(),
        type: 'text',
        status: 'sending',
      };
      sendMessage(newMessage);
      setInputText('');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const formData = new FormData();
        formData.append('image', {
          uri: asset.uri,
          type: 'image/jpeg',
          name: asset.fileName || 'image.jpg',
        });

        const response = await api.post(`/client/service-orders/${serviceId}/chat`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const newMessage: Message = {
          ...response.data,
          sender: { id: 'currentUser', name: 'Current User', role: 'client' }, // Replace with actual user info
          status: 'sent',
        };
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });

      if (result.type === 'success') {
        const formData = new FormData();
        formData.append('file', {
          uri: result.uri,
          type: result.mimeType,
          name: result.name,
        });

        const response = await api.post(`client/service-orders/${serviceId}/chat`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const newMessage: Message = {
          ...response.data,
          sender: { id: 'currentUser', name: 'Current User', role: 'client' }, // Replace with actual user info
          status: 'sent',
        };
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
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
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        const formData = new FormData();
        formData.append('audio', {
          uri: uri,
          type: 'audio/m4a',
          name: 'audio_message.m4a',
        });

        const response = await api.post(`/client/service-orders/${serviceId}/chat`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const newMessage: Message = {
          ...response.data,
          sender: { id: 'currentUser', name: 'Current User', role: 'client' }, // Replace with actual user info
          status: 'sent',
        };
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const sendLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const response = await api.post(`/client/service-orders/${serviceId}/chat`, {
        type: 'location',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const newMessage: Message = {
        ...response.data,
        sender: { id: 'currentUser', name: 'Current User', role: 'client' }, // Replace with actual user info
        status: 'sent',
      };
      setMessages(prevMessages => [...prevMessages, newMessage]);
    } catch (error) {
      console.error('Error sending location:', error);
      Alert.alert('Error', 'Failed to send location. Please try again.');
    }
  };

  const openLocation = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const downloadFile = async (uri: string, fileName: string) => {
    const fileUri = FileSystem.documentDirectory + fileName;
    try {
      const { uri: downloadedUri } = await FileSystem.downloadAsync(uri, fileUri);
      Alert.alert('Success', `File downloaded to ${downloadedUri}`);
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', 'Failed to download file. Please try again.');
    }
  };

  const playAudio = async (uri: string, messageId: string) => {
    try {
      setIsAudioLoading(messageId);
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setIsAudioLoading(null);
          }
        }
      );
      setSound(newSound);
      setIsPlaying(true);
      setCurrentlyPlayingId(messageId);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          setCurrentlyPlayingId(null);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio. Please try again.');
      setIsAudioLoading(null);
    }
  };

  const pauseAudio = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <Animated.View style={[
      styles.messageContainer,
      item.sender.role === 'client' ? styles.currentUserMessage : styles.otherUserMessage,
      { opacity: fadeAnim }
    ]}>
      <Text style={styles.senderName}>{item.sender.name} ({item.sender.role})</Text>
      {item.type === 'text' && <Text style={styles.messageText}>{item.text}</Text>}
      {item.type === 'image' && (
        <TouchableOpacity onPress={() => item.content && downloadFile(item.content, item.fileName || 'image.jpg')}>
          <Image source={{ uri: item.content }} style={styles.imageMessage} />
          <Text style={styles.downloadText}>Tap to download</Text>
        </TouchableOpacity>
      )}
      {item.type === 'file' && (
        <TouchableOpacity onPress={() => item.content && downloadFile(item.content, item.fileName || 'file')}>
          <View style={styles.fileMessage}>
            <Ionicons name="document-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.fileMessageText}>{item.fileName || 'File attached'}</Text>
          </View>
          <Text style={styles.downloadText}>Tap to download</Text>
        </TouchableOpacity>
      )}
      {item.type === 'audio' && (
        <TouchableOpacity onPress={() => item.content && (isPlaying && currentlyPlayingId === item.id ? pauseAudio() : playAudio(item.content, item.id))}>
          <View style={styles.audioMessage}>
            {isAudioLoading === item.id ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons 
                name={isPlaying && currentlyPlayingId === item.id ? "pause" : "play"} 
                size={24} 
                color={theme.colors.primary} 
              />
            )}
            <Text style={styles.audioMessageText}>
              {isAudioLoading === item.id ? 'Loading Audio...' : 
                (isPlaying && currentlyPlayingId === item.id ? 'Pause Audio' : 'Play Audio')}
            </Text>
          </View>
        </TouchableOpacity>
      )}
      {item.type === 'location' && item.location && (
        <TouchableOpacity onPress={() => openLocation(item.location!.latitude, item.location!.longitude)}>
          <View style={styles.locationMessage}>
            <Ionicons name="location-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.locationMessageText}>Location shared</Text>
          </View>
          <Text style={styles.openMapText}>Tap to open in Maps</Text>
        
        </TouchableOpacity>
      )}
      <View style={styles.messageFooter}>
        <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        {item.sender.role === 'client' && (
          <Text style={styles.messageStatus}>
            {item.status === 'sending' ? t('ticket.sending') : ''}
          </Text>
        )}
      </View>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>Order #{serviceId}</Text>
          <TouchableOpacity style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close Chat</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        <BlurView intensity={80} tint="light" style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={pickImage} style={styles.attachmentButton}>
                <Ionicons name="image-outline" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={pickDocument} style={styles.attachmentButton}>
                <Ionicons name="document-outline" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={isRecording ? stopRecording : startRecording} style={styles.attachmentButton}>
                <Ionicons name={isRecording ? "stop-circle-outline" : "mic-outline"} size={24} color={isRecording ? theme.colors.error : theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={sendLocation} style={styles.attachmentButton}>
                <Ionicons name="location-outline" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={t('ticket.inputPlaceholder')}
              placeholderTextColor={theme.colors.placeholder}
            />
            <TouchableOpacity onPress={sendTextMessage} style={styles.sendButton}>
              <Ionicons name="send" size={24} color={theme.colors.surface} />
            </TouchableOpacity>
          </View>
        </BlurView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  headerText: {
    color: theme.colors.surface,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
  },
  closeButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness,
  },
  closeButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
  },
  messageList: {
    padding: theme.spacing.md,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.roundness,
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.secondary,
  },
  senderName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.fontWeights.bold,
    marginBottom: theme.spacing.xs,
    color: theme.colors.surface,
  },
  messageText: {
    color: theme.colors.surface,
    fontSize: theme.typography.sizes.md,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  timestamp: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.surface,
    opacity: 0.7,
  },
  messageStatus: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.surface,
    opacity: 0.7,
  },
  inputContainer: {
    padding: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    paddingHorizontal: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    color: theme.colors.text,
  },
  sendButton: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
  },
  attachmentButton: {
    padding: theme.spacing.sm,
    marginHorizontal: theme.spacing.xs,
  },
  imageMessage: {
    width: 200,
    height: 150,
    borderRadius: theme.roundness,
  },
  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileMessageText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.surface,
  },
  audioMessage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioMessageText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.surface,
  },
  locationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationMessageText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.surface,
  },
  downloadText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.surface,
    marginTop: theme.spacing.xs,
  },
  playText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.surface,
    marginTop: theme.spacing.xs,
  },
  openMapText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.surface,
    marginTop: theme.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TicketScreen;