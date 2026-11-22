import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  Cpu,
  ExternalLink,
  Flame,
  Image as ImageIcon,
  Mic,
  Paperclip,
  RefreshCw,
  Sparkles,
  Square,
  Video,
  X,
} from 'lucide-react';
import {
  ENGINES,
  formatLatencySeconds,
  type ChatAttachment,
  type ChatMessage,
  type EngineId,
} from '../utils/helyumeLogic';
import { HelyumeLogo } from './HelyumeLogo';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatViewProps {
  messages: ChatMessage[];
  selectedEngine: EngineId;
  onSelectEngine: (engine: EngineId) => void;
  isStreaming: boolean;
  onSendMessage: (text: string, attachments: ChatAttachment[]) => void;
  onStopStreaming: () => void;
  onRetryLast: () => void;
  onOpenLive: () => void;
}

const QUICK_PROMPTS: Array<{ title: string; prompt: string; engine: EngineId }> = [
  {
    title: '1 saniyede net özet',
    prompt: 'Kuantum bilgisayarların çalışma mantığını 3 net maddede açıkla.',
    engine: 'crush',
  },
  {
    title: 'Güncel web araştırması',
    prompt: '2026 yılında öne çıkan en verimli web geliştirme yaklaşımları nelerdir?',
    engine: 'aura',
  },
  {
    title: 'Derin kod ve mimari',
    prompt: 'Yüksek trafikli bir sohbet servisi için Node.js + SSE geri basınç (backpressure) stratejisi tasarla.',
    engine: 'void',
  },
  {
    title: 'Hızlı algoritma çözümü',
    prompt: 'TypeScript ile LRU Cache sınıfını O(1) karmaşıklıkta yaz ve açıkla.',
    engine: 'crush',
  },
];

function EngineIcon({ engine, className = 'h-4 w-4' }: { engine: EngineId; className?: string }) {
  if (engine === 'crush') return <Flame className={className} />;
  if (engine === 'aura') return <Sparkles className={className} />;
  return <Cpu className={className} />;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  selectedEngine,
  onSelectEngine,
  isStreaming,
  onSendMessage,
  onStopStreaming,
  onRetryLast,
  onOpenLive,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setModuleMenuOpen(false);
      }
    };
    if (moduleMenuOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [moduleMenuOpen]);

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const nextAttachments: ChatAttachment[] = [];
    for (const file of files.slice(0, 3)) {
      if (file.size > 18 * 1024 * 1024) {
        setFileError('Dosya boyutu en fazla 18 MB olabilir.');
        continue;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Dosya okunamadı'));
        reader.readAsDataURL(file);
      });
      const base64 = dataUrl.split(',')[1] || '';
      nextAttachments.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        mimeType: file.type || 'image/png',
        size: file.size,
        dataBase64: base64,
        previewUrl: dataUrl,
      });
    }

    setAttachments((prev) => [...prev, ...nextAttachments].slice(0, 3));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isStreaming) return;
    if (!input.trim() && attachments.length === 0) return;

    const textToSend = input;
    const filesToSend = attachments;
    setInput('');
    setAttachments([]);
    setFileError(null);
    onSendMessage(textToSend, filesToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const activeSpec = ENGINES[selectedEngine];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-10">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          {messages.length === 0 ? (
            <div className="flex min-h-[52vh] flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#150d24] shadow-xl shadow-fuchsia-950/40">
                <HelyumeLogo size={34} />
              </div>
              <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
                Bugün neyi birlikte çözelim?
              </h2>
              <p className="mt-2 max-w-lg text-sm text-slate-400">
                Anında hız için <strong className="text-slate-200">Crush</strong>, web araştırması
                için <strong className="text-slate-200">Aura</strong>, derin teknik analiz için{' '}
                <strong className="text-slate-200">Void</strong> motorunu seçin.
              </p>

              <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 text-left sm:grid-cols-2">
                {QUICK_PROMPTS.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => {
                      onSelectEngine(item.engine);
                      onSendMessage(item.prompt, []);
                    }}
                    className="rounded-xl border border-white/10 bg-[#110a1e]/85 p-4 text-left transition-all hover:border-fuchsia-500/40 hover:bg-[#170f28]"
                  >
                    <div className="mb-1.5 flex items-center justify-between text-xs text-fuchsia-300">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-slate-400">{ENGINES[item.engine].shortName}</span>
                    </div>
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-300">
                      {item.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              const isLastAssistant = !isUser && idx === messages.length - 1;

              if (isUser) {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[82%] space-y-2 rounded-2xl border border-white/10 bg-[#171824] px-4 py-3 text-sm text-white shadow-sm">
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {msg.attachments.map((att) =>
                            att.mimeType.startsWith('video/') ? (
                              <div
                                key={att.id}
                                className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-slate-200"
                              >
                                <Video className="h-3.5 w-3.5 text-fuchsia-400" />
                                <span className="max-w-[160px] truncate">{att.name}</span>
                              </div>
                            ) : (
                              <img
                                key={att.id}
                                src={att.previewUrl || `data:${att.mimeType};base64,${att.dataBase64}`}
                                alt={att.name}
                                referrerPolicy="no-referrer"
                                className="h-28 max-w-[200px] rounded-lg border border-white/10 object-cover"
                              />
                            )
                          )}
                        </div>
                      )}
                      {msg.content && (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                  </div>
                );
              }

              const engineName = ENGINES[msg.engine]?.name || 'Reflets Crush';
              const showSpinner = isLastAssistant && isStreaming && !msg.content;

              return (
                <div key={msg.id} className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5 text-sm">
                    <HelyumeLogo size={22} />
                    <span className="font-display font-semibold text-white">Reflets</span>
                    <span aria-hidden="true" className="text-slate-500">
                      ·
                    </span>
                    <span className="text-xs text-slate-400">{engineName}</span>
                  </div>

                  <div className="pl-8">
                    {showSpinner ? (
                      <div className="flex items-center gap-2 py-2 text-sm text-slate-400">
                        <span className="inline-block h-2 w-2 rounded-full bg-fuchsia-400 animate-ping" />
                        <span>Yanıt hazırlanıyor...</span>
                      </div>
                    ) : msg.isError ? (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-950/25 px-4 py-3 text-sm text-rose-200">
                        {msg.content}
                      </div>
                    ) : (
                      <MarkdownRenderer content={msg.content} />
                    )}

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-white/[0.06] pt-2.5 text-xs text-slate-400">
                        <span className="font-medium text-slate-300">Web Kaynakları:</span>
                        {msg.sources.map((src) => (
                          <a
                            key={src.uri}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-fuchsia-300 hover:text-fuchsia-200 hover:underline"
                          >
                            <span className="max-w-[200px] truncate">{src.title}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}

                    {(!isLastAssistant || !isStreaming) && msg.content && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono tabular-nums">
                          {formatLatencySeconds(msg.ttftMs ?? msg.elapsedMs)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          {copiedId === msg.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>{copiedId === msg.id ? 'Kopyalandı' : 'Kopyala'}</span>
                        </button>
                        {isLastAssistant && (
                          <>
                            <span aria-hidden="true">·</span>
                            <button
                              type="button"
                              onClick={onRetryLast}
                              className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              <span>{msg.isError ? 'Tekrar Dene' : 'Yeniden Üret'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-white/[0.08] bg-[#090512]/90 px-4 py-4 backdrop-blur-md md:px-10">
        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-4xl">
          {fileError && (
            <div className="mb-2 rounded-lg border border-rose-500/30 bg-rose-950/40 px-3 py-1.5 text-xs text-rose-200">
              {fileError}
            </div>
          )}

          {attachments.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#140d22] p-1.5 pr-2.5 text-xs text-slate-200"
                >
                  {att.mimeType.startsWith('image/') && att.previewUrl ? (
                    <img
                      src={att.previewUrl}
                      alt={att.name}
                      referrerPolicy="no-referrer"
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-500/20">
                      <Video className="h-4 w-4 text-fuchsia-300" />
                    </div>
                  )}
                  <span className="max-w-[140px] truncate">{att.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setAttachments((prev) => prev.filter((item) => item.id !== att.id))
                    }
                    aria-label={`Ek dosyayı kaldır: ${att.name}`}
                    className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative rounded-2xl border border-white/12 bg-[#110b1d] p-3 shadow-xl shadow-black/40 focus-within:border-fuchsia-500/50">
            <label htmlFor="chat-composer-input" className="sr-only">
              Mesajınız
            </label>
            <textarea
              id="chat-composer-input"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Reflets ile sohbet edin veya görsel/video yükleyin..."
              className="w-full resize-none bg-transparent px-2 py-1 text-sm text-white placeholder:text-slate-500 focus:outline-none sm:text-[15px]"
            />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-2.5">
              <div className="flex flex-wrap items-center gap-2" ref={menuContainerRef}>
                {moduleMenuOpen && (
                  <div
                    role="dialog"
                    aria-label="Modül Seç"
                    className="absolute bottom-full left-0 z-30 mb-3 w-[min(370px,calc(100vw-2.5rem))] rounded-2xl border border-white/15 bg-[#120a21]/95 p-3 shadow-2xl shadow-black/70 backdrop-blur-xl"
                  >
                    <div className="mb-2.5 flex items-center justify-between px-1.5 text-xs">
                      <span className="font-semibold text-white">Modül Seç</span>
                      <span className="text-slate-400">Tüm Modüller Aktif</span>
                    </div>

                    <div className="space-y-1.5">
                      {(['crush', 'aura', 'void'] as EngineId[]).map((engineId) => {
                        const spec = ENGINES[engineId];
                        const isSelected = selectedEngine === engineId;
                        return (
                          <button
                            key={engineId}
                            type="button"
                            onClick={() => {
                              onSelectEngine(engineId);
                              setModuleMenuOpen(false);
                            }}
                            className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                              isSelected
                                ? 'border-fuchsia-500/50 bg-fuchsia-500/[0.16]'
                                : 'border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.06]'
                            }`}
                          >
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-fuchsia-300">
                              <EngineIcon engine={engineId} className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-white">
                                  {spec.name}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[11px] tabular-nums text-fuchsia-300">
                                    {spec.speedLabel}
                                  </span>
                                  {isSelected && <Check className="h-4 w-4 text-fuchsia-300" />}
                                </div>
                              </div>
                              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                                {spec.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setModuleMenuOpen((prev) => !prev)}
                  aria-expanded={moduleMenuOpen}
                  aria-haspopup="dialog"
                  className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-500/35 bg-fuchsia-500/[0.12] px-3 py-1.5 text-xs font-medium text-fuchsia-100 transition-colors hover:bg-fuchsia-500/[0.2] whitespace-nowrap"
                >
                  <EngineIcon engine={selectedEngine} className="h-3.5 w-3.5 text-fuchsia-300" />
                  <span>{activeSpec.name}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-fuchsia-300" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Görsel veya Video dosyası seç"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/[0.09] whitespace-nowrap"
                >
                  <ImageIcon className="h-3.5 w-3.5 text-slate-300" />
                  <span>Görsel / Video</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenLive}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/[0.1] px-3 py-1.5 text-xs font-medium text-fuchsia-200 transition-colors hover:bg-fuchsia-500/[0.2] whitespace-nowrap"
                >
                  <Mic className="h-3.5 w-3.5 text-fuchsia-300" />
                  <span>Canlı</span>
                </button>
              </div>

              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStopStreaming}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/20 px-4 py-1.5 text-xs font-semibold text-rose-100 transition-colors hover:bg-rose-500/30 whitespace-nowrap"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Durdur</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() && attachments.length === 0}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                    input.trim() || attachments.length > 0
                      ? 'helyume-gradient-btn text-white shadow-md shadow-fuchsia-950/50'
                      : 'cursor-not-allowed bg-white/[0.08] text-slate-400'
                  }`}
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                  <span>Gönder</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
