"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, RefreshCw, X } from "lucide-react";
import {
  useCancelMyOrderMutation,
  useCreatePaymentQrMutation,
  useGetMyOrderPaymentsQuery,
  useGetMyOrderQuery,
  useInitPaymentMutation,
  useSyncPaymentMutation,
} from "@/lib/api/ordersApi";
import type { QrResponse } from "@/lib/api/types";
import { getApiErrorMessage } from "@/lib/useAddToCart";

const rub = (v: string | number) => `${Math.round(Number(v)).toLocaleString("ru-RU")} ₽`;
const PAYMENT: Record<string, string> = { card: "Картой онлайн", on_delivery: "При получении", invoice: "Счёт на оплату" };
const DELIVERY: Record<string, string> = { delivery: "Доставка", pickup: "Самовывоз" };
// Backend faqat shu holatlarda bekor qilishga ruxsat beradi
const CANCELLABLE = ["new", "awaiting_payment", "processing"];

// Shaxsiy kabinet: GET /user/orders/{id}/, bekor qilish va to'lash
export default function OrderDetailModal({ orderId, onClose }: { orderId: number; onClose: () => void }) {
  const { data: order, isLoading, isError, refetch } = useGetMyOrderQuery(orderId);
  const { data: payments = [] } = useGetMyOrderPaymentsQuery(orderId);
  const [cancel, { isLoading: cancelling }] = useCancelMyOrderMutation();
  const [initPayment] = useInitPaymentMutation();
  const [createQr, { isLoading: qrLoading }] = useCreatePaymentQrMutation();
  const [sync, { isLoading: syncing }] = useSyncPaymentMutation();
  const [qr, setQr] = useState<QrResponse | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const canCancel = order && CANCELLABLE.includes(order.status);
  const canPay =
    order && order.payment_method === "card" && !order.paid_at && !["cancelled", "refunded"].includes(order.status);

  const doCancel = async () => {
    try {
      await cancel(orderId).unwrap();
      toast.success("Заказ отменён");
      setConfirmCancel(false);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Не удалось отменить заказ"));
    }
  };

  const pay = async () => {
    try {
      const returnUrl = `${window.location.origin}/kantak`;
      await initPayment({ order_id: orderId, return_url: returnUrl }).unwrap();
      setQr(await createQr({ order_id: orderId, return_url: returnUrl }).unwrap());
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Не удалось создать платёж"));
    }
  };

  const checkPayment = async () => {
    const last = payments[payments.length - 1];
    try {
      if (last) await sync({ paymentId: last.id, orderId }).unwrap();
      const res = await refetch().unwrap();
      if (res.paid_at) toast.success("Оплата получена");
      else toast("Оплата пока не поступила");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Не удалось проверить оплату"));
    }
  };

  const address =
    order?.address_snapshot && typeof order.address_snapshot === "object"
      ? Object.values(order.address_snapshot).filter((v) => typeof v === "string" && v).join(", ")
      : "";

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Детали заказа"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
      >
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-slate-900">{order ? `Заказ №${order.number}` : "Заказ"}</h2>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-5 rounded bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : isError || !order ? (
            <p className="text-sm text-red-600">Не удалось загрузить заказ.</p>
          ) : (
            <>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-gray-400">Статус</dt>
                  <dd className="font-semibold text-slate-800">{order.status_display}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Дата</dt>
                  <dd className="text-slate-800">{new Date(order.created_at).toLocaleDateString("ru-RU")}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Оплата</dt>
                  <dd className="text-slate-800">
                    {PAYMENT[order.payment_method] ?? order.payment_method}
                    <span className={`block text-xs ${order.paid_at ? "text-emerald-600" : "text-amber-600"}`}>
                      {order.paid_at ? "оплачен" : "не оплачен"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-400">Получение</dt>
                  <dd className="text-slate-800">{DELIVERY[order.delivery_type] ?? order.delivery_type}</dd>
                </div>
              </dl>
              {address && <p className="text-sm text-gray-600">Адрес: {address}</p>}

              <ul className="divide-y divide-gray-100 border-y border-gray-100">
                {order.items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <span className="min-w-0">
                      {i.product ? (
                        <Link href={`/products/${i.product}`} className="text-slate-800 hover:text-blue-600 line-clamp-2">
                          {i.name_snapshot}
                        </Link>
                      ) : (
                        <span className="text-slate-800">{i.name_snapshot}</span>
                      )}
                      <span className="block text-xs text-gray-400">
                        {i.quantity} шт. × {rub(i.price)}
                      </span>
                    </span>
                    <span className="font-semibold text-slate-900 shrink-0">{rub(i.total)}</span>
                  </li>
                ))}
              </ul>

              <dl className="space-y-1.5 text-sm ml-auto max-w-xs">
                <div className="flex justify-between text-gray-600">
                  <dt>Товары</dt>
                  <dd>{rub(order.subtotal)}</dd>
                </div>
                {Number(order.cart_discount) + Number(order.promo_discount) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <dt>Скидка</dt>
                    <dd className="text-red-600">−{rub(Number(order.cart_discount) + Number(order.promo_discount))}</dd>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <dt>Доставка</dt>
                  <dd>{Number(order.delivery_cost) ? rub(order.delivery_cost) : "—"}</dd>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-gray-100">
                  <dt>Итого</dt>
                  <dd>{rub(order.total)}</dd>
                </div>
              </dl>

              {qr && (
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element -- base64 QR kod */}
                  <img src={qr.qr_image} alt="QR-код для оплаты" className="w-40 h-40 rounded-lg bg-white" />
                  <div className="space-y-3 text-sm text-gray-600">
                    <p>Отсканируйте QR-код в приложении click.uz или откройте ссылку.</p>
                    <a href={qr.payment_url} target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold uppercase px-4 py-2.5 rounded-lg">
                      Оплатить на click.uz
                    </a>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {canPay && !qr && (
                  <button
                    type="button"
                    onClick={pay}
                    disabled={qrLoading}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold uppercase px-5 py-3 rounded-xl"
                  >
                    {qrLoading && <Loader2 size={14} className="animate-spin" />}
                    Оплатить заказ
                  </button>
                )}
                {canPay && (
                  <button
                    type="button"
                    onClick={checkPayment}
                    disabled={syncing}
                    className="inline-flex items-center gap-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl"
                  >
                    <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                    Проверить оплату
                  </button>
                )}
                {canCancel &&
                  (confirmCancel ? (
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Отменить заказ?</span>
                      <button
                        type="button"
                        onClick={doCancel}
                        disabled={cancelling}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl"
                      >
                        Да, отменить
                      </button>
                      <button type="button" onClick={() => setConfirmCancel(false)} className="text-gray-500 px-2">
                        Нет
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(true)}
                      className="text-sm text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl"
                    >
                      Отменить заказ
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
