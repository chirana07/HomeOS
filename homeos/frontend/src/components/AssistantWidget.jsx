import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, Bot } from 'lucide-react';
import { chatWithAssistantVoice } from '../services/api';

export default function AssistantWidget() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    // Create an audio element for playback
    audioPlayerRef.current = new Audio();
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const actualType = mediaRecorder.mimeType || mimeType || 'audio/mp4';
        const blob = new Blob(audioChunksRef.current, { type: actualType });
        stream.getTracks().forEach(track => track.stop());
        
        processAudio(blob, actualType);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError('');
      
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    } catch (err) {
      setError('Microphone access denied or not available.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob, mimeType) => {
    setIsProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      const extension = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'm4a' : 'wav';
      formData.append('file', blob, `voice_query.${extension}`);
      
      const audioBlobResponse = await chatWithAssistantVoice(formData);
      
      if (audioPlayerRef.current) {
        const audioUrl = URL.createObjectURL(audioBlobResponse);
        audioPlayerRef.current.src = audioUrl;
        audioPlayerRef.current.play();
      }
    } catch (err) {
      setError(err.message || 'Failed to get a response.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {error && (
        <div className="bg-rose-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-lg shadow-rose-500/20 max-w-[200px] text-center animate-in fade-in slide-in-from-bottom-2">
          {error}
        </div>
      )}
      
      <button
        onClick={toggleRecording}
        disabled={isProcessing}
        className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300
          ${isProcessing ? 'bg-slate-700 cursor-not-allowed scale-95' 
          : isRecording ? 'bg-rose-500 hover:bg-rose-600 animate-pulse' 
          : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105 shadow-indigo-500/30'}
        `}
      >
        {isProcessing ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : isRecording ? (
          <Square className="w-5 h-5 text-white fill-current" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
        
        {/* Decorative ring when idle */}
        {!isRecording && !isProcessing && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 border-2 border-[#0b0f19]"></span>
          </span>
        )}
      </button>
    </div>
  );
}
