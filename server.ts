import 'dotenv/config';
import http from 'http';
import path from 'path';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import type { EngineId, GroundingSource } from './src/utils/helyumeLogic';
import { extractErrorMessage, getAiClient, getEngineConfig } from './api/_gemini';

const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, hasKey: Boolean(process.env.GEMINI_API_KEY) });
  });

  app.post('/api/chat/stream', async (req, res) => {
    const startedAt = Date.now();
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const writeEvent = (payload: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      const { engine = 'crush', contents } = req.body as {
        engine?: EngineId;
        contents?: Array<{ role: 'user' | 'model'; parts: unknown[] }>;
      };

      if (!Array.isArray(contents) || contents.length === 0) {
        writeEvent({ type: 'error', message: 'Mesaj içeriği boş olamaz.' });
        res.end();
        return;
      }

      const ai = getAiClient();
      const { model, config } = getEngineConfig(engine);

      const stream = await ai.models.generateContentStream({
        model,
        contents: contents as never,
        config,
      });

      let firstTokenSent = false;
      const seenSources = new Map<string, GroundingSource>();

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          if (!firstTokenSent) {
            firstTokenSent = true;
            writeEvent({ type: 'ttft', ttftMs: Date.now() - startedAt });
          }
          writeEvent({ type: 'delta', text });
        }

        const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (Array.isArray(groundingChunks)) {
          for (const gChunk of groundingChunks) {
            const uri = gChunk?.web?.uri;
            const title = gChunk?.web?.title;
            if (uri && !seenSources.has(uri)) {
              seenSources.set(uri, {
                uri,
                title: title || uri,
              });
            }
          }
        }
      }

      if (seenSources.size > 0) {
        writeEvent({ type: 'sources', sources: Array.from(seenSources.values()).slice(0, 5) });
      }

      writeEvent({
        type: 'done',
        elapsedMs: Date.now() - startedAt,
      });
      res.end();
    } catch (err) {
      writeEvent({ type: 'error', message: extractErrorMessage(err) });
      res.end();
    }
  });

  app.post('/api/community/answer', async (req, res) => {
    const startedAt = Date.now();
    try {
      const { title, body, engine = 'aura' } = req.body as {
        title?: string;
        body?: string;
        engine?: EngineId;
      };

      if (!title?.trim()) {
        res.status(400).json({ error: 'Soru başlığı zorunludur.' });
        return;
      }

      const ai = getAiClient();
      const { model, config } = getEngineConfig(engine);
      const prompt = `Topluluk Sorusu: ${title.trim()}\n\nDetay: ${(body || '').trim() || 'Ek detay verilmedi.'}\n\nLütfen topluluk üyeleri için net, uygulanabilir ve özlü bir yanıt ver.`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });

      res.json({
        answer: response.text || 'Yanıt üretilemedi.',
        answeredInMs: Date.now() - startedAt,
      });
    } catch (err) {
      res.status(500).json({ error: extractErrorMessage(err) });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/live' });

  wss.on('connection', async (clientWs: WebSocket, req) => {
    const url = new URL(req.url || '/live', `http://${req.headers.host || 'localhost'}`);
    const voiceName = url.searchParams.get('voice') || 'Zephyr';

    let liveSession: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null = null;
    let isClosed = false;

    try {
      const ai = getAiClient();
      liveSession = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName,
              },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction:
            'Sen Reflets Canlı Asistanısın. Gerçek zamanlı ses ve kamera akışı üzerinden kullanıcıyla doğal, hızlı ve akıcı Türkçe konuş. Yanıtlarını kısa, net ve konuşma diline uygun tut.',
        },
        callbacks: {
          onopen: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'ready' }));
            }
          },
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;
            const content = message.serverContent;

            if (content?.inputTranscription?.text) {
              clientWs.send(
                JSON.stringify({ type: 'inputTranscript', text: content.inputTranscription.text })
              );
            }
            if (content?.outputTranscription?.text) {
              clientWs.send(
                JSON.stringify({ type: 'outputTranscript', text: content.outputTranscription.text })
              );
            }
            for (const part of content?.modelTurn?.parts ?? []) {
              if (part.inlineData?.data) {
                clientWs.send(JSON.stringify({ type: 'audio', data: part.inlineData.data }));
              }
            }
            if (content?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }
            if (content?.turnComplete) {
              clientWs.send(JSON.stringify({ type: 'turnComplete' }));
            }
          },
          onerror: (err: unknown) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'error', message: extractErrorMessage(err) }));
            }
          },
          onclose: () => {
            if (!isClosed && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'closed' }));
            }
          },
        },
      });
    } catch (err) {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'error', message: extractErrorMessage(err) }));
        clientWs.close();
      }
      return;
    }

    clientWs.on('message', (raw) => {
      if (!liveSession || isClosed) return;
      try {
        const msg = JSON.parse(raw.toString()) as {
          type?: 'audio' | 'video' | 'text';
          data?: string;
          text?: string;
        };
        if (msg.type === 'audio' && msg.data) {
          liveSession.sendRealtimeInput({
            audio: { data: msg.data, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (msg.type === 'video' && msg.data) {
          liveSession.sendRealtimeInput({
            video: { data: msg.data, mimeType: 'image/jpeg' },
          });
        } else if (msg.type === 'text' && msg.text) {
          liveSession.sendRealtimeInput({ text: msg.text });
        }
      } catch {
        // Ignore malformed client frames
      }
    });

    clientWs.on('close', () => {
      isClosed = true;
      try {
        liveSession?.close();
      } catch {
        // Ignore cleanup errors
      }
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Reflets server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
