export type EngineId = 'crush' | 'aura' | 'void';

export type AppView = 'home' | 'chat' | 'community' | 'auth';

export interface EngineSpec {
  id: EngineId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  speedLabel: string;
  badgeText: string;
}

export const ENGINES: Record<EngineId, EngineSpec> = {
  crush: {
    id: 'crush',
    name: 'Reflets Crush',
    shortName: 'Crush',
    tagline: '1 sn altı anında yanıt',
    description: 'Anında hız, net özetler ve doğrudan çözüm odaklı pratik yanıtlar',
    speedLabel: '< 1 sn',
    badgeText: 'Ultra Hızlı',
  },
  aura: {
    id: 'aura',
    name: 'Reflets Aura',
    shortName: 'Aura',
    tagline: 'Web bağlantılı dengeli zeka',
    description: 'Günlük sohbet, planlama, güncel web araması ve yaratıcı fikirlerde dengeli akıl yürütme',
    speedLabel: '1–2 sn',
    badgeText: 'Web + Dengeli',
  },
  void: {
    id: 'void',
    name: 'Reflets Void',
    shortName: 'Void',
    tagline: 'Derin analiz ve teknik zeka',
    description: 'Karmaşık teknik sorular, derin analiz ve kapsamlı stratejik çözümleme',
    speedLabel: 'Derin Akıl',
    badgeText: 'Derin Analiz',
  },
};

export interface ChatAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataBase64: string;
  previewUrl?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  engine: EngineId;
  createdAt: number;
  ttftMs?: number;
  elapsedMs?: number;
  attachments?: ChatAttachment[];
  sources?: GroundingSource[];
  isError?: boolean;
}

export interface ChatThread {
  id: string;
  title: string;
  engine: EngineId;
  messages: ChatMessage[];
  updatedAt: number;
}

export interface CommunityQuestion {
  id: string;
  title: string;
  body: string;
  author: string;
  engine: EngineId;
  category: 'Genel' | 'Kod & Mimari' | 'Görsel & Video' | 'Araştırma';
  votes: number;
  hasVoted?: boolean;
  answer: string;
  answeredInMs: number;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  preferredEngine: EngineId;
  signedInAt: number;
}

export const INITIAL_COMMUNITY_QUESTIONS: CommunityQuestion[] = [
  {
    id: 'cq-1',
    title: 'React 19 uygulamasında ilk token gecikmesini (TTFT) 1 saniyenin altına nasıl düşürürüm?',
    body: 'Yapay zeka sohbet arayüzümde kullanıcı mesaj gönderdikten sonra ilk kelimenin ekranda görünmesi 3 saniyeyi geçiyor. SSE streaming ve doğru model seçimi nasıl kurgulanmalı?',
    author: 'Emre Kaya',
    engine: 'crush',
    category: 'Kod & Mimari',
    votes: 42,
    answer:
      'İlk token süresini 1 saniyenin altına indirmek için üç katmanı optimize etmelisiniz:\n\n1. **SSE Akışını Anında Başlatın**: Sunucuda `res.flushHeaders()` çağrısını `generateContentStream` döngüsünden hemen önce yapın ve `X-Accel-Buffering: no` başlığını ekleyin.\n2. **Düşük Gecikmeli Düşünme Seviyesi**: Günlük hızlı sorularda Crush motorunun kullandığı minimal düşünme derinliğini tercih edin; böylece model ön düşünme bekletmesi yapmadan doğrudan ilk tokeni üretir.\n3. **İstemci Tarafı İyimser Güncelleme**: Kullanıcı mesajını ve boş asistan yer tutucusunu `fetch` isteğinden önce state içine yazın.',
    answeredInMs: 640,
    createdAt: 'Bugün · 14:20',
  },
  {
    id: 'cq-2',
    title: 'Görsel ve video dosyalarını tek bir çok modlu sohbette analiz ettirmek mümkün mü?',
    body: 'Ürün arayüzü ekran görüntüsü veya kısa bir demo videosu yükleyip UX hatalarını madde madde çıkarmak istiyorum.',
    author: 'Selin Demir',
    engine: 'aura',
    category: 'Görsel & Video',
    votes: 29,
    answer:
      'Evet! Reflets sohbet kutusundaki **Görsel / Video** düğmesi üzerinden PNG, JPEG, WebP görsellerini veya MP4/WebM kısa videoları doğrudan yükleyebilirsiniz. Model hem görsel hiyerarşiyi hem de videodaki zaman akışını inceleyip somut iyileştirme listesi üretir.',
    answeredInMs: 910,
    createdAt: 'Dün · 19:05',
  },
  {
    id: 'cq-3',
    title: 'Dağıtık sistemlerde idempotency anahtarı neden gereklidir ve nasıl tasarlanır?',
    body: 'Ödeme ve webhook uç noktalarında aynı isteğin iki kez işlenmesini önlemek için en sağlam Redis + PostgreSQL deseni hangisidir?',
    author: 'Kerem Arslan',
    engine: 'void',
    category: 'Kod & Mimari',
    votes: 37,
    answer:
      'Ağ kopmaları nedeniyle istemci aynı `POST` isteğini tekrar gönderdiğinde çift işlem oluşmasını engellemek için **Idempotency-Key** başlığı kullanılır.\n\n- İstek başladığında anahtarı atomik olarak `IN_PROGRESS` durumuyla kilitleyin (`SET key value NX EX 60`).\n- İstek gövdesinin SHA-256 özetini saklayarak aynı anahtarın farklı payload ile yeniden kullanılmasını `409 Conflict` ile reddedin.\n- İşlem tamamlandığında yanıt gövdesini ve HTTP durum kodunu kalıcı veritabanına yazıp sonraki tekrarlarda aynı sonucu dönün.',
    answeredInMs: 1450,
    createdAt: '2 gün önce',
  },
];

export function formatLatencySeconds(ms?: number): string {
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) {
    return '0.4 sn';
  }
  const seconds = Math.max(0.1, ms / 1000);
  return `${seconds.toFixed(1)} sn`;
}

export function deriveThreadTitle(rawText: string, hasAttachments = false): string {
  const cleaned = rawText.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return hasAttachments ? 'Medya Analizi' : 'Yeni Sohbet';
  }
  if (cleaned.length <= 34) {
    return cleaned;
  }
  return `${cleaned.slice(0, 31).trimEnd()}...`;
}

export interface GeminiHistoryTurn {
  role: 'user' | 'model';
  parts: Array<
    | { text: string }
    | { inlineData: { data: string; mimeType: string } }
  >;
}

export function buildGeminiHistory(messages: ChatMessage[]): GeminiHistoryTurn[] {
  const turns: GeminiHistoryTurn[] = [];
  for (const msg of messages) {
    if (msg.isError) continue;
    const parts: GeminiHistoryTurn['parts'] = [];
    if (msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        if (att.dataBase64 && att.mimeType) {
          parts.push({
            inlineData: {
              data: att.dataBase64,
              mimeType: att.mimeType,
            },
          });
        }
      }
    }
    const text = msg.content.trim();
    if (text) {
      parts.push({ text });
    }
    if (parts.length > 0) {
      turns.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts,
      });
    }
  }
  return turns;
}

export function filterCommunityQuestions(
  questions: CommunityQuestion[],
  searchQuery: string,
  categoryFilter: string
): CommunityQuestion[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  return questions.filter((item) => {
    const matchesCategory =
      categoryFilter === 'Tümü' ||
      item.category === categoryFilter ||
      ENGINES[item.engine].shortName === categoryFilter;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;
    return (
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.body.toLowerCase().includes(normalizedQuery) ||
      item.answer.toLowerCase().includes(normalizedQuery) ||
      item.author.toLowerCase().includes(normalizedQuery)
    );
  });
}

export interface AuthValidationResult {
  valid: boolean;
  errors: {
    name?: string;
    email?: string;
    password?: string;
  };
}

export function validateAuthForm(
  mode: 'login' | 'register',
  email: string,
  password: string,
  name = ''
): AuthValidationResult {
  const errors: AuthValidationResult['errors'] = {};
  const trimmedEmail = email.trim();
  const trimmedName = name.trim();

  if (mode === 'register' && trimmedName.length < 2) {
    errors.name = 'Ad Soyad en az 2 karakter olmalıdır.';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!trimmedEmail) {
    errors.email = 'E-posta adresi zorunludur.';
  } else if (!emailPattern.test(trimmedEmail)) {
    errors.email = 'Geçerli bir e-posta adresi girin.';
  }

  if (!password) {
    errors.password = 'Şifre zorunludur.';
  } else if (password.length < 6) {
    errors.password = 'Şifre en az 6 karakter olmalıdır.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export type MarkdownBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; language: string; code: string };

export function parseMarkdownBlocks(raw: string): MarkdownBlock[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    const fenceMatch = line.match(/^```([\w+-]*)\s*$/);
    if (fenceMatch) {
      const language = fenceMatch[1] || 'text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].startsWith('```')) {
        i++;
      }
      blocks.push({ type: 'code', language, code: codeLines.join('\n') });
      continue;
    }

    // Blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3;
      blocks.push({ type: 'heading', level, text: headingMatch[2].trim() });
      i++;
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, '').trim());
        i++;
      }
      blocks.push({ type: 'list', ordered: false, items });
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, '').trim());
        i++;
      }
      blocks.push({ type: 'list', ordered: true, items });
      continue;
    }

    // Paragraph (coalesce consecutive plain lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('```') &&
      !/^#{1,3}\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'paragraph', text: paraLines.join('\n') });
  }

  return blocks;
}
