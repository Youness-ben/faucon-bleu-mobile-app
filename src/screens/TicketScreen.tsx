import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
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
import initializeEcho from '../echo';

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

interface AudioProgress {
  [key: string]: {
    position: number;
    duration: number;
  };
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
  const [audioProgress, setAudioProgress] = useState<AudioProgress>({});
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { user } = useUser();
  const navigation = useNavigation();
  const { clearNewMessages } = useNotification();

  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'file' | 'video' | 'audio' | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ uri: string; type: string } | null>(null);

  const [isMapVisible, setIsMapVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isRecordingUIVisible, setIsRecordingUIVisible] = useState(false);

  const [audioPosition, setAudioPosition] = useState< number >(0);


  const [echo, setEcho] = useState<any>(null); 
  const [subscription, setSubscription] = useState<any>(null);
  const [notificationSound, setNotificationSound] = React.useState<Audio.Sound | null>(null);

  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const headerHeight = useRef(new Animated.Value(60)).current;

  React.useEffect(() => {
    async function loadSound() {
      const { sound } = await Audio.Sound.createAsync(require('../../assets/ping.mp3'));
      setNotificationSound(sound);
    }

    loadSound();

    return () => {
      if (notificationSound) {
        notificationSound.unloadAsync();
      }
    };
  }, []);

  
  const playNotificationSound = React.useCallback(async () => {
    if (notificationSound) {
      try {
        await notificationSound.playAsync();
      } catch (error) {
        console.error('Failed to play notification sound', error);
      }
    }
  }, [notificationSound]);


  useEffect(() => {
    const setupEcho = async () => {
      const echoInstance = await initializeEcho(); 
      setEcho(echoInstance);
    };

    setupEcho();

    return () => {
      if (echo) {
        echo.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (echo) {

      const channelName = `chat.${serviceId}`;
      // Subscribe to the private channel
       const sub = echo.private(channelName)
        .listen('NewMessageSent', async (event: any) => {
          playNotificationSound();
            await fetchMessages(false);
        }); 

           setSubscription(sub);

    }
  }, [echo]);


  const fetchMessages = useCallback(async (setLoading = true) => {
    if (setLoading) setIsLoading(true);
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
  }, [serviceId, fadeAnim]);
  

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
      setMessages(prevMessages => [...prevMessages, response.data]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendTextMessage = useCallback(() => {
    if (inputText.trim()) {
      sendMessage('text', inputText.trim());
      setInputText('');
    }
  }, [inputText, sendMessage]);

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

      if (!result.canceled) {
        console.log(result.assets);
        setPreviewUri(result?.assets[0]?.uri);
        setPreviewType('file');
        setPreviewName(result?.assets[0]?.name);
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
      setIsRecordingUIVisible(true);

      recordingInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
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
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        setAudioUri(uri);
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
        Alert.alert('Success', `File downloaded successfully`,
          [  { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open',
            onPress: () => Linking.openURL(downloadedUri),
          },
        ]);
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
        { shouldPlay: true, positionMillis:  0 },
         
      );
      newSound.setOnPlaybackStatusUpdate((status)=>{onPlaybackStatusUpdate(status,messageId)});
      setSound(newSound);
      setIsPlaying(true);
      setCurrentlyPlayingId(messageId);
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio. Please try again.');
      setIsAudioLoading(null);
    }
  };

  const onPlaybackStatusUpdate = (status: Audio.PlaybackStatus, messageId: string) => {
    console.log('running');
    if (status.isLoaded) {
      console.log('running 1');
      setIsAudioLoading(null);
      setAudioProgress(prev => ({
        ...prev,
        [messageId]: {
          position: status.positionMillis,
          duration: status.durationMillis || 0,
        },
      }));
      console.log('running 2');

      setAudioPosition( status.positionMillis);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setCurrentlyPlayingId(null);
      console.log('running 2');

      }
    }
  };
  const seekAudio = async (messageId: string, position: number) => {
    if (sound && currentlyPlayingId === messageId) {
      await sound.setPositionAsync(position);
    }
    setAudioPosition( position);

  };

  const pauseAudio = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const formatDuration = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleHeader = () => {
    setIsHeaderExpanded(!isHeaderExpanded);
    Animated.spring(headerHeight, {
      toValue: isHeaderExpanded ? 60 : 200,
      useNativeDriver: false,
    }).start();
  };

  const renderHeader = () => (
    <Animated.View style={[styles.header, { height: headerHeight }]}>
      <View style={styles.headerTopRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleHeader} style={styles.headerContent}>
          <Text style={styles.headerTitle}>{"Chat"}</Text>
           <Ionicons 
            name={isHeaderExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={theme.colors.text} 
          /> 
        </TouchableOpacity>
        <View style={styles.moreButton} />
      </View>
      {isHeaderExpanded && (
        <View style={styles.headerDetails}>
          <Text style={styles.headerDetailText}>{t('service.carInfo')}: Toyota Camry</Text>
          <Text style={styles.headerDetailText}>{t('service.serviceType')}: Oil Change</Text>
          <Text style={styles.headerDetailText}>{t('service.status')}: In Progress</Text>
        </View>
      )}
    </Animated.View>
  );

  const renderMessage = ({ item }: { item: Message })  => {
    const messageDate = new Date(item.created_at);
    let dateDisplay = format(messageDate, 'MM/dd/yyyy');
    
    if (isToday(messageDate)) {
      dateDisplay = 'Today';
    } else if (isYesterday(messageDate)) {
      dateDisplay = 'Yesterday';
    }
  
    const timeDisplay = format(messageDate, 'HH:mm');
  
    return (
    <View style={[
      styles.messageWrapper,
      item.sender_type === user.type ? styles.currentUserMessageWrapper : styles.otherUserMessageWrapper
      ]}>
        <Animated.View style={[
          styles.messageContainer,
          item.sender_type === user.type ? styles.currentUserMessage : styles.otherUserMessage,
          { opacity: fadeAnim }
        ]}>
          {item.sender_type !== user.type && (
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.sender_type[0].toUpperCase()}</Text>
              </View>
            </View>
          )}
          <View style={styles.messageContent}>
            {item.sender_type !== user.type && (
              <Text style={styles.senderName}>
                {item.sender_type === 'vehicle' ? t('common.conductor') : (item.sender_type === 'client' ? t('common.client') : 'Faucon Bleu')}
              </Text>
            )}
            {item.message_type === 'text' && <Text style={styles.messageText}>{item.content}</Text>}
            {item.message_type === 'image' && (
              <TouchableOpacity onPress={() => setPreviewFile({ uri: `${STORAGE_URL}/${item.file_path}`, type: 'image' })}>
                <Image source={{ uri: `${STORAGE_URL}/${item.file_path}` }} style={styles.imageMessage} />
                <Text style={styles.previewText}>Tap to preview</Text>
              </TouchableOpacity>
            )}
            {item.message_type === 'video' && (
              <TouchableOpacity onPress={() => 
                setPreviewFile({ uri: `${STORAGE_URL}/${item.file_path}`, type: 'video' })
              }>
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
                  

                /*   if (fileExtension && viewableExtensions.includes(fileExtension)) {
                    setPreviewFile({ uri: `${STORAGE_URL}/${item.file_path}`, type: 'file' });
                  } else {*/
                    item.file_path && downloadFile(item.file_path, item.content || 'file');
                /* } */
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
                <View style={styles.audioControls}>
                  {isAudioLoading === item.id ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <Ionicons 
                      name={isPlaying && currentlyPlayingId === item.id ? "pause" : "play"} 
                      size={20} 
                      color={theme.colors.primary} 
                    />
                  )}
                  <Slider
                    style={styles.audioSlider}
                    minimumValue={0}
                    maximumValue={audioProgress[item.id]?.duration || 100}
                    value={audioPosition}
                    onValueChange={(value) => seekAudio(item.id, value)}
                    minimumTrackTintColor={theme.colors.primary}
                    maximumTrackTintColor={theme.colors.border}
                  />
                  <Text style={styles.timestamp}>
                    {formatDuration(audioPosition)}
                  </Text>
                </View>
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
          </View>
        </Animated.View>      
        <Text style={[
            styles.timestamp,
            item.sender_type === user.type ? styles.timestampRight : styles.timestampLeft
          ]}>
          {`${dateDisplay} ${timeDisplay}`}
        </Text>
    </View>
  );
}

  const renderInputArea = () => (
    <View style={styles.inputContainer}>
      {isRecordingUIVisible ? (
        <View style={styles.recordingContainer}>
          {isRecording ? (
            <>
              <Text style={styles.recordingDuration}>{formatDuration(recordingDuration * 1000)}</Text>
              <TouchableOpacity onPress={stopRecording} style={styles.stopRecordingButton}>
                <Ionicons name="stop" size={24} color={theme.colors.error} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => playAudio(audioUri!, 'preview')} style={styles.playButton}>
                <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={theme.colors.primary} />
              </TouchableOpacity>
              <Text style={styles.recordingDuration}>{formatDuration(recordingDuration * 1000)}</Text>
              <TouchableOpacity onPress={sendRecordedAudio} style={styles.sendRecordingButton}>
                <Ionicons name="send" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelRecording} style={styles.cancelRecordingButton}>
                <Ionicons name="close" size={24} color={theme.colors.error} />
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.attachButton} onPress={() => setIsFabOpen(!isFabOpen)}>
            <Ionicons name="add" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t('ticket.inputPlaceholder')}
            placeholderTextColor={theme.colors.placeholder}
          />
          {inputText.trim() ? (
            <TouchableOpacity onPress={sendTextMessage} style={styles.sendButton}>
              <Ionicons name="send" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={startRecording} style={styles.micButton}>
              <Ionicons name="mic" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );

  const renderPreview = () => {
    if (!previewUri) return null;

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={!!previewUri}
        onRequestClose={clearPreview}
      >
        <SafeAreaView style={styles.fullScreenPreview}>
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={clearPreview} style={styles.closeButton}>
              <Ionicons name="close-circle" size={32} color={theme.colors.surface} />
            </TouchableOpacity>
          </View>
          <View style={styles.fullScreenPreviewContent}>
            {previewType === 'image' ? (
              <Image source={{ uri: previewUri }} style={styles.fullScreenPreviewImage} resizeMode="contain" />
            ) : previewType === 'video' ? (
              <Video
                source={{ uri: previewUri }}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode="contain"
                shouldPlay={false}
                isLooping={false}
                style={styles.fullScreenPreviewVideo}
                useNativeControls
              />
            ) : (
              <View style={styles.filePreview}>
                <Ionicons name="document-outline" size={48} color={theme.colors.primary} />
                <Text style={styles.filePreviewText}>{previewName}</Text>
              </View>
            )}
          </View>
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.previewButton} onPress={sendAttachment}>
              <Text style={styles.previewButtonText}>Send</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.previewButton, styles.cancelButton]} onPress={clearPreview}>
              <Text style={styles.previewButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderFilePreview = () => {
    if (!previewFile) return null;

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={!!previewFile}
        onRequestClose={() => setPreviewFile(null)}
      >
        <SafeAreaView style={styles.fullScreenPreview}>
          <View style={styles.previewHeader}>
            <TouchableOpacity style={styles.downloadButton} onPress={() => downloadFile(previewFile.uri, 'file')}>
              <Ionicons name="download-outline" size={24} color={theme.colors.surface} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPreviewFile(null)} style={styles.closeButton}>
              <Ionicons name="close-circle" size={32} color={theme.colors.surface} />
            </TouchableOpacity>
          </View>
          <View style={styles.fullScreenPreviewContent}>
            {previewFile.type === 'image' ? (
              <Image source={{ uri: previewFile.uri }} style={styles.fullScreenPreviewImage} resizeMode="contain" />
            ) : previewFile.type === 'video' ? (
              <Video
                source={{ uri: previewFile.uri }}
                rate={1.0}
                volume={1.0}
                isMuted={false}
                resizeMode="contain"
                shouldPlay={true}
                isLooping={false}
                style={styles.fullScreenPreviewVideo}
                useNativeControls
              />
            ) : (
              <WebView source={{ uri: previewFile.uri }} style={styles.previewWebView} />
            )}
          </View>
        </SafeAreaView>
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

  const sendRecordedAudio = () => {
    if (audioUri) {
      const file = {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio_message.m4a',
      };
      pauseAudio();
      sendMessage('audio', undefined, file);
      clearPreview();
      setIsRecordingUIVisible(false);
    }
  };

  const cancelRecording = () => {
    setIsRecordingUIVisible(false);
    setRecordingDuration(0);
    setPreviewUri(null);
  };

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
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 30}
      >
        {renderHeader()}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        {renderInputArea()}
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
        </View>
      )}
      {renderPreview()}
      {renderFilePreview()}
      {renderLocationPicker()}
      </KeyboardAvoidingView>
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
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    height: 90,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  
    elevation: 4,
    backgroundColor: '#fff',

  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  moreButton: {
    padding: theme.spacing.sm,
  },
  headerDetails: {
    padding: theme.spacing.md,
  },
  headerDetailText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  moreButton: {
    padding: theme.spacing.sm,
  },
  messageList: {
    padding: theme.spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  avatarContainer: {
    marginRight: theme.spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: theme.colors.surface,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.fontWeights.bold,
  },
  messageContent: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.roundness * 2,
    maxWidth: '80%',
    backgroundColor: theme.colors.background,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },  messageWrapper: {
    marginBottom: theme.spacing.md,
  },
  currentUserMessageWrapper: {
    alignItems: 'flex-end',
  },
  otherUserMessageWrapper: {
    alignItems: 'flex-start',
  },
  timestamp: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.muted,
    marginTop: theme.spacing.xxs,
  },
  timestampRight: {
    alignSelf: 'flex-end',
    marginRight: theme.spacing.sm,
  },
  timestampLeft: {
    alignSelf: 'flex-start',
    marginLeft: theme.spacing.sm,
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    marginLeft: '20%',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    marginRight: '20%',
  },
  senderName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.fontWeights.bold,
    marginBottom: theme.spacing.xs,
    color: theme.colors.muted,
  },
  messageText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  timestamp: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.muted,
    alignSelf: 'flex-end',
    marginTop: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: theme.roundness,
    color: theme.colors.text,
  },
  attachButton: {
    padding: theme.spacing.sm,
  },
  sendButton: {
    padding: theme.spacing.sm,
  },
  micButton: {
    padding: theme.spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: theme.roundness,
  },
  videoMessage: {
    width: 200,
    height: 200,
    borderRadius: theme.roundness,
  },
  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.roundness,
  },
  fileMessageText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.text,
  },
  audioMessage: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.roundness,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioSlider: {
    flex: 1,
    marginHorizontal: theme.spacing.sm,
  },
  mapPreview: {
    width: 200,
    height: 150,
    borderRadius: theme.roundness,
  },
  openMapText: {
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
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
    width: '90%',
    maxHeight: '80%',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: theme.roundness,
  },
  previewVideo: {
    width: '100%',
    height: 300,
    borderRadius: theme.roundness,
  },
  previewWebView: {
    width: '100%',
    height: 400,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.md,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  previewButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.error,
  },
  previewButtonText: {
    color: theme.colors.surface,
    fontWeight: theme.typography.fontWeights.bold,
    fontSize: theme.typography.sizes.md,
    marginLeft: theme.spacing.sm,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
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
  },
  mapButtonText: {
    color: theme.colors.surface,
    fontWeight: theme.typography.fontWeights.bold,
  },
  fabMenu: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    flexDirection: 'row',
  },
  fabMenuItem: {
    backgroundColor: theme.colors.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.roundness,
  },
  recordingDuration: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  stopRecordingButton: {
    padding: theme.spacing.sm,
  },
  playButton: {
    padding: theme.spacing.sm,
  },
  sendRecordingButton: {
    padding: theme.spacing.sm,
  },
  cancelRecordingButton: {
    padding: theme.spacing.sm,
  },
  fullScreenPreview: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  downloadButton: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
  },
  previewTitle: {
    flex: 1,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.fontWeights.bold,
    textAlign: 'center',
    color: theme.colors.text,
  },
  fullScreenPreviewContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  fullScreenPreviewImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenPreviewVideo: {
    width: '100%',
    height: '100%',
  },
  filePreview: {
    alignItems: 'center',
  },
  filePreviewText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
  },
});