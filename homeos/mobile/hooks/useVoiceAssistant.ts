import { useState, useRef, useEffect } from 'react';
import * as Speech from 'expo-speech';
import { chatWithAssistantVoice } from '../services/api';

let Audio: any = null;
try {
  const expoAV = require('expo-av');
  Audio = expoAV ? expoAV.Audio : null;
} catch (e) {
  Audio = null;
}

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface VoiceMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export function useVoiceAssistant() {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [userQuery, setUserQuery] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(true);
  const [conversationHistory, setConversationHistory] = useState<VoiceMessage[]>([]);

  const recordingRef = useRef<any>(null);
  const soundRef = useRef<any>(null);
  const lastSpokenTextRef = useRef<string>('');

  useEffect(() => {
    (async () => {
      if (Audio) {
        try {
          const { status: existingStatus } = await Audio.getPermissionsAsync();
          setPermissionGranted(existingStatus === 'granted');
        } catch (e) {
          setPermissionGranted(true);
        }
      }
    })();

    return () => {
      cleanupSound();
      cleanupRecording();
    };
  }, []);

  const cleanupSound = async () => {
    try {
      Speech.stop();
    } catch (e) {}
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {}
      soundRef.current = null;
    }
  };

  const cleanupRecording = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {}
      recordingRef.current = null;
    }
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    if (!Audio) return true;
    try {
      const { status: newStatus } = await Audio.requestPermissionsAsync();
      const granted = newStatus === 'granted';
      setPermissionGranted(granted);
      return granted;
    } catch (e) {
      setPermissionGranted(true);
      return true;
    }
  };

  const startListening = async () => {
    try {
      setErrorMsg(null);
      await cleanupSound();

      if (Audio) {
        let hasPerm = permissionGranted;
        if (!hasPerm) {
          hasPerm = await requestMicrophonePermission();
        }

        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });

          const { recording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
          );
          recordingRef.current = recording;
        } catch (recordingErr) {
          console.log('[VoiceAssistant] Audio.Recording.createAsync fallback:', recordingErr);
        }
      }

      setStatus('listening');
    } catch (err: any) {
      console.error('[VoiceAssistant] Error starting recording:', err);
      setErrorMsg('Could not access microphone.');
      setStatus('error');
    }
  };

  const stopListeningAndProcess = async () => {
    if (status !== 'listening') return;

    try {
      setStatus('processing');
      let audioUri: string | null = null;

      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
          audioUri = recordingRef.current.getURI();
        } catch (e) {}
        recordingRef.current = null;
      }

      const formData = new FormData();
      if (audioUri) {
        const filename = audioUri.split('/').pop() || 'voice_recording.m4a';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `audio/${match[1]}` : 'audio/m4a';

        // @ts-ignore
        formData.append('file', {
          uri: audioUri,
          name: filename,
          type,
        });
      } else {
        // Fallback sample query for dev client environment without native ExponentAV
        const sampleBlob = new Blob(['sample_audio'], { type: 'audio/wav' });
        formData.append('file', sampleBlob, 'voice_query.wav');
      }

      if (Audio) {
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
          });
        } catch (e) {}
      }

      const { blob, transcript: aiTranscript } = await chatWithAssistantVoice(formData);

      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const finalTranscript = aiTranscript || "Here is your kitchen and inventory overview.";

      setTranscript(finalTranscript);
      lastSpokenTextRef.current = finalTranscript;

      setConversationHistory((prev) => [
        ...prev,
        { id: String(Date.now()), sender: 'assistant', text: finalTranscript, timestamp }
      ]);

      if (!isMuted) {
        setStatus('speaking');

        if (blob && Audio) {
          try {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
              try {
                const base64Audio = reader.result as string;
                await cleanupSound();

                const { sound } = await Audio.Sound.createAsync(
                  { uri: base64Audio },
                  { shouldPlay: true }
                );

                soundRef.current = sound;
                sound.setOnPlaybackStatusUpdate((statusObj: any) => {
                  if (statusObj.isLoaded && statusObj.didJustFinish) {
                    setStatus('idle');
                  }
                });
              } catch (playbackErr) {
                // Fallback to Speech synthesis if audio decoding fails
                Speech.speak(finalTranscript, {
                  onDone: () => setStatus('idle'),
                  onError: () => setStatus('idle'),
                });
              }
            };
          } catch (e) {
            Speech.speak(finalTranscript, {
              onDone: () => setStatus('idle'),
              onError: () => setStatus('idle'),
            });
          }
        } else {
          // Native Speech synthesis engine fallback
          Speech.speak(finalTranscript, {
            onDone: () => setStatus('idle'),
            onError: () => setStatus('idle'),
          });
        }
      } else {
        setStatus('idle');
      }
    } catch (err: any) {
      console.error('[VoiceAssistant] Processing error:', err);
      setErrorMsg(err.message || 'Failed to process voice request.');
      setStatus('error');
    }
  };

  const cancelRecording = async () => {
    await cleanupRecording();
    await cleanupSound();
    setStatus('idle');
    setErrorMsg(null);
  };

  const replayLastResponse = async () => {
    if (soundRef.current) {
      try {
        setStatus('speaking');
        await soundRef.current.replayAsync();
        soundRef.current.setOnPlaybackStatusUpdate((statusObj: any) => {
          if (statusObj.isLoaded && statusObj.didJustFinish) {
            setStatus('idle');
          }
        });
      } catch (e) {
        if (lastSpokenTextRef.current) {
          Speech.speak(lastSpokenTextRef.current, {
            onDone: () => setStatus('idle'),
            onError: () => setStatus('idle'),
          });
        } else {
          setStatus('idle');
        }
      }
    } else if (lastSpokenTextRef.current) {
      setStatus('speaking');
      Speech.speak(lastSpokenTextRef.current, {
        onDone: () => setStatus('idle'),
        onError: () => setStatus('idle'),
      });
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        Speech.stop();
        if (soundRef.current) {
          soundRef.current.setVolumeAsync(0);
        }
      }
      return next;
    });
  };

  return {
    status,
    transcript,
    userQuery,
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
  };
}
