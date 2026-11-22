import React from 'react';
import { LogIn, Menu, User, Video } from 'lucide-react';
import type { AppView, UserProfile } from '../utils/helyumeLogic';

interface TopBarProps {
  activeView: AppView;
  pageTitle: string;
  onSelectView: (view: AppView) => void;
  onOpenLive: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenMobileMenu: () => void;
  user: UserProfile | null;
}

const TOP_LINKS: Array<{ id: AppView; label: string }> = [
  { id: 'home', label: 'Ana Menü' },
  { id: 'chat', label: 'Sohbet' },
  { id: 'community', label: 'Topluluk Soruları' },
  { id: 'auth', label: 'Reflets Giriş' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeView,
  pageTitle,
  onSelectView,
  onOpenLive,
  onOpenAuth,
  onOpenMobileMenu,
  user,
}) => {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-white/[0.08] bg-[#0a0514]/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Menüyü aç"
          className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate font-display text-sm font-semibold text-white md:text-base max-w-[180px] sm:max-w-[260px]">
          {pageTitle}
        </h1>
      </div>

      <nav aria-label="Üst gezinme" className="hidden md:flex items-center gap-6">
        {TOP_LINKS.map((link) => {
          const isActive = activeView === link.id;
          return (
            <button
              key={link.id}
              type="button"
              onClick={() => onSelectView(link.id)}
              className={`text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                isActive ? 'text-fuchsia-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onOpenLive}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-slate-100 transition-colors hover:bg-white/[0.1] whitespace-nowrap shrink-0 sm:text-sm"
        >
          <Video className="h-4 w-4 text-fuchsia-400 shrink-0" />
          <span>Canlı Asistan</span>
        </button>

        {user ? (
          <button
            type="button"
            onClick={() => onSelectView('auth')}
            className="helyume-gradient-btn inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition-all whitespace-nowrap shrink-0 sm:text-sm"
          >
            <User className="h-4 w-4 shrink-0" />
            <span className="max-w-[110px] truncate">{user.name}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenAuth('login')}
            className="helyume-gradient-btn inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition-all whitespace-nowrap shrink-0 sm:text-sm"
          >
            <LogIn className="h-4 w-4 shrink-0" />
            <span>Giriş Yap</span>
          </button>
        )}
      </div>
    </header>
  );
};
