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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { RouteProp } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Location from 'expo-location';

let ImagePicker: any;
let DocumentPicker: any;
let Audio: any;

try {
  ImagePicker = require('expo-image-picker');
  DocumentPicker = require('expo-document-picker');
  Audio = require('expo-av');
} catch (error) {
  console.warn('Some features may not be available:', error);
}

type RootStackParamList = {
  ChatScreen: { serviceId: string };
};

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'audio' | 'location';
  content?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  location?: {
    latitude: number;
    longitude: number;
  };
}

const ChatScreen: React.FC<{ route: ChatScreenRouteProp }> = ({ route }) => {
  const { t } = useTranslation();
  const { serviceId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dummyMessages: Message[] = [
      { id: '1', text: 'Hello! How can I assist you today?', sender: 'agent', timestamp: new Date(Date.now() - 1000 * 60 * 5), type: 'text', status: 'read' },
      { id: '2', text: 'I have a question about my recent service.', sender: 'user', timestamp: new Date(Date.now() - 1000 * 60 * 4), type: 'text', status: 'read' },
      { id: '3', text: 'Sure, I\'d be happy to help. What specific question do you have?', sender: 'agent', timestamp: new Date(Date.now() - 1000 * 60 * 3), type: 'text', status: 'read' },
    ];
    setMessages(dummyMessages);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [serviceId]);

  const sendMessage = (newMessage: Message) => {
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setTimeout(() => {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg
        )
      );
    }, 1000);
    setTimeout(() => {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Thank you for your message. An agent will respond shortly.',
        sender: 'agent',
        timestamp: new Date(),
        type: 'text',
        status: 'sent',
      };
      setMessages(prevMessages => [...prevMessages, agentResponse]);
    }, 2000);
  };

  const sendTextMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        sender: 'user',
        timestamp: new Date(),
        type: 'text',
        status: 'sending',
      };
      sendMessage(newMessage);
      setInputText('');
    }
  };

  const pickImage = async () => {
    if (!ImagePicker) {
      Alert.alert('Feature Unavailable', 'Image picking is not available on this device.');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const newMessage: Message = {
          id: Date.now().toString(),
          text: 'Image',
          sender: 'user',
          timestamp: new Date(),
          type: 'image',
          content: result.assets[0].uri,
          status: 'sending',
        };
        sendMessage(newMessage);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const pickDocument = async () => {
    if (!DocumentPicker) {
      Alert.alert('Feature Unavailable', 'Document picking is not available on this device.');
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
      });

      if (result.type === 'success') {
        const newMessage: Message = {
          id: Date.now().toString(),
          text: 'File',
          sender: 'user',
          timestamp: new Date(),
          type: 'file',
          content: result.uri,
          status: 'sending',
        };
        sendMessage(newMessage);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const startRecording = async () => {
    if (!Audio) {
      Alert.alert('Feature Unavailable', 'Audio recording is not available on this device.');
      return;
    }
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
        const newMessage: Message = {
          id: Date.now().toString(),
          text: 'Audio',
          sender: 'user',
          timestamp: new Date(),
          type: 'audio',
          content: uri,
          status: 'sending',
        };
        sendMessage(newMessage);
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
      const newMessage: Message = {
        id: Date.now().toString(),
        text: 'Location',
        sender: 'user',
        timestamp: new Date(),
        type: 'location',
        status: 'sending',
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      };
      sendMessage(newMessage);
    } catch (error) {
      console.error('Error sending location:', error);
      Alert.alert('Error', 'Failed to send location. Please try again.');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <Animated.View style={[
      styles.messageContainer,
      item.sender === 'user' ? styles.userMessage : styles.agentMessage,
      { opacity: fadeAnim }
    ]}>
      {item.type === 'text' && <Text style={styles.messageText}>{item.text}</Text>}
      {item.type === 'image' && <Image source={{ uri: item.content }} style={styles.imageMessage} />}
      {item.type === 'file' && (
        <View style={styles.fileMessage}>
          <Ionicons name="document-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.fileMessageText}>File attached</Text>
        </View>
      )}
      {item.type === 'audio' && (
        <View style={styles.audioMessage}>
          <Ionicons name="musical-note-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.audioMessageText}>Audio message</Text>
        </View>
      )}
      {item.type === 'location' && (
        <View style={styles.locationMessage}>
          <Ionicons name="location-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.locationMessageText}>Location shared</Text>
        </View>
      )}
      <View style={styles.messageFooter}>
        <Text style={styles.timestamp}>{item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        {item.sender === 'user' && (
          <Text style={styles.messageStatus}>
            {item.status === 'sending' ? t('chat.sending') : ''}
          </Text>
        )}
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>Service Chat</Text>
          <TouchableOpacity style={styles.remindButton}>
            <Text style={styles.remindButtonText}>Remind</Text>
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
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder={t('chat.inputPlaceholder')}
              placeholderTextColor={theme.colors.placeholder}
            />
            <TouchableOpacity onPress={sendTextMessage} style={styles.sendButton}>
              <Ionicons name="send" size={24} color={theme.colors.primary} />
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
  remindButton: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.roundness,
  },
  remindButtonText: {
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
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
  },
  agentMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.secondary,
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
    fontSize:  theme.typography.sizes.xs,
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
    marginRight: theme.spacing.xs,
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
});

export default ChatScreen;