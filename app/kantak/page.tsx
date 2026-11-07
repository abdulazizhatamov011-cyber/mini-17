"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import LoginForm from "@/components/auth/LoginForm";
import CabinetShell, { CABINET_ITEMS, type CabinetTab } from "@/components/cabinet/CabinetShell";
import FavoritesContent from "@/components/cabinet/FavoritesContent";
import OrderDetailModal from "@/components/cabinet/OrderDetailModal";
import {
  User,
  MapPin,
  Heart,
  ShieldCheck,
  LogOut,
  ChevronRight,
  ListOrdered,
  Trash2,
} from "lucide-react";
import {
  useAddAddressMutation,
  useChangePasswordMutation,
  useDeleteAddressMutation,
  useGetAddressesQuery,
  useGetMyOrdersQuery,
  useGetProfileQuery,
  useLogoutMutation,
  useSetDefaultAddressMutation,
  useUpdateProfileMutation,
} from "@/lib/api/authApi";
import type { OrderStatus } from "@/lib/api/types";
import { PASSWORD_HINT, passwordProblem, translateError } from "@/lib/passwordRules";

// Buyurtma statusi -> badge rangi
const STATUS_COLOR: Record<OrderStatus, "orange" | "green" | "red"> = {
  new: "orange",
  awaiting_payment: "orange",
  processing: "orange",
  assembled: "orange",
  shipped: "orange",
  ready_for_pickup: "green",
  completed: "green",
  cancelled: "red",
  refunded: "red",
};

const BADGE: Record<"orange" | "green" | "red", string> = {
  orange: "text-orange-600 bg-orange-50 border-orange-200",
  green: "text-emerald-600 bg-emerald-50 border-emerald-200",
  red: "text-red-600 bg-red-50 border-red-200",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// DRF xatosini o'qiladigan matnga aylantirish
function errorText(error: unknown, fallback: string) {
  const data = (error as { data?: unknown })?.data;
  if (data && typeof data === "object") {
    const text = Object.values(data as Record<string, unknown>)
      .flatMap((v) => (Array.isArray(v) ? v : [v]))
      .map((m) => translateError(String(m)))
      .join(" ");
    if (text) return text;
  }
  return fallback;
}

const inputClass =
  "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#005bff]";
const primaryButton =
  "px-6 py-3 bg-[#005bff] hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg disabled:opacity-50";

const VALID_TABS = CABINET_ITEMS.map((i) => i.id) as string[];

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <Cabinet />
    </Suspense>
  );
}

function Cabinet() {
  // /kantak?tab=favorites kabi havolalar kerakli bo'limni ochadi
  const initialTab = useSearchParams().get("tab");
  const [activeTab, setActiveTab] = useState<string>(
    initialTab && VALID_TABS.includes(initialTab) && initialTab !== "logout" ? initialTab : "account",
  );

  const { data: profile, isLoading: profileLoading, error: profileError } = useGetProfileQuery();
  const isAuthed = !!profile;
  const { data: ordersData, isLoading: ordersLoading } = useGetMyOrdersQuery(undefined, {
    skip: !isAuthed,
  });
  const [logout] = useLogoutMutation();
  // Bosilgan buyurtma tafsiloti (GET /user/orders/{id}/)
  const [openOrder, setOpenOrder] = useState<number | null>(null);

  const ORDERS = (ordersData?.results ?? []).map((order) => ({
    orderId: order.id,
    id: order.number,
    date: formatDate(order.created_at),
    status: order.status_display.toUpperCase(),
    statusType: STATUS_COLOR[order.status],
    total: `${Number(order.total).toLocaleString("ru-RU")} ₽`,
  }));

  const handleTabClick = (id: CabinetTab) => {
    if (id === "logout") {
      logout();
      return;
    }
    setActiveTab(id);
  };

  const topCards: { id: CabinetTab; label: string; icon: React.ElementType }[] = [
    { id: "orders", label: "МОИ ЗАКАЗЫ", icon: ListOrdered },
    { id: "edit", label: "ИЗМЕНИТЬ ПРОФИЛЬ", icon: User },
    { id: "address", label: "АДРЕС ДОСТАВКИ", icon: MapPin },
    { id: "favorites", label: "ИЗБРАННОЕ", icon: Heart },
    { id: "password", label: "СМЕНИТЬ ПАРОЛЬ", icon: ShieldCheck },
    { id: "logout", label: "ВЫЙТИ", icon: LogOut },
  ];

  if (profileLoading) {
    return <div className="py-20 text-center text-gray-500">Загрузка...</div>;
  }

  // Token yo'q yoki eskirgan bo'lsa — kirish formasi (ro'yxatdan o'tish: /registraciya)
  if (profileError || !profile) {
    return <LoginForm />;
  }

  const OrdersTable = (
    <div className="overflow-x-auto">
      {ordersLoading ? (
        <p className="text-sm text-gray-400 py-4">Загрузка...</p>
      ) : ORDERS.length === 0 ? (
        <p className="text-sm text-gray-700 py-2">Заказов ещё не создано.</p>
      ) : (
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="pb-3">Номер</th>
              <th className="pb-3">Дата</th>
              <th className="pb-3">Статус</th>
              <th className="pb-3 text-right">Итого</th>
              <th className="pb-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-xs sm:text-sm">
            {ORDERS.map((order, idx) => (
              <tr
                key={idx}
                onClick={() => setOpenOrder(order.orderId)}
                onKeyDown={(e) => e.key === "Enter" && setOpenOrder(order.orderId)}
                tabIndex={0}
                aria-label={`Открыть заказ ${order.id}`}
                className="hover:bg-gray-50/50 transition-colors cursor-pointer"
              >
                <td className="py-4 font-semibold text-gray-800">{order.id}</td>
                <td className="py-4 text-gray-500">{order.date}</td>
                <td className="py-4">
                  <span className={`inline-block px-2.5 py-1 text-[10px] font-extrabold border rounded ${BADGE[order.statusType]}`}>
                    • {order.status}
                  </span>
                </td>
                <td className="py-4 font-bold text-slate-900 text-right">{order.total}</td>
                <td className="py-4 text-right">
                  <span className="inline-block p-1.5 bg-gray-100 text-gray-400 rounded-lg">
                    <ChevronRight size={16} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {openOrder !== null && <OrderDetailModal orderId={openOrder} onClose={() => setOpenOrder(null)} />}
    </div>
  );

  return (
    <CabinetShell active={activeTab} onSelect={handleTabClick}>
        {activeTab === "account" && (
          <>
            <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-100 shadow-sm">
              <h2 className="text-base md:text-lg font-semibold text-slate-800 mb-4">
                Здравствуйте, {profile.first_name || profile.email}!
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                {topCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.id}
                      onClick={() => handleTabClick(card.id)}
                      className="flex flex-col items-center justify-center p-5 border border-gray-100 rounded-lg bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition-all"
                    >
                      <Icon size={32} className="mb-3 text-gray-700" strokeWidth={1.25} />
                      <span className="text-[10px] font-medium text-center tracking-wide uppercase">
                        {card.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-base font-semibold text-slate-800 mb-4">Текущие заказы</h3>
              {OrdersTable}
            </div>
          </>
        )}

        {activeTab === "orders" && (
          <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800 mb-4">Мои заказы</h3>
            {OrdersTable}
          </div>
        )}

        {activeTab === "edit" && <EditProfile key={profile.id} />}
        {activeTab === "address" && <Addresses />}
        {activeTab === "password" && <ChangePassword />}

      {activeTab === "favorites" && <FavoritesContent />}
    </CabinetShell>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="text-base font-semibold text-slate-800 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function EditProfile() {
  const { data: profile } = useGetProfileQuery();
  const [update, { isLoading }] = useUpdateProfileMutation();
  const [form, setForm] = useState({
    first_name: profile?.first_name ?? "",
    last_name: profile?.last_name ?? "",
    phone_number: profile?.phone_number ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await update(form).unwrap();
      toast.success("Профиль сохранён");
    } catch (err) {
      toast.error(errorText(err, "Не удалось сохранить профиль"));
    }
  };

  return (
    <Panel title="Изменить профиль">
      <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4 max-w-2xl">
        <label className="text-xs text-gray-500">
          Имя
          <input className={`${inputClass} mt-1`} required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        </label>
        <label className="text-xs text-gray-500">
          Фамилия
          <input className={`${inputClass} mt-1`} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </label>
        <label className="text-xs text-gray-500">
          Телефон
          <input className={`${inputClass} mt-1`} type="tel" maxLength={13} value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
        </label>
        <label className="text-xs text-gray-500">
          Email
          <input className={`${inputClass} mt-1 bg-gray-50 text-gray-500`} value={profile?.email ?? ""} disabled />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={isLoading} className={primaryButton}>
            {isLoading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </form>
    </Panel>
  );
}

function ChangePassword() {
  const [change, { isLoading }] = useChangePasswordMutation();
  const [form, setForm] = useState({ old_password: "", new_password: "", new_password2: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = passwordProblem(form.new_password);
    if (problem) {
      toast.error(problem);
      return;
    }
    if (form.new_password !== form.new_password2) {
      toast.error("Новые пароли не совпадают");
      return;
    }
    try {
      await change(form).unwrap();
      toast.success("Пароль изменён");
      setForm({ old_password: "", new_password: "", new_password2: "" });
    } catch (err) {
      toast.error(errorText(err, "Не удалось изменить пароль"));
    }
  };

  return (
    <Panel title="Сменить пароль">
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <input className={inputClass} type="password" required placeholder="Текущий пароль" autoComplete="current-password" value={form.old_password} onChange={(e) => setForm({ ...form, old_password: e.target.value })} />
        <input className={inputClass} type="password" required placeholder="Новый пароль" autoComplete="new-password" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} />
        <p className="-mt-2 text-[11px] leading-snug text-gray-400">{PASSWORD_HINT}</p>
        <input className={inputClass} type="password" required placeholder="Повторите новый пароль" autoComplete="new-password" value={form.new_password2} onChange={(e) => setForm({ ...form, new_password2: e.target.value })} />
        <button type="submit" disabled={isLoading} className={primaryButton}>
          {isLoading ? "Сохранение..." : "Сменить пароль"}
        </button>
      </form>
    </Panel>
  );
}

function Addresses() {
  const { data: addresses = [], isLoading } = useGetAddressesQuery();
  const [add, { isLoading: adding }] = useAddAddressMutation();
  const [remove] = useDeleteAddressMutation();
  const [setDefault] = useSetDefaultAddressMutation();
  const empty = { region: "", city: "", street: "", house: "", phone: "" };
  const [form, setForm] = useState(empty);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await add({ ...form, is_default: addresses.length === 0 }).unwrap();
      toast.success("Адрес добавлен");
      setForm(empty);
    } catch (err) {
      toast.error(errorText(err, "Не удалось добавить адрес"));
    }
  };

  const fields: { key: keyof typeof empty; label: string }[] = [
    { key: "region", label: "Регион" },
    { key: "city", label: "Город" },
    { key: "street", label: "Улица" },
    { key: "house", label: "Дом" },
    { key: "phone", label: "Телефон" },
  ];

  return (
    <Panel title="Адрес доставки">
      {isLoading ? (
        <p className="text-sm text-gray-400">Загрузка...</p>
      ) : addresses.length === 0 ? (
        <p className="text-sm text-gray-700 mb-6">Адресов пока нет. Добавьте первый ниже.</p>
      ) : (
        <ul className="divide-y divide-gray-100 mb-6">
          {addresses.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-4 py-3 text-sm">
              <div>
                <p className="font-medium text-slate-800">
                  {[a.region, a.city, a.street, a.house].filter(Boolean).join(", ") || "Адрес без данных"}
                </p>
                <p className="text-xs text-gray-500">
                  {a.phone}
                  {a.is_default && <span className="ml-2 text-emerald-600">• основной</span>}
                </p>
              </div>
              <span className="flex items-center gap-1 shrink-0">
              {!a.is_default && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await setDefault(a.id).unwrap();
                      toast.success("Основной адрес изменён");
                    } catch (err) {
                      toast.error(errorText(err, "Не удалось изменить основной адрес"));
                    }
                  }}
                  className="text-xs text-blue-600 hover:underline px-1.5"
                >
                  Сделать основным
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(a.id)}
                aria-label="Удалить адрес"
                className="p-1.5 text-gray-300 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-3 max-w-2xl">
        {fields.map((f) => (
          <input
            key={f.key}
            className={inputClass}
            placeholder={f.label}
            required={f.key === "city" || f.key === "street"}
            value={form[f.key]}
            onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
          />
        ))}
        <div className="sm:col-span-2">
          <button type="submit" disabled={adding} className={primaryButton}>
            {adding ? "Добавление..." : "Добавить адрес"}
          </button>
        </div>
      </form>
    </Panel>
  );
}
