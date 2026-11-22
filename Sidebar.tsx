import React from 'react';
import { Home, LogIn, LogOut, MessageSquare, Plus, Trash2, UserPlus, Users, X } from 'lucide-react';
import type { AppView, ChatThread, UserProfile } from '../utils/helyumeLogic';
import { HelyumeLogo } from './HelyumeLogo';

interface SidebarProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onNewChat: () => void;
  onDeleteThread: (threadId: string) => void;
  user: UserProfile | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onSignOut: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{ id: AppView; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'home', label: 'Ana Menü', icon: Home },
  { id: 'chat', label: 'Sohbet', icon: MessageSquare },
  { id: 'community', label: 'Topluluk Soruları', icon: Users },
  { id: 'auth', label: 'Reflets Giriş', icon: LogIn },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onDeleteThread,
  user,
  onOpenAuth,
  onSignOut,
  mobileOpen,
  onCloseMobile,
}) => {
  const sidebarContent = (
    <aside
      aria-label="Ana kenar çubuğu"
      className="flex h-full w-[264px] shrink-0 flex-col border-r border-white/[0.08] bg-[#0a0514] px-3.5 py-4"
    >
      <div className="mb-5 flex items-center justify-between px-2">
        <button
          type="button"
          onClick={() => {
            onSelectView('home');
            onCloseMobile();
          }}
          className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 rounded-lg"
        >
          <HelyumeLogo size={28} />
          <span className="font-display text-lg font-bold tracking-tight text-white">Reflets</span>
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Menüyü kapat"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav aria-label="Kenar çubuğu gezinme" className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectView(item.id);
                onCloseMobile();
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'helyume-gradient-btn text-white shadow-lg shadow-fuchsia-950/40'
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-5">
        <button
          type="button"
          onClick={() => {
            onNewChat();
            onCloseMobile();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition-colors hover:bg-slate-100 whitespace-nowrap"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>Yeni Sohbet</span>
        </button>
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        <div className="mb-2 px-2 text-xs font-medium text-slate-400">Sohbet Geçmişi</div>
        <div className="flex-1 space-y-1 overflow-y-auto pr-1">
          {threads.length === 0 ? (
            <p className="px-2 py-3 text-xs text-slate-500">Henüz kayıtlı sohbet yok.</p>
          ) : (
            threads.map((thread) => {
              const isSelected = activeView === 'chat' && activeThreadId === thread.id;
              return (
                <div
                  key={thread.id}
                  className={`group flex items-center justify-between rounded-xl border transition-colors ${
                    isSelected
                      ? 'border-fuchsia-500/30 bg-fuchsia-500/[0.12] text-white'
                      : 'border-transparent text-slate-300 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectThread(thread.id);
                      onCloseMobile();
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left text-sm"
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{thread.title}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteThread(thread.id)}
                    aria-label={`Sohbeti sil: ${thread.title}`}
                    className="mr-1.5 rounded-lg p-1.5 text-slate-500 opacity-80 transition-colors hover:bg-white/10 hover:text-rose-400 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-white/[0.08] pt-3.5">
        {user ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-white">{user.name}</div>
              <div className="truncate text-xs text-slate-400">{user.email}</div>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              aria-label="Çıkış Yap"
              className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenAuth('login');
                onCloseMobile();
              }}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-white/[0.08] hover:text-white whitespace-nowrap"
            >
              <LogIn className="h-3.5 w-3.5 shrink-0" />
              <span>Giriş Yap</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenAuth('register');
                onCloseMobile();
              }}
              className="helyume-gradient-btn flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white transition-all whitespace-nowrap"
            >
              <UserPlus className="h-3.5 w-3.5 shrink-0" />
              <span>Kayıt Ol</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden h-full lg:block">{sidebarContent}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Menü arka planını kapat"
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
