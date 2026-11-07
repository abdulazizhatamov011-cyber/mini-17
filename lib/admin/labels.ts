import type {
  ArticleType,
  DeliveryType,
  LeadStatus,
  LeadType,
  OrderStatus,
  PaymentMethod,
  StockStatus,
} from "./types";

// Badge ranglari: green = bajarilgan, yellow = kutilmoqda, blue = jarayonda,
// red = bekor/xato/qaytarilgan, grey = qoralama
export type Tone = "green" | "yellow" | "blue" | "red" | "grey";

// Narxlar do'kon qismidagi kabi ko'rsatiladi; valyutani shu yerda almashtirish kifoya
export const CURRENCY = "₽";

export const money = (value: string | number | null | undefined) =>
  `${Math.round(Number(value ?? 0)).toLocaleString("ru-RU")} ${CURRENCY}`;

export const num = (value: number | null | undefined) => Number(value ?? 0).toLocaleString("ru-RU");

export const dateTime = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export const dateOnly = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  new: { label: "Новый", tone: "yellow" },
  awaiting_payment: { label: "Ожидает оплаты", tone: "yellow" },
  processing: { label: "В обработке", tone: "blue" },
  assembled: { label: "Собран", tone: "blue" },
  shipped: { label: "В пути", tone: "blue" },
  ready_for_pickup: { label: "Готов к выдаче", tone: "blue" },
  completed: { label: "Выполнен", tone: "green" },
  cancelled: { label: "Отменён", tone: "red" },
  refunded: { label: "Возврат", tone: "red" },
};

// Buyurtmalar sahifasidagi tablar (API bitta status bo'yicha filtrlaydi)
export const ORDER_TABS: { key: string; label: string; status?: OrderStatus }[] = [
  { key: "all", label: "Все" },
  { key: "new", label: "Новые", status: "new" },
  { key: "processing", label: "В обработке", status: "processing" },
  { key: "shipped", label: "В пути", status: "shipped" },
  { key: "completed", label: "Доставлены", status: "completed" },
  { key: "cancelled", label: "Отменены", status: "cancelled" },
  { key: "refunded", label: "Возвраты", status: "refunded" },
];

// To'lov holati alohida maydon emas — paid_at va buyurtma statusidan chiqaramiz
export function paymentState(o: { paid_at: string | null; status: OrderStatus }): { label: string; tone: Tone } {
  if (o.status === "refunded") return { label: "Возвращён", tone: "red" };
  if (o.paid_at) return { label: "Оплачен", tone: "green" };
  if (o.status === "cancelled") return { label: "Не оплачен", tone: "grey" };
  return { label: "Ожидает", tone: "yellow" };
}

export const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  card: "Банковская карта",
  on_delivery: "При получении",
  invoice: "Счёт (безнал)",
};

export const DELIVERY_TYPE: Record<DeliveryType, string> = {
  delivery: "Доставка",
  pickup: "Самовывоз",
};

export const STOCK_STATUS: Record<StockStatus, { label: string; tone: Tone }> = {
  in_stock: { label: "В наличии", tone: "green" },
  low_stock: { label: "Мало", tone: "yellow" },
  out_of_stock: { label: "Нет в наличии", tone: "red" },
  on_order: { label: "Под заказ", tone: "blue" },
};

export const LEAD_STATUS: Record<LeadStatus, { label: string; tone: Tone }> = {
  new: { label: "Новая", tone: "yellow" },
  in_progress: { label: "В работе", tone: "blue" },
  done: { label: "Обработана", tone: "green" },
  rejected: { label: "Отклонена", tone: "red" },
};

export const LEAD_TYPE: Record<LeadType, string> = {
  callback: "Обратный звонок",
  price_request: "Запрос цены",
  consultation: "Консультация",
  one_click: "Купить в 1 клик",
};

export const ARTICLE_TYPE: Record<ArticleType, string> = {
  news: "Новость",
  article: "Статья",
  blog: "Совет",
};

// Backend xatosidan matn olish ({"field": ["msg"]} / {"detail": "..."})
// Backend xatosini qisqa matnga aylantirish: "401 · Войдите как сотрудник"
const SHORT_ERRORS: Record<number, string> = {
  401: "Войдите как сотрудник",
  403: "Нет прав администратора",
  404: "Не найдено",
  405: "Действие недоступно",
  409: "Конфликт данных",
  413: "Файл слишком большой",
  429: "Слишком много запросов, подождите",
};

export function apiError(error: unknown, fallback = "Не удалось сохранить изменения") {
  const err = error as { status?: number | string; originalStatus?: number; data?: unknown };
  if (err?.status === "FETCH_ERROR") return "Нет соединения с сервером";
  if (err?.status === "TIMEOUT_ERROR") return "Сервер не ответил вовремя";
  // PARSING_ERROR: server JSON o'rniga HTML qaytardi (odatda 500)
  const code = typeof err?.status === "number" ? err.status : err?.originalStatus;
  if (code && code >= 500) return `${code} · Ошибка сервера`;
  if (code && SHORT_ERRORS[code]) return `${code} · ${SHORT_ERRORS[code]}`;

  // 400: birinchi maydon xatosi — "price: Ensure this value..." -> "price: ..."
  const data = err?.data;
  if (data && typeof data === "object") {
    const [key, value] = Object.entries(data as Record<string, unknown>)[0] ?? [];
    const msg = Array.isArray(value) ? value[0] : value;
    if (typeof msg === "string") {
      const short = msg.length > 90 ? `${msg.slice(0, 87)}…` : msg;
      return `${code ? `${code} · ` : ""}${key && key !== "detail" ? `${key}: ` : ""}${short}`;
    }
  }
  return code ? `${code} · ${fallback}` : fallback;
}

// Backend media fayli nisbiy (/media/...) bo'lsa — backend domenini qo'shamiz
const MEDIA_HOST = (process.env.NEXT_PUBLIC_API_URL ?? "https://yeteper714.pythonanywhere.com").replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
export const mediaUrl = (src: string | null | undefined) =>
  !src
    ? "/images/no-image.svg"
    : /^(https?:|blob:|data:)/.test(src) || (src.startsWith("/") && !src.startsWith("/media"))
      ? src // to'liq URL yoki saytning o'z rasmi (/images/...)
      : `${MEDIA_HOST}${src.startsWith("/") ? "" : "/"}${src}`;
