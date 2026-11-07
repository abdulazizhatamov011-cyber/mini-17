'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Loader2, Star } from 'lucide-react';
import { useGetProductRatingQuery, useGetProductReviewsQuery } from '@/lib/api/productsApi';
import { useCreateReviewMutation } from '@/lib/api/userContentApi';
import { useGetProfileQuery } from '@/lib/api/authApi';
import { tokenStorage } from '@/lib/api/tokenStorage';
import { getApiErrorMessage } from '@/lib/useAddToCart';
import { useMounted } from '@/lib/useMounted';

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`Оценка ${value} из 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
      ))}
    </span>
  );
}

const date = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

// Mahsulot sharhlari: GET /catalog/products/{id}/rating/ va /reviews/, yozish — POST /user/reviews/
export default function ProductReviews({ productId }: { productId: number }) {
  const mounted = useMounted();
  const hasToken = mounted && !!tokenStorage.getAccess();
  const { data: profile } = useGetProfileQuery(undefined, { skip: !hasToken });
  const [page, setPage] = useState(1);
  const rating = useGetProductRatingQuery(productId);
  const reviews = useGetProductReviewsQuery({ id: productId, page });
  const [createReview, { isLoading: sending }] = useCreateReviewMutation();

  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [sent, setSent] = useState(false);

  const total = rating.data?.review_count ?? 0;
  const list = reviews.data?.results ?? [];
  const pages = reviews.data?.pages ?? 1;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stars) return toast.error('Поставьте оценку от 1 до 5');
    if (comment.trim().length < 5) return toast.error('Напишите пару слов о товаре');
    try {
      await createReview({
        product: productId,
        rating: stars,
        comment: comment.trim(),
        author_name: name.trim() || profile?.first_name || profile?.full_name || 'Покупатель',
      }).unwrap();
      setSent(true);
      setStars(0);
      setComment('');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Не удалось отправить отзыв'));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-8">
      {/* Reyting */}
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <span className="text-4xl font-bold text-gray-900 tabular-nums">
            {(rating.data?.average_rating ?? 0).toFixed(1)}
          </span>
          <span>
            <Stars value={rating.data?.average_rating ?? 0} size={18} />
            <span className="block text-xs text-gray-500 mt-1">{total} отзывов</span>
          </span>
        </div>
        <ul className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((n) => {
            const count = rating.data?.distribution?.[String(n) as '1'] ?? 0;
            return (
              <li key={n} className="grid grid-cols-[16px_1fr_28px] items-center gap-2 text-xs text-gray-500">
                <span className="tabular-nums">{n}</span>
                <span className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <span className="block h-full bg-amber-400 rounded-full" style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
                </span>
                <span className="tabular-nums text-right">{count}</span>
              </li>
            );
          })}
        </ul>

        {/* Sharh yozish */}
        <div className="border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Оставить отзыв</h3>
          {!hasToken ? (
            <p className="text-xs text-gray-500">
              <Link href="/kantak" className="text-blue-600 hover:underline">Войдите</Link>, чтобы оставить отзыв.
            </p>
          ) : sent ? (
            <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-3">
              Спасибо! Отзыв отправлен и появится после проверки модератором.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Оценка">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={stars === n}
                    aria-label={`${n} из 5`}
                    onMouseEnter={() => setHover(n)}
                    onClick={() => setStars(n)}
                  >
                    <Star size={24} className={n <= (hover || stars) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                  </button>
                ))}
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={profile?.first_name || 'Ваше имя'}
                aria-label="Ваше имя"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Что понравилось, что нет, как используете"
                aria-label="Текст отзыва"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold uppercase py-3 rounded-lg flex items-center justify-center gap-2"
              >
                {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                Отправить
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Ro'yxat */}
      <div>
        {reviews.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="text-sm text-gray-500 py-6">Отзывов пока нет — станьте первым, кто поделится мнением о товаре.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {list.map((r) => (
              <li key={r.id} className="py-5 first:pt-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold text-gray-900">{r.author_name || 'Покупатель'}</span>
                  <Stars value={r.rating} size={14} />
                  <span className="text-xs text-gray-400">{date(r.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700 mt-2 leading-relaxed whitespace-pre-line">{r.comment}</p>
              </li>
            ))}
          </ul>
        )}
        {pages > 1 && (
          <div className="flex items-center gap-3 mt-4 text-sm">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="text-blue-600 disabled:text-gray-300">
              ← Назад
            </button>
            <span className="text-gray-500 tabular-nums">{page} / {pages}</span>
            <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="text-blue-600 disabled:text-gray-300">
              Далее →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
