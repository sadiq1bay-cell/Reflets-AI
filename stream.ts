import type { EngineId, GroundingSource } from '../../src/utils/helyumeLogic';
import { extractErrorMessage, getAiClient, getEngineConfig } from '../_gemini';

export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();
  const encoder = new TextEncoder();

  let body: {
    engine?: EngineId;
    contents?: Array<{ role: 'user' | 'model'; parts: unknown[] }>;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(
      `data: ${JSON.stringify({ type: 'error', message: 'Geçersiz JSON isteği.' })}\n\n`,
      {
        status: 400,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      }
    );
  }

  const { engine = 'crush', contents } = body;

  const stream = new ReadableStream({
    async start(controller) {
      const writeEvent = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        if (!Array.isArray(contents) || contents.length === 0) {
          writeEvent({ type: 'error', message: 'Mesaj içeriği boş olamaz.' });
          controller.close();
          return;
        }

        const ai = getAiClient();
        const { model, config } = getEngineConfig(engine);

        const aiStream = await ai.models.generateContentStream({
          model,
          contents: contents as never,
          config,
        });

        let firstTokenSent = false;
        const seenSources = new Map<string, GroundingSource>();

        for await (const chunk of aiStream) {
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
                seenSources.set(uri, { uri, title: title || uri });
              }
            }
          }
        }

        if (seenSources.size > 0) {
          writeEvent({
            type: 'sources',
            sources: Array.from(seenSources.values()).slice(0, 5),
          });
        }

        writeEvent({
          type: 'done',
          elapsedMs: Date.now() - startedAt,
        });
      } catch (err) {
        writeEvent({ type: 'error', message: extractErrorMessage(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
