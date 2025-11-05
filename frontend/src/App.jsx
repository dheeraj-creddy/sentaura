import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import AuraVisualization from './components/AuraVisualization';
import TranscriptDisplay from './components/TranscriptDisplay';
import KeywordsDisplay from './components/KeywordsDisplay';
import Controls from './components/Controls';
import './App.css';

const DEEPGRAM_API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [sentiment, setSentiment] = useState(0);
  const [emotion, setEmotion] = useState('neutral');
  const [intensity, setIntensity] = useState(0);
  const [valence, setValence] = useState(0);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const socketRef = useRef(null);
  const audioContextRef = useRef(null);

  const processText = async (text) => {
    if (isProcessing || text.length < 5) return;

    setIsProcessing(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/process_text`, {
        text: text
      }, {
        timeout: 10000 // 10 second timeout
      });

      const data = response.data;
      setSentiment(data.sentiment || 0);
      setEmotion(data.emotion || 'neutral');
      setKeywords(data.keywords || []);
      setIntensity(data.intensity || 0);
      setValence(data.valence || 0);
      setError(null);
    } catch (err) {
      console.error('Error processing text:', err);
      setError('Failed to analyze sentiment');
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create WebSocket connection to Deepgram
      const ws = new WebSocket('wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1', [
        'token',
        DEEPGRAM_API_KEY
      ]);

      ws.onopen = () => {
        console.log('Deepgram WebSocket connected');
        setIsRecording(true);
      };

      ws.onmessage = (message) => {
        const data = JSON.parse(message.data);
        const transcriptData = data.channel?.alternatives?.[0];

        if (transcriptData?.transcript) {
          const text = transcriptData.transcript;
          const isFinal = data.is_final;

          setTranscript(prev => {
            const newTranscript = [...prev];
            if (isFinal) {
              newTranscript.push({ text, isFinal: true, timestamp: Date.now() });
              // Process final transcript through AI
              processText(text);
            } else {
              // Update last interim result
              if (newTranscript.length > 0 && !newTranscript[newTranscript.length - 1].isFinal) {
                newTranscript[newTranscript.length - 1] = { text, isFinal: false, timestamp: Date.now() };
              } else {
                newTranscript.push({ text, isFinal: false, timestamp: Date.now() });
              }
            }
            return newTranscript;
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error with transcription service');
      };

      ws.onclose = () => {
        console.log('Deepgram WebSocket closed');
      };

      socketRef.current = ws;

      // Set up audio processing
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcm16[i] = Math.max(-32768, Math.min(32767, Math.floor(inputData[i] * 32768)));
          }
          ws.send(pcm16.buffer);
        }
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      mediaRecorderRef.current = { stream, processor, source };

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please grant permission.');
    }
  };

  const stopRecording = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    if (mediaRecorderRef.current) {
      const { stream, processor, source } = mediaRecorderRef.current;

      if (processor) {
        processor.disconnect();
        source.disconnect();
      }

      stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const clearTranscript = () => {
    setTranscript([]);
    setKeywords([]);
    setSentiment(0);
    setEmotion('neutral');
    setIntensity(0);
    setValence(0);
  };

  return (
    <div className="app">
      <AuraVisualization
        sentiment={sentiment}
        emotion={emotion}
        intensity={intensity}
        valence={valence}
        keywords={keywords}
      />

      <div className="overlay">
        <h1 className="title">Sentiment Aura</h1>

        <Controls
          isRecording={isRecording}
          onToggle={toggleRecording}
          onClear={clearTranscript}
          isProcessing={isProcessing}
        />

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <TranscriptDisplay transcript={transcript} />

        <KeywordsDisplay keywords={keywords} emotion={emotion} />
      </div>
    </div>
  );
}

export default App;