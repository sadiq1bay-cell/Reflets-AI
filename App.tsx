import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AuthView } from './components/AuthView';
import { ChatView } from './components/ChatView';
import { CommunityView } from './components/CommunityView';
import { HomeView } from './components/HomeView';
import { LiveAssistantModal } from './components/LiveAssistantModal';
import { Sidebar } from './components/Sidebar';
import { SpaceBackdrop } from './components/SpaceBackdrop';
import { TopBar } from './components/TopBar';
import {
  buildGeminiHistory,
  deriveThreadTitle,
  INITIAL_COMMUNITY_QUESTIONS,
  type AppView,
  type ChatAttachment,
  type ChatMessage,
  type ChatThread,
  type CommunityQuestion,
  type EngineId,
  type GroundingSource,
  type UserProfile,
} from './utils/helyumeLogic';

const STORAGE_THREADS_KEY = 'helyume_threads_v1';
const STORAGE_USER_KEY = 'helyume_user_v1';
const STORAGE_COMMUNITY_KEY = 'helyume_community_v1';

const DEFAULT_SEED_THREAD: ChatThread = {
  id: 'seed-sa',
  title: 'sa',
  engine: 'crush',
  updatedAt: Date.now(),
  messages: [
    {
      id: 'seed-m1',
      role: 'user',
      content: 'sa',
      engine: 'crush',
      createdAt: Date.now() - 2000,
    },
    {
      id: 'seed-m2',
      role: 'assistant',
      content: 'Selam! Reflets Crush ile hazırım. Sana nasıl yardımcı olabilirim?',
      engine: 'crush',
      createdAt: Date.now() - 1500,
      ttftMs: 400,
      elapsedMs: 420,
    },
  ],
};

function loadInitialThreads(): ChatThread[] {
  try {
    const raw = localStorage.getItem(STORAGE_THREADS_KEY);
    if (!raw) return [DEFAULT_SEED_THREAD];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [DEFAULT_SEED_THREAD];
  } catch {
    return [DEFAULT_SEED_THREAD];
  }
}

function loadInitialUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function loadInitialCommunity(): CommunityQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_COMMUNITY_KEY);
    if (!raw) return INITIAL_COMMUNITY_QUESTIONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_COMMUNITY_QUESTIONS;
  } catch {
    return INITIAL_COMMUNITY_QUESTIONS;
  }
}

export default function App() {
  const autostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const [activeView, setActiveView] = useState<AppView>(autostart ? 'chat' : 'home');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [threads, setThreads] = useState<ChatThread[]>(loadInitialThreads);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => {
    const initial = loadInitialThreads();
    return initial[0]?.id ?? null;
  });
  const [selectedEngine, setSelectedEngine] = useState<EngineId>('crush');
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(loadInitialUser);
  const [communityQuestions, setCommunityQuestions] =
    useState<CommunityQuestion[]>(loadInitialCommunity);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const compactThreads = threads.map((t) => ({
        ...t,
        messages: t.messages.map((m) => ({
          ...m,
          attachments: m.attachments?.map((a) => ({
            ...a,
            dataBase64: '',
            previewUrl: undefined,
          })),
        })),
      }));
      localStorage.setItem(STORAGE_THREADS_KEY, JSON.stringify(compactThreads));
    } catch {
      // Ignore quota errors
    }
  }, [threads]);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_USER_KEY);
      }
    } catch {
      // Ignore
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_COMMUNITY_KEY, JSON.stringify(communityQuestions));
    } catch {
      // Ignore
    }
  }, [communityQuestions]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? null,
    [threads, activeThreadId]
  );

  const pageTitle = useMemo(() => {
    if (activeView === 'home') return 'Ana Menü';
    if (activeView === 'community') return 'Topluluk Soruları';
    if (activeView === 'auth') return 'Reflets Giriş';
    return activeThread?.title || 'Yeni Sohbet';
  }, [activeView, activeThread]);

  const handleNewChat = () => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }
    const newThread: ChatThread = {
      id: `chat-${Date.now()}`,
      title: 'Yeni Sohbet',
      engine: user?.preferredEngine || selectedEngine,
      messages: [],
      updatedAt: Date.now(),
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newThread.id);
    setSelectedEngine(newThread.engine);
    setActiveView('chat');
  };

  const handleStartChatFromHome = () => {
    if (!activeThreadId || (activeThread && activeThread.messages.length === 0)) {
      if (!activeThreadId) {
        handleNewChat();
        return;
      }
    }
    setActiveView('chat');
  };

  const handleSelectThread = (threadId: string) => {
    const target = threads.find((t) => t.id === threadId);
    if (target) {
      setSelectedEngine(target.engine);
    }
    setActiveThreadId(threadId);
    setActiveView('chat');
  };

  const handleDeleteThread = (threadId: string) => {
    setThreads((prev) => {
      const remaining = prev.filter((t) => t.id !== threadId);
      if (activeThreadId === threadId) {
        setActiveThreadId(remaining[0]?.id ?? null);
      }
      return remaining;
    });
  };

  const streamAssistantReply = async (
    threadId: string,
    engine: EngineId,
    historyMessages: ChatMessage[],
    assistantMsgId: string
  ) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);

    const requestStartedAt = performance.now();

    try {
      const contents = buildGeminiHistory(historyMessages);
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine, contents }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Sunucu yanıt vermedi (${response.status}).`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const chunkBlock of lines) {
          const dataLine = chunkBlock
            .split('\n')
            .find((l) => l.startsWith('data: '));
          if (!dataLine) continue;

          const event = JSON.parse(dataLine.slice(6)) as {
            type: string;
            text?: string;
            ttftMs?: number;
            elapsedMs?: number;
            sources?: GroundingSource[];
            message?: string;
          };

          if (event.type === 'ttft' && typeof event.ttftMs === 'number') {
            const clientTtft = Math.round(performance.now() - requestStartedAt);
            setThreads((prev) =>
              prev.map((t) =>
                t.id !== threadId
                  ? t
                  : {
                      ...t,
                      messages: t.messages.map((m) =>
                        m.id === assistantMsgId ? { ...m, ttftMs: clientTtft } : m
                      ),
                    }
              )
            );
          } else if (event.type === 'delta' && event.text) {
            const deltaText = event.text;
            setThreads((prev) =>
              prev.map((t) =>
                t.id !== threadId
                  ? t
                  : {
                      ...t,
                      messages: t.messages.map((m) =>
                        m.id === assistantMsgId
                          ? { ...m, content: m.content + deltaText }
                          : m
                      ),
                    }
              )
            );
          } else if (event.type === 'sources' && event.sources) {
            setThreads((prev) =>
              prev.map((t) =>
                t.id !== threadId
                  ? t
                  : {
                      ...t,
                      messages: t.messages.map((m) =>
                        m.id === assistantMsgId ? { ...m, sources: event.sources } : m
                      ),
                    }
              )
            );
          } else if (event.type === 'done') {
            const elapsed = Math.round(performance.now() - requestStartedAt);
            setThreads((prev) =>
              prev.map((t) =>
                t.id !== threadId
                  ? t
                  : {
                      ...t,
                      updatedAt: Date.now(),
                      messages: t.messages.map((m) =>
                        m.id === assistantMsgId
                          ? { ...m, elapsedMs: elapsed, ttftMs: m.ttftMs ?? elapsed }
                          : m
                      ),
                    }
              )
            );
          } else if (event.type === 'error') {
            throw new Error(event.message || 'Yanıt akışı başarısız oldu.');
          }
        }
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        return;
      }
      const message =
        err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu.';
      setThreads((prev) =>
        prev.map((t) =>
          t.id !== threadId
            ? t
            : {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: m.content ? `${m.content}\n\n[Hata: ${message}]` : message,
                        isError: !m.content,
                        elapsedMs: Math.round(performance.now() - requestStartedAt),
                      }
                    : m
                ),
              }
        )
      );
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = async (text: string, attachments: ChatAttachment[]) => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      engine: selectedEngine,
      createdAt: Date.now(),
      attachments,
    };

    const assistantMsgId = `a-${Date.now() + 1}`;
    const placeholderAssistant: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      engine: selectedEngine,
      createdAt: Date.now() + 1,
    };

    let targetThreadId = activeThreadId;
    let updatedHistory: ChatMessage[] = [];

    if (!targetThreadId || !threads.some((t) => t.id === targetThreadId)) {
      const newId = `chat-${Date.now()}`;
      targetThreadId = newId;
      const newTitle = deriveThreadTitle(trimmed, attachments.length > 0);
      updatedHistory = [userMsg];
      const createdThread: ChatThread = {
        id: newId,
        title: newTitle,
        engine: selectedEngine,
        messages: [userMsg, placeholderAssistant],
        updatedAt: Date.now(),
      };
      setThreads((prev) => [createdThread, ...prev]);
      setActiveThreadId(newId);
    } else {
      const existing = threads.find((t) => t.id === targetThreadId)!;
      updatedHistory = [...existing.messages, userMsg];
      const nextTitle =
        existing.messages.length === 0
          ? deriveThreadTitle(trimmed, attachments.length > 0)
          : existing.title;

      setThreads((prev) =>
        prev.map((t) =>
          t.id !== targetThreadId
            ? t
            : {
                ...t,
                title: nextTitle,
                engine: selectedEngine,
                updatedAt: Date.now(),
                messages: [...t.messages, userMsg, placeholderAssistant],
              }
        )
      );
    }

    await streamAssistantReply(targetThreadId, selectedEngine, updatedHistory, assistantMsgId);
  };

  const handleRetryLast = async () => {
    if (!activeThread || isStreaming) return;
    const msgs = [...activeThread.messages];
    if (msgs.length === 0) return;
    if (msgs[msgs.length - 1].role === 'assistant') {
      msgs.pop();
    }
    const assistantMsgId = `a-${Date.now()}`;
    const placeholder: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      engine: selectedEngine,
      createdAt: Date.now(),
    };
    setThreads((prev) =>
      prev.map((t) =>
        t.id !== activeThread.id ? t : { ...t, messages: [...msgs, placeholder] }
      )
    );
    await streamAssistantReply(activeThread.id, selectedEngine, msgs, assistantMsgId);
  };

  const handleStopStreaming = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  const handleToggleVote = (id: string) => {
    setCommunityQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const nextVoted = !q.hasVoted;
        return {
          ...q,
          hasVoted: nextVoted,
          votes: q.votes + (nextVoted ? 1 : -1),
        };
      })
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#080410] text-slate-100">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={handleSelectThread}
        onNewChat={handleNewChat}
        onDeleteThread={handleDeleteThread}
        user={user}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setActiveView('auth');
        }}
        onSignOut={() => setUser(null)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#070310]">
        <SpaceBackdrop />
        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
          <TopBar
            activeView={activeView}
            pageTitle={pageTitle}
            onSelectView={setActiveView}
            onOpenLive={() => setLiveOpen(true)}
            onOpenAuth={(mode) => {
              setAuthMode(mode);
              setActiveView('auth');
            }}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            user={user}
          />

          <main className="min-h-0 flex-1 overflow-y-auto">
          {activeView === 'home' && (
            <HomeView
              onStartChat={handleStartChatFromHome}
              onOpenLive={() => setLiveOpen(true)}
              onSelectView={setActiveView}
            />
          )}

          {activeView === 'chat' && (
            <ChatView
              messages={activeThread?.messages ?? []}
              selectedEngine={selectedEngine}
              onSelectEngine={setSelectedEngine}
              isStreaming={isStreaming}
              onSendMessage={handleSendMessage}
              onStopStreaming={handleStopStreaming}
              onRetryLast={handleRetryLast}
              onOpenLive={() => setLiveOpen(true)}
            />
          )}

          {activeView === 'community' && (
            <CommunityView
              questions={communityQuestions}
              onToggleVote={handleToggleVote}
              onAddQuestion={(q) => setCommunityQuestions((prev) => [q, ...prev])}
              authorName={user?.name || 'Misafir Kullanıcı'}
            />
          )}

          {activeView === 'auth' && (
            <AuthView
              mode={authMode}
              onModeChange={setAuthMode}
              user={user}
              onSignIn={(profile) => {
                setUser(profile);
                setSelectedEngine(profile.preferredEngine);
              }}
              onSignOut={() => setUser(null)}
              onUpdatePreferredEngine={(engine) => {
                setSelectedEngine(engine);
                setUser((prev) => (prev ? { ...prev, preferredEngine: engine } : null));
              }}
            />
          )}
          </main>
        </div>
      </div>

      <LiveAssistantModal open={liveOpen} onClose={() => setLiveOpen(false)} />
    </div>
  );
}
