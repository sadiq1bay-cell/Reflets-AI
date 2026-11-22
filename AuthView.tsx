import React, { useState } from 'react';
import { CheckCircle2, LogIn, LogOut, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { ENGINES, validateAuthForm, type EngineId, type UserProfile } from '../utils/helyumeLogic';
import { HelyumeLogo } from './HelyumeLogo';

interface AuthViewProps {
  mode: 'login' | 'register';
  onModeChange: (mode: 'login' | 'register') => void;
  user: UserProfile | null;
  onSignIn: (profile: UserProfile) => void;
  onSignOut: () => void;
  onUpdatePreferredEngine: (engine: EngineId) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  mode,
  onModeChange,
  user,
  onSignIn,
  onSignOut,
  onUpdatePreferredEngine,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateAuthForm(mode, email, password, name);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    const derivedName =
      mode === 'register' && name.trim()
        ? name.trim()
        : email.trim().split('@')[0].replace(/[._-]+/g, ' ');

    onSignIn({
      name: derivedName,
      email: email.trim(),
      preferredEngine: 'crush',
      signedInAt: Date.now(),
    });
    setPassword('');
  };

  if (user) {
    return (
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center px-4 py-10">
        <div className="rounded-2xl border border-white/12 bg-[#110a1e]/90 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/15">
                <CheckCircle2 className="h-6 w-6 text-fuchsia-300" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-white">{user.name}</h2>
                <p className="text-sm text-slate-400">{user.email}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-200 hover:bg-white/[0.1]"
            >
              <LogOut className="h-4 w-4" />
              <span>Çıkış Yap</span>
            </button>
          </div>

          <div className="mt-6">
            <h3 className="font-display text-sm font-semibold text-white">
              Varsayılan Yapay Zeka Motoru
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Yeni sohbet başlattığınızda otomatik seçilecek motoru belirleyin.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(['crush', 'aura', 'void'] as EngineId[]).map((id) => {
                const spec = ENGINES[id];
                const active = user.preferredEngine === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onUpdatePreferredEngine(id)}
                    className={`rounded-xl border p-3.5 text-left transition-all ${
                      active
                        ? 'border-fuchsia-500/60 bg-fuchsia-500/15'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="text-sm font-semibold text-white">{spec.shortName}</div>
                    <div className="mt-1 font-mono text-xs text-fuchsia-300">{spec.speedLabel}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-white/12 bg-[#110a1e]/95 p-6 shadow-2xl shadow-black/50 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#160e26]">
            <HelyumeLogo size={28} />
          </div>
          <h2 className="font-display text-2xl font-bold text-white">Reflets Giriş</h2>
          <p className="mt-1 text-xs text-slate-400">
            Sohbet geçmişinizi ve motor tercihlerinizi profilinize kaydedin.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-[#090512] p-1">
          <button
            type="button"
            onClick={() => {
              onModeChange('login');
              setErrors({});
            }}
            className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
              mode === 'login' ? 'helyume-gradient-btn text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => {
              onModeChange('register');
              setErrors({});
            }}
            className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
              mode === 'register'
                ? 'helyume-gradient-btn text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-name" className="mb-1.5 block text-xs font-medium text-slate-300">
                Ad Soyad
              </label>
              <input
                id="auth-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Deniz Aydın"
                className="w-full rounded-xl border border-white/15 bg-[#090512] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-500 focus:outline-none"
              />
              {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name}</p>}
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="mb-1.5 block text-xs font-medium text-slate-300">
              E-posta Adresi
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ad@ornek.com"
                className="w-full rounded-xl border border-white/15 bg-[#090512] py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-500 focus:outline-none"
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="auth-password" className="mb-1.5 block text-xs font-medium text-slate-300">
              Şifre
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 6 karakter"
              className="w-full rounded-xl border border-white/15 bg-[#090512] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-500 focus:outline-none"
            />
            {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="helyume-gradient-btn flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-950/50"
          >
            {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            <span>{mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}</span>
          </button>
        </form>

        <div className="mt-5 flex items-center gap-2 border-t border-white/[0.08] pt-4 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 shrink-0 text-fuchsia-400" />
          <span>Oturum bilgileri tarayıcınızda güvenle saklanır.</span>
        </div>
      </div>
    </div>
  );
};
