import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, View } from 'react-native';
import { Mic } from 'lucide-react-native';
import { VoiceStatus } from '../hooks/useVoiceAssistant';

interface VoiceFloatingButtonProps {
  onPress: () => void;
  status?: VoiceStatus;
}

export function VoiceFloatingButton({ onPress, status = 'idle' }: VoiceFloatingButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'listening' || status === 'speaking') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status]);

  const getBackgroundColor = () => {
    switch (status) {
      case 'listening':
        return '#ef4444';
      case 'speaking':
        return '#10b981';
      case 'processing':
        return '#eab308';
      default:
        return '#6366f1';
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.glowRing,
          {
            transform: [{ scale: pulseAnim }],
            backgroundColor: getBackgroundColor(),
          },
        ]}
      />
      <TouchableOpacity
        onPress={onPress}
        style={[styles.fabBtn, { backgroundColor: getBackgroundColor() }]}
        activeOpacity={0.85}
      >
        <Mic size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    opacity: 0.35,
  },
  fabBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});
