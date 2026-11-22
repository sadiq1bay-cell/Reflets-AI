import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { EngineId } from '../src/utils/helyumeLogic';

let cachedAiClient: GoogleGenAI | null = null;
let cachedApiKey: string | undefined;

export function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY tanımlı değil. AI Studio Secrets veya Vercel Environment Variables panelinden ekleyin.'
    );
  }
  if (cachedAiClient && cachedApiKey === apiKey) {
    return cachedAiClient;
  }
  cachedApiKey = apiKey;
  cachedAiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return cachedAiClient;
}

export function getEngineConfig(engine: EngineId) {
  switch (engine) {
    case 'crush':
      return {
        model: 'gemini-3.1-flash-lite',
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          systemInstruction:
            'Sen Reflets Crush motorusun: ultra hızlı, keskin zekalı, doğrudan sonuca giden pratik bir yapay zeka asistanısın. ' +
            'Kullanıcının yazdığı dilde yanıt ver (varsayılan Türkçe). Gereksiz giriş cümlelerini atla, net ve yüksek doğruluklu cevaplar üret. ' +
            'Kod veya teknik adımlar gerektiğinde temiz Markdown ve kısa örnekler kullan.',
        },
      };
    case 'aura':
      return {
        model: 'gemini-4-hydrogen',
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          tools: [{ googleSearch: {} }],
          systemInstruction:
            'Sen Reflets Aura motorusun: güncel web bilgisiyle desteklenen, yaratıcı, dengeli ve yüksek zekalı bir yapay zeka asistanısın. ' +
            'Kullanıcının dilinde (varsayılan Türkçe) net, yapılandırılmış ve doğrulanabilir yanıtlar ver. ' +
            'Güncel olaylar, fiyatlar, sürümler veya gerçek dünya verileri sorulduğunda web aramasından yararlan.',
        },
      };
    case 'void':
    default:
      return {
        model: 'gemini-4-hydrogen',
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          systemInstruction:
            'Sen Reflets Void motorusun: karmaşık mühendislik, mimari, matematik, strateji ve derin analiz konularında uzman baş mühendis seviyesinde yapay zeka motorusun. ' +
            'Kullanıcının dilinde (varsayılan Türkçe) adım adım akıl yürütme, uç durumlar (edge cases), performans trade-off analizleri ve üretim kalitesinde çözümler sun.',
        },
      };
  }
}

export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message || 'Beklenmeyen bir sunucu hatası oluştu.';
    if (
      msg.includes('API_KEY_INVALID') ||
      msg.includes('PERMISSION_DENIED') ||
      msg.includes('API key not valid') ||
      msg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') ||
      msg.includes('UNAUTHENTICATED') ||
      msg.includes('"code":401') ||
      msg.includes('"code": 401')
    ) {
      return 'API anahtarı geçersiz veya desteklenmeyen formatta. Lütfen Secrets / Environment Variables panelinden AIza... ile başlayan geçerli bir Gemini API anahtarı girin.';
    }
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
      return 'Anlık istek kotası aşıldı. Birkaç saniye içinde tekrar deneyin.';
    }
    return msg;
  }
  return 'Yapay zeka yanıtı alınırken bir hata oluştu.';
}
