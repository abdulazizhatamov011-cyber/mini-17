"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgePercent,
  Bell,
  Boxes,
  CalendarRange,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  FolderTree,
  Gauge,
  Image as ImageIcon,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareText,
  Newspaper,
  Package,
  PhoneCall,
  Search,
  ShieldAlert,
  ShoppingCart,
  Star,
  Store,
  Tag,
  TicketPercent,
  Users,
  CircleHelp,
  X,
} from "lucide-react";
import { useGetProfileQuery, useLogoutMutation } from "@/lib/api/authApi";
import { tokenStorage } from "@/lib/api/tokenStorage";
import { useAdminList } from "@/lib/admin/adminApi";
import type { AdminLead, AdminOrder } from "@/lib/admin/types";
import { dateTime, money } from "@/lib/admin/labels";
import { useMounted } from "@/lib/useMounted";
import { AdminProvider, rangeFromPreset, useAdminRange, type RangePreset } from "./AdminContext";
import { disableDemo, isDemo, resetDemoData } from "@/lib/admin/demo";
import { baseApi } from "@/lib/api/baseApi";
import { useAppDispatch } from "@/lib/hooks";
import { Button, ConfirmProvider, Skeleton } from "./ui";

const NAV: { group: string; items: { href: string; label: string; icon: React.ElementType }[] }[] = [
  { group: "Обзор", items: [{ href: "/admin", label: "Дашборд", icon: Gauge }] },
  {
    group: "Каталог",
    items: [
      { href: "/admin/products", label: "Товары", icon: Package },
      { href: "/admin/categories", label: "Категории", icon: FolderTree },
      { href: "/admin/brands", label: "Бренды", icon: Tag },
      { href: "/admin/stock", label: "Склад", icon: Boxes },
    ],
  },
  {
    group: "Продажи",
    items: [
      { href: "/admin/orders", label: "Заказы", icon: ShoppingCart },
      { href: "/admin/customers", label: "Клиенты", icon: Users },
      { href: "/admin/leads", label: "Заявки", icon: PhoneCall },
    ],
  },
  {
    group: "Маркетинг",
    items: [
      { href: "/admin/promotions", label: "Акции", icon: Megaphone },
      { href: "/admin/promo-codes", label: "Промокоды", icon: TicketPercent },
      { href: "/admin/discount-tiers", label: "Скидки от суммы", icon: BadgePercent },
      { href: "/admin/banners", label: "Баннеры", icon: ImageIcon },
    ],
  },
  {
    group: "Контент",
    items: [
      { href: "/admin/blog", label: "Блог", icon: Newspaper },
      { href: "/admin/reviews", label: "Отзывы", icon: Star },
      { href: "/admin/faq", label: "FAQ", icon: CircleHelp },
      { href: "/admin/pages", label: "Страницы", icon: FileText },
    ],
  },
];

const COLLAPSE_KEY = "admin-sidebar-collapsed";

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const narrow = collapsed && !mobileOpen;

  return (
    <>
      <div
        onClick={onCloseMobile}
        aria-hidden
        className={`lg:hidden fixed inset-0 z-[90] bg-gray-900/40 transition-opacity ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`print:hidden fixed lg:sticky top-0 left-0 z-[100] h-screen shrink-0 bg-[#003B73] text-white flex flex-col transition-all duration-300 ${
          narrow ? "lg:w-[72px]" : "lg:w-64"
        } w-64 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className={`flex items-center h-16 px-4 border-b border-white/10 ${narrow ? "lg:justify-center" : "justify-between"}`}>
          <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 shrink-0 rounded-lg bg-white flex items-center justify-center text-[#003B73]">
              <Store size={20} />
            </span>
            <span className={`leading-tight ${narrow ? "lg:hidden" : ""}`}>
              <span className="block text-sm font-bold">СтройОптТорг</span>
              <span className="block text-[11px] text-white/60">Админ-панель</span>
            </span>
          </Link>
          <button type="button" onClick={onCloseMobile} aria-label="Закрыть меню" className="lg:hidden text-white/70">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map((section) => (
            <div key={section.group}>
              <p className={`px-3 mb-1.5 text-[11px] uppercase tracking-wider text-white/45 ${narrow ? "lg:hidden" : ""}`}>
                {section.group}
              </p>
              <ul className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const active = isActive(pathname, href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onCloseMobile}
                        title={narrow ? label : undefined}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 h-10 px-3 rounded-lg text-sm transition-colors ${
                          narrow ? "lg:justify-center lg:px-0" : ""
                        } ${active ? "bg-white text-[#003B73] font-semibold" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
                      >
                        <Icon size={18} className="shrink-0" />
                        <span className={narrow ? "lg:hidden" : ""}>{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="hidden lg:block p-3 border-t border-white/10">
          <button
            type="button"
            onClick={onToggle}
            className={`w-full flex items-center gap-3 h-10 px-3 rounded-lg text-sm text-white/70 hover:bg-white/10 ${
              narrow ? "justify-center px-0" : ""
            }`}
            aria-label={narrow ? "Развернуть меню" : "Свернуть меню"}
          >
            {narrow ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            {!narrow && "Свернуть"}
          </button>
        </div>
      </aside>
    </>
  );
}

const PRESETS: { key: Exclude<RangePreset, "custom">; label: string }[] = [
  { key: "7d", label: "7 дней" },
  { key: "30d", label: "30 дней" },
  { key: "90d", label: "90 дней" },
  { key: "year", label: "С начала года" },
];

const toInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function DateRangePicker() {
  const { range, setRange } = useAdminRange();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const label =
    range.preset === "custom"
      ? `${range.from.toLocaleDateString("ru-RU")} – ${range.to.toLocaleDateString("ru-RU")}`
      : PRESETS.find((p) => p.key === range.preset)?.label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-10 px-3 inline-flex items-center gap-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        aria-expanded={open}
      >
        <CalendarRange size={16} className="text-gray-400" />
        <span className="hidden md:inline whitespace-nowrap">{label}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 bg-white rounded-xl shadow-lg border border-gray-100 p-3">
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setRange(rangeFromPreset(p.key));
                  setOpen(false);
                }}
                className={`h-9 rounded-lg text-sm ${
                  range.preset === p.key ? "bg-[#012F91] text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3 mb-1.5">Свой период</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              aria-label="С даты"
              value={toInput(range.from)}
              max={toInput(range.to)}
              onChange={(e) => {
                if (!e.target.value) return;
                const from = new Date(`${e.target.value}T00:00:00`);
                setRange({ preset: "custom", from, to: range.to });
              }}
              className="h-9 px-2 text-sm border border-gray-200 rounded-lg"
            />
            <input
              type="date"
              aria-label="По дату"
              value={toInput(range.to)}
              min={toInput(range.from)}
              onChange={(e) => {
                if (!e.target.value) return;
                const to = new Date(`${e.target.value}T23:59:59`);
                setRange({ preset: "custom", from: range.from, to });
              }}
              className="h-9 px-2 text-sm border border-gray-200 rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const orders = useAdminList<AdminOrder>("orders", { status: "new", page_size: 5, ordering: "-created_at" });
  const leads = useAdminList<AdminLead>("leads", { status: "new", page_size: 5, ordering: "-created_at" });
  const total = (orders.data?.count ?? 0) + (leads.data?.count ?? 0);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Уведомления: ${total}`}
        className="relative w-10 h-10 inline-flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
      >
        <Bell size={19} />
        {total > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-[#EE0906] text-white text-[10px] font-bold leading-4 text-center">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          <p className="px-4 py-3 text-sm font-semibold text-gray-900 border-b border-gray-100">Уведомления</p>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {orders.data?.results.map((o) => (
              <Link
                key={`o${o.id}`}
                href={`/admin/orders/${o.id}`}
                onClick={() => setOpen(false)}
                className="flex gap-3 px-4 py-3 hover:bg-gray-50"
              >
                <ShoppingCart size={16} className="shrink-0 mt-0.5 text-[#012F91]" />
                <span className="text-sm">
                  <span className="block text-gray-900">Новый заказ №{o.number} — {money(o.total)}</span>
                  <span className="block text-xs text-gray-400 mt-0.5">{dateTime(o.created_at)}</span>
                </span>
              </Link>
            ))}
            {leads.data?.results.map((l) => (
              <Link
                key={`l${l.id}`}
                href="/admin/leads"
                onClick={() => setOpen(false)}
                className="flex gap-3 px-4 py-3 hover:bg-gray-50"
              >
                <MessageSquareText size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <span className="text-sm">
                  <span className="block text-gray-900">Новая заявка: {l.name}</span>
                  <span className="block text-xs text-gray-400 mt-0.5">{dateTime(l.created_at)}</span>
                </span>
              </Link>
            ))}
            {total === 0 && <p className="px-4 py-8 text-sm text-center text-gray-500">Новых уведомлений нет</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function Topbar({ onOpenMenu, name, email }: { onOpenMenu: () => void; name: string; email: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState("");
  const [logout] = useLogoutMutation();
  const demo = isDemo();

  return (
    <header className="print:hidden sticky top-0 z-40 h-16 bg-white/95 backdrop-blur border-b border-gray-200 flex items-center gap-3 px-4 lg:px-6">
      <button type="button" onClick={onOpenMenu} aria-label="Открыть меню" className="lg:hidden text-gray-600">
        <Menu size={22} />
      </button>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) router.push(`/admin/search?q=${encodeURIComponent(query.trim())}`);
        }}
        className="flex-1 max-w-md relative"
        role="search"
      >
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск заказов, товаров, клиентов"
          aria-label="Глобальный поиск"
          className="w-full h-10 pl-9 pr-3 text-sm bg-[#F5F7FA] rounded-lg outline-none border border-transparent focus:border-[#012F91] focus:bg-white"
        />
      </form>

      <div className="ml-auto flex items-center gap-2">
        {demo && (
          <button
            type="button"
            onClick={() => {
              if (!window.confirm("Вернуть демо-данные к исходному состоянию? Все изменения будут удалены.")) return;
              resetDemoData();
              dispatch(baseApi.util.resetApiState());
            }}
            title="Сбросить демо-данные"
            className="hidden md:inline-flex items-center h-8 px-2.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold hover:bg-amber-200"
          >
            Демо · сбросить
          </button>
        )}
        <DateRangePicker />
        <Notifications />
        <div className="hidden sm:flex items-center gap-3 pl-3 ml-1 border-l border-gray-200">
          <span className="w-9 h-9 rounded-full bg-[#012F91] text-white text-sm font-semibold flex items-center justify-center">
            {(name || email || "A").charAt(0).toUpperCase()}
          </span>
          <span className="leading-tight hidden md:block">
            <span className="block text-sm font-medium text-gray-900 max-w-40 truncate">{name || email}</span>
            <span className="block text-xs text-gray-500">Администратор</span>
          </span>
        </div>
        <button
          type="button"
          onClick={async () => {
            if (demo) disableDemo();
            await logout().unwrap().catch(() => {});
            dispatch(baseApi.util.resetApiState());
            router.replace("/admin/login");
          }}
          aria-label="Выйти"
          title="Выйти"
          className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

// Admin huquqini tekshirish: admin endpointi 401 -> login, 403 -> ruxsat yo'q
function useAdminAccess() {
  const mounted = useMounted();
  const hasToken = mounted && (!!tokenStorage.getAccess() || isDemo());
  const probe = useAdminList("orders", { page_size: 1 }, { skip: !hasToken });
  const status = (probe.error as { status?: number } | undefined)?.status;
  return {
    ready: mounted,
    hasToken,
    loading: hasToken && probe.isLoading,
    unauthorized: mounted && (!hasToken || status === 401),
    forbidden: status === 403,
  };
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const access = useAdminAccess();
  const { data: profile } = useGetProfileQuery(undefined, { skip: !access.hasToken });
  const [logout] = useLogoutMutation();

  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (!isLogin && access.unauthorized) router.replace("/admin/login");
  }, [isLogin, access.unauthorized, router]);

  const toggleCollapsed = () =>
    setCollapsed((v) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, v ? "0" : "1");
      } catch {}
      return !v;
    });

  if (isLogin) return <>{children}</>;

  if (!access.ready || access.loading || access.unauthorized) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <Skeleton className="w-48 h-4" />
      </div>
    );
  }

  if (access.forbidden) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
        <div className="max-w-sm bg-white rounded-xl shadow-sm p-8 text-center">
          <ShieldAlert size={36} className="mx-auto text-[#EE0906] mb-3" />
          <h1 className="text-lg font-semibold text-gray-900">Нет доступа</h1>
          <p className="text-sm text-gray-500 mt-2">
            Аккаунт {profile?.email ?? ""} не является сотрудником магазина. Войдите под учётной записью администратора.
          </p>
          <div className="flex justify-center gap-2 mt-5">
            <Button variant="secondary" onClick={() => router.push("/")}>
              На сайт
            </Button>
            <Button
              onClick={async () => {
                await logout().unwrap().catch(() => {});
                router.replace("/admin/login");
              }}
            >
              Сменить аккаунт
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const name = profile ? profile.full_name || `${profile.first_name} ${profile.last_name}`.trim() : "";

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex text-gray-900">
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onOpenMenu={() => setMobileOpen(true)} name={name} email={profile?.email ?? ""} />
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">{children}</div>
      </div>
    </div>
  );
}

export function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <ConfirmProvider>
        <AdminShell>{children}</AdminShell>
      </ConfirmProvider>
    </AdminProvider>
  );
}
