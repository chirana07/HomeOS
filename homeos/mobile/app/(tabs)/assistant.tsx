// assistant.tsx (Conversational Assistant Tab)
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { Bot, Mic, Send, Volume2 } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import { useVoiceAssistant } from '../../hooks/useVoiceAssistant';
import { VoiceAssistantModal } from '../../components/VoiceAssistantModal';

export default function AssistantTab() {
  const { chatHistory, sendChatMessage, isThinking } = useApp();
  const [inputText, setInputText] = useState('');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const voice = useVoiceAssistant();
  const flatListRef = useRef<FlatList>(null);

  const suggestionChips = [
    "What should I cook tonight?",
    "How can I save money this month?",
    "What is in my pantry right now?",
    "I bought 2 kg carrots and 10 eggs"
  ];

  const handleSendText = async (text: string) => {
    if (!text.trim()) return;
    setInputText('');
    await sendChatMessage(text);
  };

  const handleMicToggle = () => {
    setIsVoiceModalOpen(true);
    voice.startListening();
  };

  const handleSpeak = (text: string) => {
    Speech.speak(text);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Title Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>HomeOS Assistant</Text>
          <TouchableOpacity 
            onPress={handleMicToggle} 
            style={styles.voiceHeaderBtn}
            activeOpacity={0.8}
          >
            <Mic size={16} color="#fff" />
            <Text style={styles.voiceHeaderBtnText}>Voice Mode</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subText}>Connected to Gemini 2.5 Flash & SQLite inventory context.</Text>
      </View>

      {/* Suggestion Chips */}
      {chatHistory.length <= 2 && (
        <View style={styles.chipsContainer}>
          {suggestionChips.map((chip, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.chip}
              onPress={() => handleSendText(chip)}
            >
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={chatHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isUser = item.sender === 'user';
          return (
            <Animated.View 
              entering={FadeIn}
              style={[
                styles.messageRow,
                isUser ? styles.messageRowUser : styles.messageRowBot
              ]}
            >
              {!isUser && (
                <View style={styles.botAvatar}>
                  <Bot size={16} color="#fff" />
                </View>
              )}
              <View style={[
                styles.bubble,
                isUser ? styles.bubbleUser : styles.bubbleBot
              ]}>
                <Text style={[
                  styles.bubbleText,
                  isUser ? styles.bubbleTextUser : styles.bubbleTextBot
                ]}>
                  {item.text}
                </Text>
                {!isUser && (
                  <TouchableOpacity 
                    onPress={() => handleSpeak(item.text)}
                    style={styles.ttsButton}
                  >
                    <Volume2 size={14} color="#64748b" />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          );
        }}
      />

      {/* AI is thinking loader */}
      {isThinking && (
        <View style={styles.thinkingContainer}>
          <ActivityIndicator size="small" color="#6366f1" />
          <Text style={styles.thinkingText}>Querying Gemini LLM...</Text>
        </View>
      )}

      {/* Chat Input Row */}
      <View style={styles.inputRow}>
        <TouchableOpacity 
          onPress={handleMicToggle}
          style={styles.micBtn}
          activeOpacity={0.8}
        >
          <Mic size={20} color="#6366f1" />
        </TouchableOpacity>
        
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask HomeOS..."
          placeholderTextColor="#64748b"
          style={styles.textInput}
          onSubmitEditing={() => handleSendText(inputText)}
        />

        <TouchableOpacity 
          onPress={() => handleSendText(inputText)}
          style={styles.sendBtn}
        >
          <Send size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Voice Assistant Overlay Modal */}
      <VoiceAssistantModal
        visible={isVoiceModalOpen}
        onClose={() => {
          voice.cancelRecording();
          setIsVoiceModalOpen(false);
        }}
        status={voice.status}
        transcript={voice.transcript}
        errorMsg={voice.errorMsg}
        isMuted={voice.isMuted}
        permissionGranted={voice.permissionGranted}
        conversationHistory={voice.conversationHistory}
        startListening={voice.startListening}
        stopListeningAndProcess={voice.stopListeningAndProcess}
        cancelRecording={voice.cancelRecording}
        replayLastResponse={voice.replayLastResponse}
        toggleMute={voice.toggleMute}
        requestMicrophonePermission={voice.requestMicrophonePermission}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070a13',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voiceHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  voiceHeaderBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  chip: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  messageListContent: {
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
  },
  messageRowBot: {
    alignSelf: 'flex-start',
    gap: 8,
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleUser: {
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: '#fff',
  },
  bubbleTextBot: {
    color: '#e2e8f0',
  },
  ttsButton: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  thinkingText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recordingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderColor: 'rgba(244, 63, 94, 0.2)',
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 24,
    borderRadius: 16,
    marginBottom: 12,
  },
  recordingText: {
    color: '#f43f5e',
    fontSize: 13,
    fontWeight: 'bold',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
  },
  waveBar: {
    width: 3,
    height: '100%',
    backgroundColor: '#f43f5e',
    borderRadius: 1.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: '#f43f5e',
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#070a13',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
