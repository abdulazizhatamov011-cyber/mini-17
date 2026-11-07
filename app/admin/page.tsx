"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { useAdminList } from "@/lib/admin/adminApi";
import type {
  AdminCategory,
  AdminOrder,
  AdminProduct,
  AdminStock,
  AdminUser,
  PaymentMethod,
} from "@/lib/admin/types";
import { ORDER_STATUS, PAYMENT_METHOD, STOCK_STATUS, apiError, dateTime, money, num } from "@/lib/admin/labels";
import { previousRange, useAdminRange } from "@/components/admin/AdminContext";
import { BarList, Donut, LineChart } from "@/components/admin/charts";
import { Badge, Card, EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/admin/ui";

const BIG = { page_size: 500 };
// Tushumga bekor qilingan va qaytarilgan buyurtmalar kirmaydi
const COUNTED = (o: AdminOrder) => o.status !== "cancelled" && o.status !== "refunded";
const inRange = (iso: string, from: Date, to: Date) => {
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t <= to.getTime();
};

function Kpi({
  label,
  value,
  current,
  previous,
  loading,
}: {
  label: string;
  value: string;
  current: number;
  previous: number;
  loading: boolean;
}) {
  const change = previous ? ((current - previous) / previous) * 100 : current ? 100 : 0;
  const Icon = change > 0.5 ? ArrowUpRight : change < -0.5 ? ArrowDownRight : Minus;
  const color = change > 0.5 ? "text-emerald-600" : change < -0.5 ? "text-[#EE0906]" : "text-gray-500";
  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(16,24,40,0.06)] p-5">
      <p className="text-[13px] text-gray-500">{label}</p>
      {loading ? (
        <Skeleton className="h-8 w-32 mt-2" />
      ) : (
        <p className="text-2xl font-bold text-gray-900 mt-1.5 tabular-nums">{value}</p>
      )}
      <p className={`flex items-center gap-1 text-xs mt-2 ${color}`}>
        <Icon size={14} />
        <span className="tabular-nums font-medium">{Math.abs(change).toFixed(1)}%</span>
        <span className="text-gray-400">к прошлому периоду</span>
      </p>
    </div>
  );
}

type Granularity = "day" | "week" | "month";

function bucketKey(d: Date, g: Granularity) {
  if (g === "month") return `${d.getFullYear()}-${d.getMonth()}`;
  if (g === "week") {
    const monday = new Date(d);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return monday.toDateString();
  }
  return d.toDateString();
}

export default function DashboardPage() {
  const { range } = useAdminRange();
  const prev = previousRange(range);
  const days = Math.round((range.to.getTime() - range.from.getTime()) / 86_400_000) + 1;
  const [granularity, setGranularity] = useState<Granularity>(days > 120 ? "month" : days > 31 ? "week" : "day");

  const orders = useAdminList<AdminOrder>("orders", { ...BIG, ordering: "-created_at" });
  const users = useAdminList<AdminUser>("users", { ...BIG, ordering: "-date_joined" });
  const products = useAdminList<AdminProduct>("products", BIG);
  const categories = useAdminList<AdminCategory>("categories", BIG);
  const lowStock = useAdminList<AdminStock>("stock", { status: "low_stock", page_size: 6 });
  const outOfStock = useAdminList<AdminStock>("stock", { status: "out_of_stock", page_size: 6 });

  const loading = orders.isLoading;
  const all = useMemo(() => orders.data?.results ?? [], [orders.data]);

  const stats = useMemo(() => {
    const calc = (from: Date, to: Date) => {
      const list = all.filter((o) => inRange(o.created_at, from, to) && COUNTED(o));
      const revenue = list.reduce((s, o) => s + Number(o.total), 0);
      const paid = list.filter((o) => o.paid_at).reduce((s, o) => s + Number(o.total), 0);
      const items = list.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0);
      const customers = (users.data?.results ?? []).filter((u) => inRange(u.date_joined, from, to)).length;
      return { list, revenue, paid, count: list.length, avg: list.length ? revenue / list.length : 0, items, customers };
    };
    return { cur: calc(range.from, range.to), prev: calc(prev.from, prev.to) };
  }, [all, users.data, range, prev.from, prev.to]);

  // Tushum grafigi: tanlangan davrdagi har bir kun/hafta/oy
  const series = useMemo(() => {
    const buckets = new Map<string, { label: string; value: number }>();
    const cursor = new Date(range.from);
    while (cursor <= range.to) {
      const key = bucketKey(cursor, granularity);
      if (!buckets.has(key)) {
        const label =
          granularity === "month"
            ? cursor.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" })
            : cursor.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
        buckets.set(key, { label, value: 0 });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    for (const o of stats.cur.list) {
      const b = buckets.get(bucketKey(new Date(o.created_at), granularity));
      if (b) b.value += Number(o.total);
    }
    return [...buckets.values()];
  }, [stats.cur.list, range, granularity]);

  // Kategoriyalar bo'yicha sotuv (yuqori darajadagi kategoriya)
  const byCategory = useMemo(() => {
    const cats = new Map((categories.data?.results ?? []).map((c) => [c.id, c]));
    const root = (id: number | undefined) => {
      let c = id !== undefined ? cats.get(id) : undefined;
      while (c?.parent && cats.get(c.parent)) c = cats.get(c.parent);
      return c?.name ?? "Без категории";
    };
    const productCat = new Map((products.data?.results ?? []).map((p) => [p.id, p.category]));
    const totals = new Map<string, number>();
    for (const o of stats.cur.list)
      for (const i of o.items) {
        const name = root(i.product ? productCat.get(i.product) : undefined);
        totals.set(name, (totals.get(name) ?? 0) + Number(i.price) * i.quantity);
      }
    return [...totals].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [stats.cur.list, categories.data, products.data]);

  const byPayment = useMemo(() => {
    const totals: Record<PaymentMethod, number> = { card: 0, on_delivery: 0, invoice: 0 };
    for (const o of stats.cur.list) totals[o.payment_method] += Number(o.total);
    return (Object.keys(totals) as PaymentMethod[]).map((k) => ({ label: PAYMENT_METHOD[k], value: totals[k] }));
  }, [stats.cur.list]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; article: string; qty: number; revenue: number; id: number | null }>();
    for (const o of stats.cur.list)
      for (const i of o.items) {
        const key = String(i.product ?? i.article_snapshot);
        const row = map.get(key) ?? { name: i.name_snapshot, article: i.article_snapshot, qty: 0, revenue: 0, id: i.product };
        row.qty += i.quantity;
        row.revenue += Number(i.price) * i.quantity;
        map.set(key, row);
      }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [stats.cur.list]);

  const awaitingPayment = all.filter((o) => o.status === "awaiting_payment").slice(0, 5);
  const stockAlerts = [...(outOfStock.data?.results ?? []), ...(lowStock.data?.results ?? [])].slice(0, 6);
  const { cur, prev: p } = stats;

  if (orders.error) {
    return (
      <>
        <PageHeader title="Дашборд" />
        <Card>
          <ErrorState message={apiError(orders.error, "Не удалось получить заказы")} onRetry={orders.refetch} />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Дашборд"
        description={`${range.from.toLocaleDateString("ru-RU")} — ${range.to.toLocaleDateString("ru-RU")} · сравнение с предыдущим периодом такой же длины`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 mb-6">
        <Kpi label="Выручка" value={money(cur.revenue)} current={cur.revenue} previous={p.revenue} loading={loading} />
        <Kpi label="Оплачено" value={money(cur.paid)} current={cur.paid} previous={p.paid} loading={loading} />
        <Kpi label="Заказы" value={num(cur.count)} current={cur.count} previous={p.count} loading={loading} />
        <Kpi label="Средний чек" value={money(cur.avg)} current={cur.avg} previous={p.avg} loading={loading} />
        <Kpi label="Продано товаров" value={num(cur.items)} current={cur.items} previous={p.items} loading={loading} />
        <Kpi
          label="Новые клиенты"
          value={num(cur.customers)}
          current={cur.customers}
          previous={p.customers}
          loading={users.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <Card
          title="Выручка"
          className="xl:col-span-2"
          actions={
            <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
              {(["day", "week", "month"] as Granularity[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGranularity(g)}
                  className={`px-2.5 h-7 rounded-md ${granularity === g ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
                >
                  {{ day: "Дни", week: "Недели", month: "Месяцы" }[g]}
                </button>
              ))}
            </div>
          }
        >
          {loading ? <Skeleton className="h-64 w-full" /> : <LineChart points={series} format={money} />}
        </Card>

        <Card title="Способы оплаты">
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : cur.revenue === 0 ? (
            <EmptyState title="Нет оплат за период" />
          ) : (
            <Donut items={byPayment} format={money} centerLabel="всего" />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <Card title="Продажи по категориям">
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : byCategory.length === 0 ? (
            <EmptyState title="Нет продаж за период" />
          ) : (
            <BarList items={byCategory} format={money} />
          )}
        </Card>

        <Card title="Топ товаров" bodyClassName="p-0" actions={<Link href="/admin/products" className="text-sm text-[#012F91] hover:underline">Все товары</Link>}>
          {topProducts.length === 0 ? (
            <EmptyState title="Нет продаж за период" />
          ) : (
            <table className="w-full text-sm tabular-nums">
              <thead className="text-xs text-gray-500 bg-gray-50">
                <tr>
                  <th className="text-left font-medium px-5 py-2.5">Товар</th>
                  <th className="text-right font-medium px-5 py-2.5">Кол-во</th>
                  <th className="text-right font-medium px-5 py-2.5">Выручка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topProducts.map((t) => (
                  <tr key={`${t.id}-${t.article}`}>
                    <td className="px-5 py-3">
                      {t.id ? (
                        <Link href={`/admin/products/${t.id}`} className="text-gray-900 hover:text-[#012F91] line-clamp-1">
                          {t.name}
                        </Link>
                      ) : (
                        <span className="text-gray-900 line-clamp-1">{t.name}</span>
                      )}
                      <span className="block text-xs text-gray-400">{t.article}</span>
                    </td>
                    <td className="px-5 py-3 text-right">{num(t.qty)}</td>
                    <td className="px-5 py-3 text-right font-medium">{money(t.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card
          title="Последние заказы"
          className="xl:col-span-2"
          bodyClassName="p-0"
          actions={<Link href="/admin/orders" className="text-sm text-[#012F91] hover:underline">Все заказы</Link>}
        >
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : all.length === 0 ? (
            <EmptyState title="Заказов пока нет" text="Новые заказы с сайта появятся здесь." />
          ) : (
            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-sm tabular-nums">
                <thead className="text-xs text-gray-500 bg-gray-50">
                  <tr>
                    <th className="text-left font-medium px-5 py-2.5">Заказ</th>
                    <th className="text-left font-medium px-5 py-2.5">Клиент</th>
                    <th className="text-left font-medium px-5 py-2.5">Статус</th>
                    <th className="text-right font-medium px-5 py-2.5">Сумма</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {all.slice(0, 6).map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link href={`/admin/orders/${o.id}`} className="font-medium text-[#012F91] hover:underline">
                          №{o.number}
                        </Link>
                        <span className="block text-xs text-gray-400">{dateTime(o.created_at)}</span>
                      </td>
                      <td className="px-5 py-3 text-gray-700 max-w-48 truncate">{o.customer_email}</td>
                      <td className="px-5 py-3">
                        <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-medium">{money(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Мало на складе" bodyClassName="p-0" actions={<Link href="/admin/stock" className="text-sm text-[#012F91] hover:underline">Склад</Link>}>
            {stockAlerts.length === 0 ? (
              <EmptyState title="Остатков достаточно" />
            ) : (
              <ul className="divide-y divide-gray-100">
                {stockAlerts.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <Link href={`/admin/products/${s.product}`} className="text-gray-800 hover:text-[#012F91] line-clamp-1">
                      {s.product_name}
                    </Link>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="tabular-nums text-gray-500">{num(s.quantity)} шт.</span>
                      <Badge tone={STOCK_STATUS[s.status].tone}>{STOCK_STATUS[s.status].label}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Ожидают оплаты" bodyClassName="p-0">
            {awaitingPayment.length === 0 ? (
              <EmptyState title="Неоплаченных заказов нет" />
            ) : (
              <ul className="divide-y divide-gray-100">
                {awaitingPayment.map((o) => (
                  <li key={o.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <Link href={`/admin/orders/${o.id}`} className="text-[#012F91] hover:underline">
                      №{o.number}
                    </Link>
                    <span className="tabular-nums font-medium">{money(o.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
