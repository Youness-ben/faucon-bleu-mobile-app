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
  Modal,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Video } from 'expo-av';
import MapView, { Marker, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';
import api from '../api';
import { useUser } from '../UserContext';
import { useNotification } from '../NotificationContext';
import { MAPBOX_TOKEN, STORAGE_URL } from '../../config';
import { WebView } from 'react-native-webview';
import Slider from '@react-native-community/slider';

type RootStackParamList = {
  TicketScreen: { serviceId: string };
};

type TicketScreenRouteProp = RouteProp<RootStackParamList, 'TicketScreen'>;

interface Message {
  id: string;
  sender_type: 'client' | 'vehicle' | 'agent';
  message_type: 'text' | 'image' | 'file' | 'audio' | 'location' | 'video';
  content?: string;
  file_path?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export default function Component({ route }: { route: TicketScreenRouteProp }) {
  const { t } = useTranslation();
  const { serviceId } = route.params;
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
  const { user } = useUser();
  const navigation = useNavigation();
  const { clearNewMessages } = useNotification();

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'file' | 'video' | 'audio' | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ uri: string; type: string } | null>(null);

  const [isMapVisible, setIsMapVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  const [isFabOpen, setIsFabOpen] = useState(false);

  useEffect(() => {
    fetchMessages();
    clearNewMessages(serviceId);

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [serviceId]);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`service-orders/${serviceId}/chat`);
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

  const sendMessage = async (messageType: string, content?: string, file?: any, location?: { latitude: number; longitude: number }) => {
    try {
      const formData = new FormData();
      formData.append('message_type', messageType);

      if (content) {
        formData.append('content', content);
      }

      if (file) {
        formData.append('file', file);
      }

      if (location) {
        formData.append('latitude', location.latitude.toString());
        formData.append('longitude', location.longitude.toString());
      }

      const response = await api.post(`service-orders/${serviceId}/chat`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log(response.data);
      setMessages(prevMessages => [...prevMessages, response.data]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendTextMessage = () => {
    if (inputText.trim()) {
      sendMessage('text', inputText.trim());
      setInputText('');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPreviewUri(asset.uri);
        setPreviewType(asset.type === 'video' ? 'video' : 'image');
        setPreviewName(asset.type === 'video' ? 'video.mp4' : 'image.jpg');
      }
    } catch (error) {
      console.error('Error picking image or video:', error);
      Alert.alert('Error', 'Failed to pick image or video. Please try again.');
    }
    setIsFabOpen(false);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });

      if (result.type === 'success') {
        setPreviewUri(result.uri);
        setPreviewType('file');
        setPreviewName(result.name);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
    setIsFabOpen(false);
  };

  const sendAttachment = () => {
    if (previewUri && previewType) {
      const file = {
        uri: previewUri,
        type: previewType === 'image' ? 'image/jpeg' : (previewType === 'video' ? 'video/mp4' : (previewType === 'audio' ? 'audio/m4a' : 'application/octet-stream')),
        name: previewName || 'file',
      };
      sendMessage(previewType, undefined, file);
      clearPreview();
    }
  };

  const clearPreview = () => {
    setPreviewUri(null);
    setPreviewType(null);
    setPreviewName(null);
    setPreviewFile(null);
    setRecordingDuration(0);
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
      setRecordingDuration(0);

      recordingInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
    setIsFabOpen(false);
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
      if (uri) {
        setPreviewUri(uri);
        setPreviewType('audio');
        setPreviewName('audio_message.m4a');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  const openLocationPicker = () => {
    setIsMapVisible(true);
    setIsFabOpen(false);
  };

  const sendLocation = () => {
    if (selectedLocation) {
      sendMessage('location', undefined, undefined, selectedLocation);
      setIsMapVisible(false);
      setSelectedLocation(null);
    }
  };

  const openLocation = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const downloadFile = async (uri: string, fileName: string) => {
    try {
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const downloadResumable = FileSystem.createDownloadResumable(
        STORAGE_URL+uri,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          console.log(`Download progress: ${progress * 100}%`);
        }
      );

      const { uri: downloadedUri } = await downloadResumable.downloadAsync();
      
      if (downloadedUri) {
        console.log(`File downloaded to: ${downloadedUri}`);
        Alert.alert('Success', `File downloaded successfully`);
      } else {
        throw new Error('Download failed');
      }
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
      item.sender_type === user.type ? styles.currentUserMessage : styles.otherUserMessage,
      { opacity: fadeAnim }
    ]}>
      <Text style={styles.senderName}>{item.sender_type === user.type ? '' : (item.sender_type === 'vehicle' ? t('common.conductor') : (item.sender_type === 'client' ? t('common.client') : 'Faucon Bleu'))}</Text>
      {item.message_type === 'text' && <Text style={styles.messageText}>{item.content}</Text>}
      {item.message_type === 'image' && (
        <TouchableOpacity onPress={() => setPreviewFile({ uri: `${STORAGE_URL}/${item.file_path}`, type: 'image' })}>
          <Image source={{ uri: `${STORAGE_URL}/${item.file_path}` }} style={styles.imageMessage} />
          <Text style={styles.previewText}>Tap to preview</Text>
        </TouchableOpacity>
      )}
      {item.message_type === 'video' && (
        <TouchableOpacity onPress={() => setPreviewFile({ uri: `${STORAGE_URL}/${item.file_path}`, type: 'video' })}>
          <Video
            source={{ uri: `${STORAGE_URL}/${item.file_path}` }}
            style={styles.videoMessage}
            resizeMode="cover"
            shouldPlay={false}
          />
          <Text style={styles.previewText}>Tap to preview</Text>
        </TouchableOpacity>
      )}
      {item.message_type === 'file' && (
        <View>
          <TouchableOpacity onPress={() => {
            const fileExtension = item.file_path?.split('.').pop()?.toLowerCase();
            const viewableExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
            if (fileExtension && viewableExtensions.includes(fileExtension)) {
              setPreviewFile({ uri: `${STORAGE_URL}/${item.file_path}`, type: 'file' });
            } else {
              
              item.file_path && downloadFile(item.file_path, item.content || 'file');
            }
          }}>
            <View style={styles.fileMessage}>
              <Ionicons name="document-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.fileMessageText}>{item.content || 'File attached'}</Text>
            </View>
            <Text style={styles.previewText}>
              {item.file_path?.split('.').pop()?.toLowerCase() in ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'] 
                ? 'Tap to preview' 
                : 'Tap to download'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {item.message_type === 'audio' && (
        <TouchableOpacity onPress={() => item.file_path && (isPlaying && currentlyPlayingId === item.id ? pauseAudio() : playAudio(`${STORAGE_URL}/${item.file_path}`, item.id))}>
          <View style={styles.audioMessage}>
            {isAudioLoading === item.id ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons 
                name={isPlaying && currentlyPlayingId === item.id ? "pause-outline" : "play-outline"} 
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
      {item.message_type === 'location' && item.latitude && item.longitude && (
        <TouchableOpacity onPress={() => openLocation(item.latitude!, item.longitude!)}>
          <Image
            source={{ uri: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+FF0000(${item.longitude},${item.latitude})/${item.longitude},${item.latitude},14,0/300x200?access_token=${MAPBOX_TOKEN}` }}
            style={styles.mapPreview}
          />
          <Text style={styles.openMapText}>Open in Maps</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.timestamp}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
    </Animated.View>
  );

  const renderPreview = () => {
    if (!previewUri) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!previewUri}
        onRequestClose={clearPreview}
      >
        <View style={styles.previewContainer}>
          <View style={styles.previewContent}>
            {previewType === 'image' ? (
              <Image source={{ uri: previewUri }} style={styles.previewImage} />
            ) : previewType === 'video' ? (
              <Video
                source={{ uri: previewUri }}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode="cover"
                shouldPlay={false}
                isLooping={false}
                style={styles.previewVideo}
                useNativeControls
              />
            ) : previewType === 'audio' ? (
              <View style={styles.audioPreview}>
                <Slider
                  style={{width: 200, height: 40}}
                  minimumValue={0}
                  maximumValue={recordingDuration}
                  value={recordingDuration}
                  minimumTrackTintColor={theme.colors.primary}
                  maximumTrackTintColor="#000000"
                />
                <TouchableOpacity onPress={() => playAudio(previewUri, 'preview')}>
                  <Ionicons name={isPlaying ? "pause" : "play"} size={48} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.audioPreviewText}>{formatDuration(recordingDuration)}</Text>
              </View>
            ) : (
              <View style={styles.filePreview}>
                <Ionicons name="document-outline" size={48} color={theme.colors.primary} />
                <Text style={styles.filePreviewText}>{previewName}</Text>
              </View>
            )}
            <View style={styles.previewActions}>
              <TouchableOpacity style={styles.previewButton} onPress={sendAttachment}>
                <Text style={styles.previewButtonText}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.previewButton, styles.cancelButton]} onPress={clearPreview}>
                <Text style={styles.previewButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderFilePreview = () => {
    if (!previewFile) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!previewFile}
        onRequestClose={() => setPreviewFile(null)}
      >
        <View style={styles.previewContainer}>
          <View style={styles.previewContent}>
            {previewFile.type === 'image' ? (
              <Image source={{ uri: previewFile.uri }} style={styles.previewImage} resizeMode="contain" />
            ) : previewFile.type === 'video' ? (
              <Video
                source={{ uri: previewFile.uri }}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode="contain"
                shouldPlay={true}
                isLooping={false}
                style={styles.previewVideo}
                useNativeControls
              />
            ) : (
              <WebView source={{ uri: previewFile.uri }} style={styles.previewWebView} />
            )}
            <View style={styles.previewActions}>
              <TouchableOpacity style={styles.previewButton} onPress={() => downloadFile(previewFile.uri, 'file')}>
                <Text style={styles.previewButtonText}>Download</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.previewButton, styles.cancelButton]} onPress={() => setPreviewFile(null)}>
                <Text style={styles.previewButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderLocationPicker = () => {
    if (!isMapVisible) return null;

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={isMapVisible}
        onRequestClose={() => setIsMapVisible(false)}
      >
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={{
              latitude: 37.78825,
              longitude: -122.4324,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onPress={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
          >
            <UrlTile
              urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
            />
            {selectedLocation && (
              <Marker coordinate={selectedLocation} />
            )}
          </MapView>
          <View style={styles.mapActions}>
            <TouchableOpacity style={styles.mapButton} onPress={sendLocation}>
              <Text style={styles.mapButtonText}>Send Location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.mapButton, styles.cancelButton]} onPress={() => setIsMapVisible(false)}>
              <Text style={styles.mapButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{t('service.name')}</Text>
          <Text style={styles.headerSubtitle}>{t('service.carInfo')}</Text>
        </View>
      </View>
    </View>
  );

  const renderFloatingActionButton = () => (
    <View style={styles.fabContainer}>
      {isFabOpen && (
        <View style={styles.fabMenu}>
          <TouchableOpacity onPress={pickImage} style={styles.fabMenuItem}>
            <Ionicons name="image-outline" size={24} color={theme.colors.surface} />
          </TouchableOpacity>
          <TouchableOpacity onPress={pickDocument} style={styles.fabMenuItem}>
            <Ionicons name="document-outline" size={24} color={theme.colors.surface} />
          </TouchableOpacity>
          <TouchableOpacity onPress={openLocationPicker} style={styles.fabMenuItem}>
            <Ionicons name="location-outline" size={24} color={theme.colors.surface} />
          </TouchableOpacity>
          <TouchableOpacity onPress={isRecording ? stopRecording : startRecording} style={styles.fabMenuItem}>
            <Ionicons name={isRecording ? "stop" : "mic-outline"} size={24} color={theme.colors.surface} />
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity
        style={[styles.fab, isFabOpen && styles.fabOpen]}
        onPress={() => setIsFabOpen(!isFabOpen)}
      >
        <Ionicons name={isFabOpen ? "close" : "add"} size={24} color={theme.colors.surface} />
      </TouchableOpacity>
    </View>
  );

  const renderInputArea = () => (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        value={inputText}
        onChangeText={setInputText}
        placeholder={t('ticket.inputPlaceholder')}
        placeholderTextColor={theme.colors.placeholder}
      />
      <TouchableOpacity 
        onPress={sendTextMessage} 
        style={styles.sendButton}
        disabled={!inputText.trim()}
      >
        <Ionicons 
          name="send" 
          size={24} 
          color={inputText.trim() ? theme.colors.surface : theme.colors.placeholder} 
        />
      </TouchableOpacity>
    </View>
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
        {renderHeader()}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          scrollEnabled={!isFabOpen}
        />
        {renderFloatingActionButton()}
        {renderInputArea()}
      </KeyboardAvoidingView>
      {renderPreview()}
      {renderFilePreview()}
      {renderLocationPicker()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    marginRight: theme.spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.muted,
  },
  messageList: {
    padding: theme.spacing.md,
  },
  messageContainer: {
    maxWidth: '75%',
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
  timestamp: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.surface,
    opacity: 0.7,
    marginTop: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    paddingHorizontal: theme.spacing.lg,
    marginRight: theme.spacing.sm,
    color: theme.colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    alignItems: 'flex-end',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabOpen: {
    backgroundColor: theme.colors.error,
  },
  fabMenu: {
    marginBottom: theme.spacing.sm,
  },
  fabMenuItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  imageMessage: {
    width: 200,
    height: 150,
    borderRadius: theme.roundness,
  },
  videoMessage: {
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
  mapPreview: {
    width: 200,
    height: 150,
    borderRadius: theme.roundness,
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
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  previewContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    width: '80%',
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: theme.roundness,
  },
  previewVideo: {
    width: 200,
    height: 200,
    borderRadius: theme.roundness,
  },
  filePreview: {
    alignItems: 'center',
  },
  filePreviewText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.md,
    width: '100%',
  },
  previewButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.sm,
    borderRadius: theme.roundness,
    width: '40%',
    alignItems: 'center',
  },
  previewButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
  },
  cancelButton: {
    backgroundColor: theme.colors.error,
  },
  previewText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.surface,
    marginTop: theme.spacing.xs,
  },
  previewWebView: {
    width: '100%',
    height: 300,
    borderRadius: theme.roundness,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 100,
  },
  mapActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  mapButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.sm,
    borderRadius: theme.roundness,
    width: '40%',
    alignItems: 'center',
  },
  mapButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
  },
  audioPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.background,
  },
  audioPreviewText: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.text,
  },
});