import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Send, Video, X } from 'lucide-react';
import { HelyumeLogo } from './HelyumeLogo';

interface LiveAssistantModalProps {
  open: boolean;
  onClose: () => void;
}

interface LiveTranscriptItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const VOICES = ['Zephyr', 'Puck', 'Kore', 'Fenrir', 'Charon'] as const;

function pcmFloatToBase64(float32: Float32Array): string {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64PcmToFloat32(base64: string): Float32Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const arrayBuffer = new ArrayBuffer(int16.length * 4);
  const float32 = new Float32Array(arrayBuffer);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 0x8000;
  }
  return float32;
}

export const LiveAssistantModal: React.FC<LiveAssistantModalProps> = ({ open, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [voice, setVoice] = useState<(typeof VOICES)[number]>('Zephyr');
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [transcripts, setTranscripts] = useState<LiveTranscriptItem[]>([]);
  const [liveTextInput, setLiveTextInput] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const micEnabledRef = useRef(micEnabled);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoIntervalRef = useRef<number | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    micEnabledRef.current = micEnabled;
  }, [micEnabled]);

  const stopSession = () => {
    if (videoIntervalRef.current) {
      window.clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
      } catch {
        // Ignore already stopped sources
      }
    }
    activeSourcesRef.current.clear();

    try {
      processorRef.current?.disconnect();
    } catch {
      // Ignore
    }
    processorRef.current = null;

    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }

    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // Ignore
      }
      wsRef.current = null;
    }
    nextStartTimeRef.current = 0;
    setStatus('idle');
  };

  useEffect(() => {
    if (!open) {
      stopSession();
    }
    return () => {
      stopSession();
    };
  }, [open]);

  const appendTranscript = (role: 'user' | 'assistant', chunk: string) => {
    setTranscripts((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role) {
        return [...prev.slice(0, -1), { ...last, text: `${last.text}${chunk}` }];
      }
      return [...prev, { id: `${Date.now()}-${Math.random()}`, role, text: chunk }];
    });
  };

  const playPcmChunk = (base64: string) => {
    const ctx = outputAudioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const samples = base64PcmToFloat32(base64);
    const buffer = ctx.createBuffer(1, samples.length, 24000);
    buffer.copyToChannel(samples, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now, nextStartTimeRef.current);
    source.start(startAt);
    nextStartTimeRef.current = startAt + buffer.duration;

    activeSourcesRef.current.add(source);
    source.onended = () => {
      activeSourcesRef.current.delete(source);
    };
  };

  const startSession = async () => {
    stopSession();
    setErrorMsg(null);
    setStatus('connecting');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/live?voice=${encodeURIComponent(voice)}`);
      wsRef.current = ws;

      outputAudioCtxRef.current = new AudioContext({ sampleRate: 24000 });

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data) as {
          type?: string;
          data?: string;
          text?: string;
          message?: string;
        };
        if (msg.type === 'ready') {
          setStatus('connected');
        } else if (msg.type === 'audio' && msg.data) {
          playPcmChunk(msg.data);
        } else if (msg.type === 'inputTranscript' && msg.text) {
          appendTranscript('user', msg.text);
        } else if (msg.type === 'outputTranscript' && msg.text) {
          appendTranscript('assistant', msg.text);
        } else if (msg.type === 'interrupted') {
          for (const src of activeSourcesRef.current) {
            try {
              src.stop();
            } catch {
              // Ignore
            }
          }
          activeSourcesRef.current.clear();
          nextStartTimeRef.current = 0;
        } else if (msg.type === 'error') {
          setErrorMsg(msg.message || 'Canlı bağlantı hatası oluştu.');
          setStatus('error');
        }
      };

      ws.onerror = () => {
        setErrorMsg(
          'Canlı WebSocket bağlantısı kurulamadı. Serverless barındırmada (örn. Vercel) canlı ses akışı yerine sohbet ve görsel/video analizi tam hızda çalışır.'
        );
        setStatus('error');
      };

      ws.onclose = () => {
        setStatus((prev) => (prev === 'error' ? 'error' : 'idle'));
      };

      // Capture microphone and optional camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: cameraEnabled,
        });
        mediaStreamRef.current = stream;

        if (cameraEnabled && videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});

          const canvas = document.createElement('canvas');
          canvas.width = 480;
          canvas.height = 360;
          videoIntervalRef.current = window.setInterval(() => {
            if (!videoRef.current || wsRef.current?.readyState !== WebSocket.OPEN) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            const base64 = dataUrl.split(',')[1];
            if (base64) {
              wsRef.current.send(JSON.stringify({ type: 'video', data: base64 }));
            }
          }, 1000);
        }

        const inputCtx = new AudioContext({ sampleRate: 16000 });
        inputAudioCtxRef.current = inputCtx;
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (!micEnabledRef.current || wsRef.current?.readyState !== WebSocket.OPEN) return;
          const base64 = pcmFloatToBase64(e.inputBuffer.getChannelData(0));
          wsRef.current.send(JSON.stringify({ type: 'audio', data: base64 }));
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      } catch {
        setErrorMsg(
          'Mikrofon veya kamera izni alınamadı. Aşağıdaki metin alanından canlı oturuma yazabilirsiniz.'
        );
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Canlı asistan başlatılamadı.');
      setStatus('error');
    }
  };

  const handleSendLiveText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveTextInput.trim() || wsRef.current?.readyState !== WebSocket.OPEN) return;
    const text = liveTextInput.trim();
    setLiveTextInput('');
    appendTranscript('user', `${text}\n`);
    wsRef.current.send(JSON.stringify({ type: 'text', text }));
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0e071a] shadow-2xl shadow-fuchsia-950/50">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <HelyumeLogo size={26} />
            <div>
              <h2 id="live-modal-title" className="font-display text-base font-bold text-white">
                Canlı Asistan
              </h2>
              <p className="text-xs text-slate-400">
                Gerçek zamanlı sesli ve kameralı Reflets oturumu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Canlı asistanı kapat"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-3">
              <label htmlFor="live-voice-select" className="text-xs font-medium text-slate-300">
                Ses Tonu
              </label>
              <select
                id="live-voice-select"
                value={voice}
                disabled={status === 'connected' || status === 'connecting'}
                onChange={(e) => setVoice(e.target.value as (typeof VOICES)[number])}
                className="rounded-lg border border-white/15 bg-[#150c25] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              >
                {VOICES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Durum:</span>
              <span className="font-medium text-fuchsia-300">
                {status === 'idle' && 'Hazır'}
                {status === 'connecting' && 'Bağlanıyor...'}
                {status === 'connected' && 'Canlı Aktif'}
                {status === 'error' && 'Bağlantı Sorunu'}
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-amber-500/35 bg-amber-950/30 px-4 py-3 text-xs text-amber-200">
              {errorMsg}
            </div>
          )}

          {cameraEnabled && (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
              <video
                ref={videoRef}
                muted
                playsInline
                className="h-48 w-full object-cover"
              />
            </div>
          )}

          <div className="min-h-[180px] max-h-[260px] space-y-2.5 overflow-y-auto rounded-xl border border-white/10 bg-[#080410] p-4">
            {transcripts.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center text-center text-xs text-slate-500">
                <Video className="mb-2 h-6 w-6 text-fuchsia-400/70" />
                <p>
                  &ldquo;Oturumu Başlat&rdquo; düğmesine basarak gerçek zamanlı sesli veya kameralı
                  konuşmaya başlayın.
                </p>
              </div>
            ) : (
              transcripts.map((item) => (
                <div
                  key={item.id}
                  className={`text-sm ${
                    item.role === 'user' ? 'text-slate-300' : 'text-fuchsia-200'
                  }`}
                >
                  <span className="font-semibold text-white">
                    {item.role === 'user' ? 'Siz: ' : 'Reflets: '}
                  </span>
                  <span>{item.text}</span>
                </div>
              ))
            )}
          </div>

          {status === 'connected' && (
            <form onSubmit={handleSendLiveText} className="flex items-center gap-2">
              <label htmlFor="live-text-input" className="sr-only">
                Canlı oturuma metin gönder
              </label>
              <input
                id="live-text-input"
                type="text"
                value={liveTextInput}
                onChange={(e) => setLiveTextInput(e.target.value)}
                placeholder="Mikrofon yerine yazılı mesaj gönderin..."
                className="flex-1 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-500 focus:outline-none"
              />
              <button
                type="submit"
                className="helyume-gradient-btn inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Gönder</span>
              </button>
            </form>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/[0.02] px-5 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMicEnabled((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                micEnabled
                  ? 'border-white/15 bg-white/[0.05] text-white'
                  : 'border-rose-500/40 bg-rose-500/15 text-rose-200'
              }`}
            >
              {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              <span>{micEnabled ? 'Mikrofon Açık' : 'Mikrofon Kapalı'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCameraEnabled((prev) => !prev)}
              disabled={status === 'connected'}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                cameraEnabled
                  ? 'border-fuchsia-500/40 bg-fuchsia-500/20 text-fuchsia-100'
                  : 'border-white/15 bg-white/[0.05] text-slate-300'
              } disabled:opacity-50`}
            >
              {cameraEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
              <span>{cameraEnabled ? 'Kamera Açık' : 'Kamera Kapalı'}</span>
            </button>
          </div>

          {status === 'connected' || status === 'connecting' ? (
            <button
              type="button"
              onClick={stopSession}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-600/25 px-5 py-2 text-xs font-semibold text-rose-100 hover:bg-rose-600/40"
            >
              <PhoneOff className="h-4 w-4" />
              <span>Oturumu Bitir</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startSession}
              className="helyume-gradient-btn inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-fuchsia-950/50"
            >
              <Mic className="h-4 w-4" />
              <span>Oturumu Başlat</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
