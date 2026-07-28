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
import { Bot, Mic, Send, Square, Volume2 } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  FadeIn
} from 'react-native-reanimated';
import * as Speech from 'expo-speech';

export default function AssistantTab() {
  const { chatHistory, sendChatMessage, isThinking } = useApp();
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  
  // Waveform animations
  const pulse1 = useSharedValue(1);
  const pulse2 = useSharedValue(1);
  const pulse3 = useSharedValue(1);

  useEffect(() => {
    if (isRecording) {
      pulse1.value = withRepeat(withSequence(withTiming(1.6, { duration: 400 }), withTiming(1, { duration: 400 })), -1, true);
      pulse2.value = withRepeat(withSequence(withTiming(2.0, { duration: 500 }), withTiming(1, { duration: 500 })), -1, true);
      pulse3.value = withRepeat(withSequence(withTiming(1.4, { duration: 300 }), withTiming(1, { duration: 300 })), -1, true);
    } else {
      pulse1.value = withTiming(1);
      pulse2.value = withTiming(1);
      pulse3.value = withTiming(1);
    }
  }, [isRecording]);

  const animatedStyle1 = useAnimatedStyle(() => ({ transform: [{ scaleY: pulse1.value }] }));
  const animatedStyle2 = useAnimatedStyle(() => ({ transform: [{ scaleY: pulse2.value }] }));
  const animatedStyle3 = useAnimatedStyle(() => ({ transform: [{ scaleY: pulse3.value }] }));

  const suggestionChips = [
    "What should I cook tonight?",
    "How can I save money this month?",
    "What is in my pantry right now?",
    "I bought 2 kg carrots and 10 eggs"
  ];

  // TODO (Post-Competition): Enhance assistant chat with server-sent events (SSE) streaming
  // Current implementation reliably uses standard REST request/response via POST /api/assistant/chat
  const handleSendText = async (text: string) => {
    if (!text.trim()) return;
    setInputText('');
    await sendChatMessage(text);
  };

  const handleMicToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      const simulatedVoiceQuery = "What can I cook with my current inventory?";
      handleSendText(simulatedVoiceQuery);
    } else {
      Speech.stop();
      setIsRecording(true);
    }
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
        <Text style={styles.title}>HomeOS Assistant</Text>
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

      {/* Bottom Audio Recording View */}
      {isRecording && (
        <Animated.View entering={FadeIn} style={styles.recordingOverlay}>
          <Text style={styles.recordingText}>Listening...</Text>
          <View style={styles.waveformContainer}>
            <Animated.View style={[styles.waveBar, animatedStyle1]} />
            <Animated.View style={[styles.waveBar, animatedStyle2]} />
            <Animated.View style={[styles.waveBar, animatedStyle3]} />
            <Animated.View style={[styles.waveBar, animatedStyle2]} />
            <Animated.View style={[styles.waveBar, animatedStyle1]} />
          </View>
        </Animated.View>
      )}

      {/* Chat Input Row */}
      <View style={styles.inputRow}>
        <TouchableOpacity 
          onPress={handleMicToggle}
          style={[
            styles.micBtn,
            isRecording && styles.micBtnActive
          ]}
        >
          {isRecording ? (
            <Square size={20} color="#fff" fill="#fff" />
          ) : (
            <Mic size={20} color="#6366f1" />
          )}
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
