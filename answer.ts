import type { EngineId } from '../../src/utils/helyumeLogic';
import { extractErrorMessage, getAiClient, getEngineConfig } from '../_gemini';

export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();
  try {
    const { title, body, engine = 'aura' } = (await request.json()) as {
      title?: string;
      body?: string;
      engine?: EngineId;
    };

    if (!title?.trim()) {
      return Response.json({ error: 'Soru başlığı zorunludur.' }, { status: 400 });
    }

    const ai = getAiClient();
    const { model, config } = getEngineConfig(engine);
    const prompt = `Topluluk Sorusu: ${title.trim()}\n\nDetay: ${(body || '').trim() || 'Ek detay verilmedi.'}\n\nLütfen topluluk üyeleri için net, uygulanabilir ve özlü bir yanıt ver.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config,
    });

    return Response.json({
      answer: response.text || 'Yanıt üretilemedi.',
      answeredInMs: Date.now() - startedAt,
    });
  } catch (err) {
    return Response.json({ error: extractErrorMessage(err) }, { status: 500 });
  }
}
