import React, { useState } from 'react';
import { ArrowBigUp, Plus, Search, Sparkles, X } from 'lucide-react';
import {
  ENGINES,
  filterCommunityQuestions,
  formatLatencySeconds,
  type CommunityQuestion,
  type EngineId,
} from '../utils/helyumeLogic';
import { MarkdownRenderer } from './MarkdownRenderer';

interface CommunityViewProps {
  questions: CommunityQuestion[];
  onToggleVote: (id: string) => void;
  onAddQuestion: (q: CommunityQuestion) => void;
  authorName: string;
}

const FILTER_OPTIONS = ['Tümü', 'Crush', 'Aura', 'Void', 'Kod & Mimari', 'Görsel & Video'];
const CATEGORIES: Array<CommunityQuestion['category']> = [
  'Genel',
  'Kod & Mimari',
  'Görsel & Video',
  'Araştırma',
];

export const CommunityView: React.FC<CommunityViewProps> = ({
  questions,
  onToggleVote,
  onAddQuestion,
  authorName,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tümü');
  const [askOpen, setAskOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<CommunityQuestion['category']>('Genel');
  const [engine, setEngine] = useState<EngineId>('crush');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = filterCommunityQuestions(questions, search, filter);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (title.trim().length < 6) {
      setFormError('Soru başlığı en az 6 karakter olmalıdır.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/community/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          engine,
        }),
      });
      const data = (await response.json()) as {
        answer?: string;
        answeredInMs?: number;
        error?: string;
      };
      if (!response.ok || !data.answer) {
        throw new Error(data.error || 'Yanıt alınamadı.');
      }

      onAddQuestion({
        id: `cq-${Date.now()}`,
        title: title.trim(),
        body: body.trim() || 'Topluluk için hızlı yanıt talebi.',
        author: authorName || 'Misafir Kullanıcı',
        engine,
        category,
        votes: 1,
        hasVoted: true,
        answer: data.answer,
        answeredInMs: data.answeredInMs ?? 700,
        createdAt: 'Az önce',
      });
      setTitle('');
      setBody('');
      setAskOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Soru yayınlanırken hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Topluluk Soruları
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Geliştiricilerin ve üreticilerin sorularına Reflets motorlarının ürettiği doğrulanmış
            yanıtlar.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAskOpen((prev) => !prev)}
          className="helyume-gradient-btn inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-950/40 whitespace-nowrap"
        >
          {askOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{askOpen ? 'Vazgeç' : 'Soru Sor'}</span>
        </button>
      </div>

      {askOpen && (
        <form
          onSubmit={handlePublish}
          className="mt-6 space-y-4 rounded-2xl border border-fuchsia-500/30 bg-[#120a21] p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-white">
              Yeni Topluluk Sorusu Yayınla
            </h3>
            <span className="text-xs text-slate-400">Anında Reflets yanıtı eklenir</span>
          </div>

          {formError && (
            <div className="rounded-xl border border-rose-500/35 bg-rose-950/30 px-3.5 py-2 text-xs text-rose-200">
              {formError}
            </div>
          )}

          <div>
            <label htmlFor="cq-title" className="mb-1.5 block text-xs font-medium text-slate-300">
              Soru Başlığı
            </label>
            <input
              id="cq-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: WebSocket bağlantı kopmalarında otomatik yeniden bağlanma nasıl kurgulanır?"
              className="w-full rounded-xl border border-white/15 bg-[#090512] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="cq-body" className="mb-1.5 block text-xs font-medium text-slate-300">
              Ek Bağlam (İsteğe bağlı)
            </label>
            <textarea
              id="cq-body"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Kullandığınız teknoloji veya beklediğiniz çıktı hakkında kısa bilgi..."
              className="w-full rounded-xl border border-white/15 bg-[#090512] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="cq-category" className="mb-1.5 block text-xs font-medium text-slate-300">
                Kategori
              </label>
              <select
                id="cq-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as CommunityQuestion['category'])}
                className="w-full rounded-xl border border-white/15 bg-[#090512] px-3.5 py-2.5 text-sm text-white focus:border-fuchsia-500 focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="cq-engine" className="mb-1.5 block text-xs font-medium text-slate-300">
                Yanıt Motoru
              </label>
              <select
                id="cq-engine"
                value={engine}
                onChange={(e) => setEngine(e.target.value as EngineId)}
                className="w-full rounded-xl border border-white/15 bg-[#090512] px-3.5 py-2.5 text-sm text-white focus:border-fuchsia-500 focus:outline-none"
              >
                <option value="crush">Reflets Crush (&lt; 1 sn)</option>
                <option value="aura">Reflets Aura (Web + Dengeli)</option>
                <option value="void">Reflets Void (Derin Analiz)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="helyume-gradient-btn inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              <span>{submitting ? 'Yanıt Üretiliyor...' : 'Yayınla ve Yanıtla'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <label htmlFor="community-search" className="sr-only">
            Topluluk sorularında ara
          </label>
          <input
            id="community-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sorularda veya yanıtlarda ara..."
            className="w-full rounded-xl border border-white/12 bg-[#110a1e] py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/10 bg-[#110a1e] p-1">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFilter(opt)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                filter === opt
                  ? 'bg-fuchsia-500/25 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#110a1e]/70 p-10 text-center">
            <p className="text-sm text-slate-300">Aramanızla eşleşen topluluk sorusu bulunamadı.</p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFilter('Tümü');
              }}
              className="mt-3 text-xs font-medium text-fuchsia-300 hover:underline"
            >
              Filtreleri Sıfırla
            </button>
          </div>
        ) : (
          filtered.map((q) => (
            <article
              key={q.id}
              className="rounded-2xl border border-white/10 bg-[#110a1e]/85 p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>{q.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{ENGINES[q.engine].name}</span>
                    <span aria-hidden="true">·</span>
                    <span>{q.author}</span>
                    <span aria-hidden="true">·</span>
                    <span>{q.createdAt}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-white">{q.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-300">{q.body}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleVote(q.id)}
                  aria-pressed={Boolean(q.hasVoted)}
                  aria-label={`Soruyu oyla (${q.votes})`}
                  className={`flex shrink-0 flex-col items-center rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                    q.hasVoted
                      ? 'border-fuchsia-500/50 bg-fuchsia-500/20 text-fuchsia-200'
                      : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08]'
                  }`}
                >
                  <ArrowBigUp className={`h-4 w-4 ${q.hasVoted ? 'fill-current' : ''}`} />
                  <span className="font-mono tabular-nums">{q.votes}</span>
                </button>
              </div>

              <div className="mt-4 border-t border-white/[0.08] pt-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-fuchsia-300">Reflets Yanıtı</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {formatLatencySeconds(q.answeredInMs)}
                  </span>
                </div>
                <MarkdownRenderer content={q.answer} />
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};
