'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CheckCircle2, CreditCard, FileText, Loader2, MapPin, RefreshCw, ShoppingCart, Wallet, X } from 'lucide-react';
import { useApplyPromoMutation, useGetCartQuery, useRemovePromoMutation } from '@/lib/api/cartApi';
import {
  useCreateInvoiceMutation,
  useCreateOrderMutation,
  useGetCitiesQuery,
  useCreatePaymentQrMutation,
  useGetMyOrderQuery,
  useGetMyOrderPaymentsQuery,
  useInitPaymentMutation,
  useSyncPaymentMutation,
} from '@/lib/api/ordersApi';
import type { DeliveryType, OrderDetail, PaymentMethod, QrResponse } from '@/lib/api/types';
import { NO_IMAGE } from '@/lib/api/mappers';
import { getApiErrorMessage } from '@/lib/useAddToCart';
import { useMounted } from '@/lib/useMounted';

const PICKUP_ADDRESS = 'г. Черкесск, ул. Октябрьская, д. 301';
const rub = (v: string | number) => `${Math.round(Number(v)).toLocaleString('ru-RU')} ₽`;
const inputCls =
  'w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500';

const PAYMENT_OPTIONS: { value: PaymentMethod; title: string; text: string; icon: React.ElementType }[] = [
  { value: 'card', title: 'Картой онлайн', text: 'Оплата через click.uz по QR-коду или ссылке сразу после оформления.', icon: CreditCard },
  { value: 'on_delivery', title: 'При получении', text: 'Наличными или картой курьеру либо на кассе при самовывозе.', icon: Wallet },
  { value: 'invoice', title: 'Счёт на оплату', text: 'Для юридических лиц: счёт придёт на указанный номер телефона.', icon: FileText },
];

type Step = { kind: 'form' } | { kind: 'pay'; order: OrderDetail } | { kind: 'done'; order: OrderDetail };

// Mehmon buyurtmasi: akkaunt shart emas — savat va buyurtma sessionid cookie'siga bog'langan
export default function CheckoutPage() {
  const mounted = useMounted();
  const [step, setStep] = useState<Step>({ kind: 'form' });

  if (!mounted) return <div className="max-w-7xl mx-auto px-4 py-20" />;
  if (step.kind === 'pay') return <PaymentStep order={step.order} onDone={(order) => setStep({ kind: 'done', order })} />;
  if (step.kind === 'done') return <OrderDone order={step.order} />;
  return (
    <CheckoutForm
      onCreated={(order) =>
        setStep(order.payment_method === 'on_delivery' ? { kind: 'done', order } : { kind: 'pay', order })
      }
    />
  );
}

function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 text-slate-800">
      <nav aria-label="Навигация" className="flex items-center gap-2 text-xs text-gray-500 mb-3">
        <Link href="/" className="hover:text-blue-600">Стройоптторг</Link>
        <span className="text-gray-300">/</span>
        <Link href="/karzinka" className="hover:text-blue-600">Корзина</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-400">{title}</span>
      </nav>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">{title}</h1>
      {children}
    </div>
  );
}

// ---------- 1-qadam: forma ----------
function CheckoutForm({ onCreated }: { onCreated: (order: OrderDetail) => void }) {
  const { data: cart, isLoading: cartLoading } = useGetCartQuery();
  const { data: cities = [] } = useGetCitiesQuery();
  const [createOrder, { isLoading: creating }] = useCreateOrderMutation();
  const [applyPromo, { isLoading: applying }] = useApplyPromoMutation();
  const [removePromo] = useRemovePromoMutation();

  const [delivery, setDelivery] = useState<DeliveryType>('pickup');
  const [payment, setPayment] = useState<PaymentMethod>('on_delivery');
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });
  const [address, setAddress] = useState({ street: '', house: '', company_name: '' });
  const [cityId, setCityId] = useState<number | ''>('');
  const [promo, setPromo] = useState('');
  const [showPromo, setShowPromo] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const items = cart?.items ?? [];
  const totals = cart?.totals;
  const city = cities.find((c) => c.id === cityId);

  const handleApplyPromo = async () => {
    if (!promo.trim()) return;
    try {
      await applyPromo(promo.trim()).unwrap();
      toast.success('Промокод применён');
      setPromo('');
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Промокод не найден'));
    }
  };

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!customer.name.trim()) e.name = 'Укажите имя';
    if (customer.phone.replace(/\D/g, '').length < 9) e.phone = 'Укажите телефон';
    if (customer.email && !/^\S+@\S+\.\S+$/.test(customer.email)) e.email = 'Неверный email';
    if (delivery === 'delivery') {
      if (!cityId && cities.length) e.city = 'Выберите город';
      if (!address.street.trim()) e.street = 'Укажите улицу';
      if (!address.house.trim()) e.house = 'Укажите дом';
    }
    if (!agreed) e.agreed = 'Подтвердите согласие с обработкой персональных данных';
    setErrors(e);
    if (Object.keys(e).length) return;

    try {
      // POST /orders/ — narx va qoldiq backend'da qayta tekshiriladi, savat bo'shatiladi
      const order = await createOrder({
        customer_name: customer.name.trim(),
        customer_phone: customer.phone.trim(),
        customer_email: customer.email.trim() || undefined,
        delivery_type: delivery,
        payment_method: payment,
        ...(delivery === 'delivery'
          ? {
              address: { street: address.street.trim(), house: address.house.trim(), company_name: address.company_name.trim() || undefined },
              city_id: cityId || undefined,
            }
          : {}),
      }).unwrap();
      toast.success(`Заказ №${order.number} оформлен`);
      onCreated(order);
    } catch (err) {
      // Maydon xatolari: {"customer_phone": ["..."]} -> forma ostida
      const data = (err as { data?: Record<string, unknown> }).data;
      if (data && typeof data === 'object') {
        const pick = (k: string) => {
          const v = data[k];
          return Array.isArray(v) ? String(v[0]) : typeof v === 'string' ? v : undefined;
        };
        const fieldErrors = Object.fromEntries(
          ([['name', 'customer_name'], ['phone', 'customer_phone'], ['email', 'customer_email'], ['city', 'city_id']] as const)
            .map(([f, k]) => [f, pick(k)])
            .filter(([, v]) => v)
        );
        if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      }
      toast.error(getApiErrorMessage(err, 'Не удалось оформить заказ'));
    }
  };

  if (cartLoading) {
    return (
      <PageShell title="Оформление заказа">
        <div className="h-96 rounded-2xl bg-gray-100 animate-pulse" />
      </PageShell>
    );
  }

  if (!items.length) {
    return (
      <PageShell title="Оформление заказа">
        <div className="max-w-lg bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center mx-auto">
          <ShoppingCart className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">В корзине нет товаров</h2>
          <p className="text-sm text-gray-500 mt-2">Добавьте товары из каталога, чтобы оформить заказ.</p>
          <Link href="/catalog" className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold uppercase px-5 py-3 rounded-xl">
            Перейти в каталог
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Оформление заказа">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-8">
          {/* Покупатель */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Покупатель</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                ['name', 'Имя *', 'Иван Иванов', 'text', 'name'],
                ['phone', 'Телефон *', '+998 90 000-00-00', 'tel', 'tel'],
                ['email', 'Email', 'mail@example.com', 'email', 'email'],
              ] as const).map(([key, label, placeholder, type, autoComplete]) => (
                <label key={key} className="block">
                  <span className="block text-xs font-medium text-gray-700 mb-1.5">{label}</span>
                  <input
                    type={type}
                    autoComplete={autoComplete}
                    value={customer[key]}
                    onChange={(e) => setCustomer({ ...customer, [key]: e.target.value })}
                    placeholder={placeholder}
                    className={`${inputCls} ${errors[key] ? 'border-red-400' : ''}`}
                  />
                  {errors[key] && <span className="block text-xs text-red-500 mt-1">{errors[key]}</span>}
                </label>
              ))}
            </div>
          </section>

          {/* Доставка */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">Доставка</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {([
                { value: 'pickup', title: 'Самовывоз', text: 'К вашему приезду заказ будет скомплектован и готов к выдаче.' },
                { value: 'delivery', title: 'Доставка магазина', text: 'Привезём заказ по вашему адресу. Стоимость зависит от веса и расстояния.' },
              ] as const).map((o) => (
                <label
                  key={o.value}
                  className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    delivery === o.value ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span>
                    <span className="flex items-center gap-2 mb-2">
                      <input
                        type="radio"
                        name="delivery"
                        checked={delivery === o.value}
                        onChange={() => setDelivery(o.value)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="font-semibold text-sm text-gray-900">{o.title}</span>
                    </span>
                    <span className="block text-xs text-gray-500 leading-relaxed">{o.text}</span>
                  </span>
                  {o.value === 'pickup' && (
                    <span className="mt-4 p-2 bg-gray-50 border border-gray-100 rounded-lg flex items-center gap-1.5 text-xs text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {PICKUP_ADDRESS}
                    </span>
                  )}
                </label>
              ))}
            </div>

            {delivery === 'delivery' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <h3 className="sm:col-span-2 text-sm font-semibold text-gray-900">Адрес доставки</h3>
                <label className="block sm:col-span-2">
                  <span className="block text-xs font-medium text-gray-700 mb-1.5">Город *</span>
                  <select
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : '')}
                    className={`${inputCls} ${errors.city ? 'border-red-400' : ''}`}
                  >
                    <option value="">Выберите город</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.region ? `, ${c.region}` : ''} — доставка {Number(c.delivery_cost) ? rub(c.delivery_cost) : 'бесплатно'}
                      </option>
                    ))}
                  </select>
                  {errors.city && <span className="block text-xs text-red-500 mt-1">{errors.city}</span>}
                </label>
                {([
                  ['street', 'Улица *', 'ул. Октябрьская'],
                  ['house', 'Дом, квартира *', '301, кв. 12'],
                  ['company_name', 'Компания (для юрлиц)', 'ООО «СтройИнвест»'],
                ] as const).map(([key, label, placeholder]) => (
                  <label key={key} className={`block ${key === 'company_name' ? 'sm:col-span-2' : ''}`}>
                    <span className="block text-xs font-medium text-gray-700 mb-1.5">{label}</span>
                    <input
                      value={address[key]}
                      onChange={(e) => setAddress({ ...address, [key]: e.target.value })}
                      placeholder={placeholder}
                      className={`${inputCls} ${errors[key] ? 'border-red-400' : ''}`}
                    />
                    {errors[key] && <span className="block text-xs text-red-500 mt-1">{errors[key]}</span>}
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* Оплата */}
          <section className="space-y-4 pt-4 border-t border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Оплата</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PAYMENT_OPTIONS.map(({ value, title, text, icon: Icon }) => (
                <label
                  key={value}
                  className={`cursor-pointer p-4 rounded-xl border transition-all ${
                    payment === value ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-2 mb-2">
                    <input
                      type="radio"
                      name="payment"
                      checked={payment === value}
                      onChange={() => setPayment(value)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-sm text-gray-900">{title}</span>
                  </span>
                  <span className="block text-xs text-gray-500 leading-relaxed">{text}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Промокод */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-600">
            {cart?.promo_code ? (
              <div className="flex items-center justify-between gap-3">
                <span>
                  Промокод <strong className="text-gray-900">{cart.promo_code}</strong> применён
                </span>
                <button type="button" onClick={() => removePromo()} aria-label="Удалить промокод" className="text-gray-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <span>Есть промокод? </span>
                <button type="button" onClick={() => setShowPromo(!showPromo)} className="text-blue-600 underline font-medium hover:text-blue-700">
                  Нажмите здесь, чтобы ввести его
                </button>
                {showPromo && (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={promo}
                      onChange={(e) => setPromo(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                      placeholder="Введите промокод"
                      className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={applying || !promo.trim()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold uppercase hover:bg-blue-700 disabled:opacity-50"
                    >
                      Применить
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Ваш заказ */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 lg:sticky lg:top-6">
          <h2 className="text-xl font-bold text-gray-900">Ваш заказ</h2>
          <div className="space-y-4 divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="pt-4 first:pt-0 flex items-start gap-3">
                <div className="relative w-16 h-16 rounded-lg bg-gray-50 shrink-0 border border-gray-100">
                  <Image src={item.product.main_image || NO_IMAGE} alt={item.product.name} fill sizes="64px" className="object-contain p-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">{item.product.name}</h4>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {item.quantity} шт. × {rub(item.price)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-blue-600 shrink-0">{rub(item.total)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-100 text-sm">
            {[
              ['Товары', rub(totals?.subtotal ?? 0)],
              ...(Number(totals?.discount_total) ? [['Скидка', `−${rub(totals!.discount_total)}`]] : []),
              ['Доставка', delivery === 'pickup' ? 'Бесплатно' : city ? (Number(city.delivery_cost) ? rub(city.delivery_cost) : 'Бесплатно') : 'Выберите город'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center text-gray-600">
                <span>{label}</span>
                <span className="border-b border-dotted border-gray-300 flex-1 mx-2" />
                <span className="font-semibold text-gray-900">{value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 text-base font-bold text-gray-900">
              <span>Итого</span>
              <span className="border-b border-dotted border-gray-300 flex-1 mx-2" />
              <span className="text-blue-600">{rub(Number(totals?.total ?? 0) + (delivery === 'delivery' && city ? Number(city.delivery_cost) : 0))}</span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-blue-600" />
              <span className="text-[11px] text-gray-500 leading-tight">
                Согласен с обработкой персональных данных в соответствии с{' '}
                <Link href="/privecyPolicyPage" className="text-blue-600 underline">политикой конфиденциальности</Link>
              </span>
            </label>
            {errors.agreed && <p className="text-xs text-red-500">{errors.agreed}</p>}
            <button
              type="button"
              onClick={submit}
              disabled={creating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-xs py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              Оформить заказ
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ---------- 2-qadam: to'lov ----------
function PaymentStep({ order, onDone }: { order: OrderDetail; onDone: (order: OrderDetail) => void }) {
  const { data: fresh, refetch } = useGetMyOrderQuery(order.id);
  const { data: payments = [] } = useGetMyOrderPaymentsQuery(order.id);
  const [initPayment] = useInitPaymentMutation();
  const [createQr, { isLoading: qrLoading }] = useCreatePaymentQrMutation();
  const [createInvoice, { isLoading: invoicing }] = useCreateInvoiceMutation();
  const [syncPayment, { isLoading: syncing }] = useSyncPaymentMutation();
  const [qr, setQr] = useState<QrResponse | null>(null);
  const [phone, setPhone] = useState(order.customer_phone ?? '');
  const [invoiceSent, setInvoiceSent] = useState(false);
  const [error, setError] = useState('');

  const current = fresh ?? order;
  const paid = !!current.paid_at;

  // Karta: to'lov sessiyasi + click.uz QR kod
  const startCard = async () => {
    setError('');
    try {
      await initPayment({ order_id: order.id, return_url: `${window.location.origin}/kantak` }).unwrap();
      setQr(await createQr({ order_id: order.id, return_url: `${window.location.origin}/kantak` }).unwrap());
    } catch (e) {
      setError(getApiErrorMessage(e, 'Не удалось создать платёж. Попробуйте позже или выберите оплату при получении.'));
    }
  };

  const sendInvoice = async () => {
    setError('');
    if (phone.replace(/\D/g, '').length < 9) return setError('Укажите номер телефона');
    try {
      const res = await createInvoice({ order_id: order.id, phone_number: phone.replace(/[^\d+]/g, '') }).unwrap();
      if (res.error_code && res.error_code < 0) throw { data: res.error_note };
      setInvoiceSent(true);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Не удалось отправить счёт'));
    }
  };

  // To'lov holatini shlyuzdan qayta so'rash
  const check = async () => {
    const last = payments[payments.length - 1];
    try {
      if (last) await syncPayment({ paymentId: last.id, orderId: order.id }).unwrap();
      const res = await refetch().unwrap();
      if (res.paid_at) onDone(res);
      else toast('Оплата пока не поступила. Если вы уже оплатили, проверьте ещё раз через минуту.');
    } catch (e) {
      toast.error(getApiErrorMessage(e, 'Не удалось проверить оплату'));
    }
  };

  if (paid) return <OrderDone order={current} />;

  return (
    <PageShell title="Оплата заказа">
      <div className="max-w-xl mx-auto bg-white border border-gray-100 rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Заказ №{order.number}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{rub(order.total)}</p>
          </div>
          <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">Ожидает оплаты</span>
        </div>

        {order.payment_method === 'card' && (
          <div className="space-y-4">
            {!qr ? (
              <>
                <p className="text-sm text-gray-600">Оплатите заказ в приложении click.uz по QR-коду или по ссылке.</p>
                <button
                  type="button"
                  onClick={startCard}
                  disabled={qrLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-xs py-3.5 rounded-xl uppercase flex items-center justify-center gap-2"
                >
                  {qrLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Перейти к оплате
                </button>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* eslint-disable-next-line @next/next/no-img-element -- base64 QR kod */}
                <img src={qr.qr_image} alt="QR-код для оплаты" className="w-48 h-48 rounded-xl border border-gray-100" />
                <div className="space-y-3 text-sm text-gray-600">
                  <p>Отсканируйте QR-код камерой телефона или откройте ссылку.</p>
                  <a
                    href={qr.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold uppercase px-5 py-3 rounded-xl"
                  >
                    Оплатить на click.uz
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {order.payment_method === 'invoice' && (
          <div className="space-y-4">
            {invoiceSent ? (
              <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl p-4">
                Счёт отправлен на номер {phone}. Оплатите его в приложении банка, затем нажмите «Проверить оплату».
              </p>
            ) : (
              <>
                <label className="block">
                  <span className="block text-xs font-medium text-gray-700 mb-1.5">Телефон для выставления счёта</span>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 000-00-00" className={inputCls} />
                </label>
                <button
                  type="button"
                  onClick={sendInvoice}
                  disabled={invoicing}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-xs py-3.5 rounded-xl uppercase flex items-center justify-center gap-2"
                >
                  {invoicing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Выставить счёт
                </button>
              </>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}

        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={check}
            disabled={syncing}
            className="inline-flex items-center gap-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Проверить оплату
          </button>
          <Link href="/kantak" className="text-sm text-gray-500 hover:text-gray-800 px-2 py-2.5">
            Оплатить позже в личном кабинете
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

// ---------- 3-qadam: tayyor ----------
function OrderDone({ order }: { order: OrderDetail }) {
  return (
    <PageShell title="Заказ оформлен">
      <div className="max-w-xl mx-auto bg-white border border-gray-100 rounded-2xl shadow-sm p-8 text-center">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Спасибо! Заказ №{order.number} принят</h2>
        <p className="text-sm text-gray-500 mt-2">
          {order.paid_at
            ? 'Оплата получена. Мы начнём собирать заказ.'
            : order.delivery_type === 'pickup'
              ? `Мы сообщим, когда заказ будет готов к выдаче по адресу: ${PICKUP_ADDRESS}.`
              : 'Менеджер свяжется с вами, чтобы согласовать время доставки.'}
        </p>
        <p className="text-lg font-semibold text-gray-900 mt-4">{rub(order.total)}</p>
        <div className="flex justify-center gap-3 mt-6">
          <Link href="/kantak" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold uppercase px-5 py-3 rounded-xl">
            Мои заказы
          </Link>
          <Link href="/catalog" className="bg-gray-50 hover:bg-gray-100 text-blue-600 text-xs font-semibold uppercase px-5 py-3 rounded-xl">
            Продолжить покупки
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
