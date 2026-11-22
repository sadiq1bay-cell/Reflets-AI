import React from 'react';
import { ArrowRight, LogIn, MessageSquare, Users, Video } from 'lucide-react';
import type { AppView } from '../utils/helyumeLogic';
import { HelyumeLogo } from './HelyumeLogo';

interface HomeViewProps {
  onStartChat: () => void;
  onOpenLive: () => void;
  onSelectView: (view: AppView) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onStartChat,
  onOpenLive,
  onSelectView,
}) => {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-10 md:px-10 md:py-14">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-[#150d24] shadow-2xl shadow-fuchsia-950/50">
          <HelyumeLogo size={40} />
        </div>

        <p className="mb-3 text-xs font-medium tracking-wide text-slate-300 md:text-sm">
          Ana Menü · Reflets Uygulaması
        </p>

        <h2 className="helyume-text-gradient font-display text-balance text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          Yeni Teknolojinin Tasarımı
        </h2>

        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
          Reflets Crush, Aura ve Void motorlarıyla 1 saniye altı hızlı metin sohbeti, görsel ve video
          analizi, gerçek zamanlı sesli-kameralı canlı asistan ve Topluluk Soruları tek uygulama
          içinde.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <button
            type="button"
            onClick={onStartChat}
            className="helyume-gradient-btn inline-flex items-center gap-2.5 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-950/50 transition-all whitespace-nowrap"
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span>Sohbete Başla</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </button>

          <button
            type="button"
            onClick={onOpenLive}
            className="inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-medium text-slate-100 transition-colors hover:bg-white/[0.09] whitespace-nowrap"
          >
            <Video className="h-4 w-4 text-fuchsia-400 shrink-0" />
            <span>Canlı Asistan</span>
          </button>
        </div>

        <div className="mt-14 grid w-full grid-cols-1 gap-4 text-left md:grid-cols-3">
          <button
            type="button"
            onClick={onStartChat}
            className="group rounded-2xl border border-white/10 bg-[#110a1e]/85 p-6 text-left transition-all hover:border-fuchsia-500/40 hover:bg-[#170e28]"
          >
            <div className="mb-5 flex items-center justify-between">
              <MessageSquare className="h-5 w-5 text-slate-400 transition-colors group-hover:text-fuchsia-400" />
              <span className="text-xs text-slate-400">Reflets Crush · Aura · Void</span>
            </div>
            <h3 className="font-display text-lg font-bold text-white">
              Çok Modlu Yapay Zeka Sohbeti
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              1 saniye altı anında yanıtlar, web araştırması, derin analiz ve görsel-video inceleme.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectView('community')}
            className="group rounded-2xl border border-white/10 bg-[#110a1e]/85 p-6 text-left transition-all hover:border-fuchsia-500/40 hover:bg-[#170e28]"
          >
            <div className="mb-5 flex items-center justify-between">
              <Users className="h-5 w-5 text-slate-400 transition-colors group-hover:text-fuchsia-400" />
              <span className="text-xs text-slate-400">Topluluk</span>
            </div>
            <h3 className="font-display text-lg font-bold text-white">Topluluk Soruları</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Diğer kullanıcıların sorularını inceleyin, oylayın ve anında yapay zeka yanıtları üretin.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectView('auth')}
            className="group rounded-2xl border border-white/10 bg-[#110a1e]/85 p-6 text-left transition-all hover:border-fuchsia-500/40 hover:bg-[#170e28]"
          >
            <div className="mb-5 flex items-center justify-between">
              <LogIn className="h-5 w-5 text-slate-400 transition-colors group-hover:text-fuchsia-400" />
              <span className="text-xs text-slate-400">E-posta Doğrulama</span>
            </div>
            <h3 className="font-display text-lg font-bold text-white">Reflets Giriş</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Profilinizi oluşturun, varsayılan motorunuzu seçin ve sohbet geçmişinizi senkronize edin.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
