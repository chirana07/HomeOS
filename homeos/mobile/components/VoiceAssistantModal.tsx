import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {
  Mic,
  Square,
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  Bot,
  Sparkles,
  AlertCircle,
  Settings,
} from 'lucide-react-native';
import { VoiceStatus, VoiceMessage } from '../hooks/useVoiceAssistant';

interface VoiceAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  status: VoiceStatus;
  transcript: string;
  errorMsg: string | null;
  isMuted: boolean;
  permissionGranted: boolean | null;
  conversationHistory: VoiceMessage[];
  startListening: () => void;
  stopListeningAndProcess: () => void;
  cancelRecording: () => void;
  replayLastResponse: () => void;
  toggleMute: () => void;
  requestMicrophonePermission: () => Promise<boolean>;
}

export function VoiceAssistantModal({
  visible,
  onClose,
  status,
  transcript,
  errorMsg,
  isMuted,
  permissionGranted,
  conversationHistory,
  startListening,
  stopListeningAndProcess,
  cancelRecording,
  replayLastResponse,
  toggleMute,
  requestMicrophonePermission,
}: VoiceAssistantModalProps) {
  // Waveform & Pulse Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const barAnim1 = useRef(new Animated.Value(0.4)).current;
  const barAnim2 = useRef(new Animated.Value(0.7)).current;
  const barAnim3 = useRef(new Animated.Value(0.5)).current;
  const barAnim4 = useRef(new Animated.Value(0.8)).current;
  const barAnim5 = useRef(new Animated.Value(0.3)).current;

  // Pulse ring animation when listening or speaking
  useEffect(() => {
    if (status === 'listening' || status === 'speaking') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      );
      pulse.start();

      // Waveform bars animation
      const animateBar = (animVal: Animated.Value, dur: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(animVal, {
              toValue: 1,
              duration: dur,
              useNativeDriver: false,
            }),
            Animated.timing(animVal, {
              toValue: 0.2,
              duration: dur,
              useNativeDriver: false,
            }),
          ])
        );
      };

      const wave1 = animateBar(barAnim1, 400);
      const wave2 = animateBar(barAnim2, 350);
      const wave3 = animateBar(barAnim3, 500);
      const wave4 = animateBar(barAnim4, 450);
      const wave5 = animateBar(barAnim5, 300);

      wave1.start();
      wave2.start();
      wave3.start();
      wave4.start();
      wave5.start();

      return () => {
        pulse.stop();
        wave1.stop();
        wave2.stop();
        wave3.stop();
        wave4.stop();
        wave5.stop();
      };
    } else {
      pulseAnim.setValue(1);
    }
  }, [status]);

  const handleMicPress = () => {
    if (status === 'listening') {
      stopListeningAndProcess();
    } else if (status === 'idle' || status === 'speaking' || status === 'error') {
      startListening();
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'listening':
        return 'Listening... Tap to finish';
      case 'processing':
        return 'HomeOS AI is thinking...';
      case 'speaking':
        return 'HomeOS AI Speaking...';
      case 'error':
        return 'Error occurred';
      default:
        return 'Tap mic to speak';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'listening':
        return '#ef4444'; // Red recording
      case 'processing':
        return '#eab308'; // Amber processing
      case 'speaking':
        return '#10b981'; // Green speaking
      case 'error':
        return '#f43f5e';
      default:
        return '#6366f1';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleRow}>
              <Bot size={22} color="#6366f1" />
              <Text style={styles.headerTitle}>Voice AI Assistant</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#cbd5e1" />
            </TouchableOpacity>
          </View>

          {/* Status Badge */}
          <View style={styles.statusBadgeRow}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
          </View>

          {/* Permission Warning */}
          {permissionGranted === false && (
            <View style={styles.permWarningBox}>
              <AlertCircle size={18} color="#f43f5e" />
              <Text style={styles.permText}>Microphone permission is required.</Text>
              <TouchableOpacity
                onPress={() => Linking.openSettings()}
                style={styles.settingsBtn}
                activeOpacity={0.8}
              >
                <Settings size={14} color="#fff" />
                <Text style={styles.settingsBtnText}>Settings</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Hero Microphone & Waveform Section */}
          <View style={styles.heroSection}>
            {/* Pulsing Outer Rings */}
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: pulseAnim }],
                  borderColor: getStatusColor(),
                },
              ]}
            />

            {/* Central Mic / Stop Button */}
            <TouchableOpacity
              onPress={handleMicPress}
              disabled={status === 'processing'}
              style={[
                styles.micBtn,
                { backgroundColor: status === 'listening' ? '#ef4444' : '#6366f1' },
              ]}
              activeOpacity={0.85}
            >
              {status === 'processing' ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : status === 'listening' ? (
                <Square size={28} color="#fff" fill="#fff" />
              ) : (
                <Mic size={32} color="#fff" />
              )}
            </TouchableOpacity>

            {/* Audio Waveform Visualization */}
            <View style={styles.waveformContainer}>
              <Animated.View
                style={[
                  styles.waveBar,
                  {
                    height: barAnim1.interpolate({
                      inputRange: [0, 1],
                      outputRange: [6, 28],
                    }),
                    backgroundColor: getStatusColor(),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.waveBar,
                  {
                    height: barAnim2.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 36],
                    }),
                    backgroundColor: getStatusColor(),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.waveBar,
                  {
                    height: barAnim3.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 44],
                    }),
                    backgroundColor: getStatusColor(),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.waveBar,
                  {
                    height: barAnim4.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 36],
                    }),
                    backgroundColor: getStatusColor(),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.waveBar,
                  {
                    height: barAnim5.interpolate({
                      inputRange: [0, 1],
                      outputRange: [6, 28],
                    }),
                    backgroundColor: getStatusColor(),
                  },
                ]}
              />
            </View>
          </View>

          {/* Live Transcript / AI Response Card */}
          <View style={styles.transcriptCard}>
            <View style={styles.transcriptHeader}>
              <Sparkles size={14} color="#818cf8" />
              <Text style={styles.transcriptTitle}>AI Response</Text>
            </View>
            <ScrollView style={styles.transcriptScroll} nestedScrollEnabled>
              {errorMsg ? (
                <Text style={styles.errorMsgText}>{errorMsg}</Text>
              ) : transcript ? (
                <Text style={styles.transcriptBody}>{transcript}</Text>
              ) : (
                <Text style={styles.transcriptPlaceholder}>
                  Press the mic to ask HomeOS anything about your pantry, meals, or budget.
                </Text>
              )}
            </ScrollView>
          </View>

          {/* Action Bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              onPress={replayLastResponse}
              disabled={!transcript}
              style={[styles.actionBtn, !transcript && styles.actionBtnDisabled]}
              activeOpacity={0.7}
            >
              <RotateCcw size={16} color={transcript ? '#cbd5e1' : '#475569'} />
              <Text style={[styles.actionBtnText, !transcript && styles.actionBtnTextDisabled]}>
                Replay
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleMute} style={styles.actionBtn} activeOpacity={0.7}>
              {isMuted ? (
                <VolumeX size={16} color="#ef4444" />
              ) : (
                <Volume2 size={16} color="#10b981" />
              )}
              <Text style={styles.actionBtnText}>{isMuted ? 'Muted' : 'Mute'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={cancelRecording} style={styles.cancelBtn} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 11, 20, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#151b2e',
    borderRadius: 28,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  permWarningBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  permText: {
    color: '#fda4af',
    fontSize: 11,
    flex: 1,
    marginLeft: 8,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f43f5e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  settingsBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  heroSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  pulseRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    opacity: 0.5,
  },
  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    marginTop: 16,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  transcriptCard: {
    width: '100%',
    backgroundColor: '#090b14',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    maxHeight: 120,
    marginVertical: 12,
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  transcriptTitle: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  transcriptScroll: {
    maxHeight: 80,
  },
  transcriptBody: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
  },
  transcriptPlaceholder: {
    color: '#64748b',
    fontSize: 12,
    fontStyle: 'italic',
  },
  errorMsgText: {
    color: '#f43f5e',
    fontSize: 12,
    fontWeight: '600',
  },
  actionBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnDisabled: {
    opacity: 0.4,
  },
  actionBtnText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  actionBtnTextDisabled: {
    color: '#475569',
  },
  cancelBtn: {
    backgroundColor: '#1d2440',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
