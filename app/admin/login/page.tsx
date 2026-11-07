"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Store } from "lucide-react";
import { useLoginMutation } from "@/lib/api/authApi";
import { baseApi } from "@/lib/api/baseApi";
import { useAppDispatch } from "@/lib/hooks";
import { enableDemo, isDemoCredentials } from "@/lib/admin/demo";
import { parseAuthError } from "@/components/auth/authErrors";
import { Button, Field, inputCls } from "@/components/admin/ui";

// /admin/login — xodimlar uchun kirish (POST /auth/login/)
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Введите email и пароль.");
      return;
    }
    // Demo kirish: namunaviy ma'lumotlar bilan (backend'ga so'rov ketmaydi)
    if (isDemoCredentials(email, password)) {
      enableDemo();
      dispatch(baseApi.util.resetApiState());
      router.replace("/admin");
      return;
    }
    try {
      await login({ email: email.trim(), password, remember }).unwrap();
      // Admin huquqi AdminShell'da tekshiriladi (403 -> "Нет доступа")
      router.replace("/admin");
    } catch (err) {
      const { status, general, fields } = parseAuthError(err);
      setError(
        status === 404
          ? "Вход недоступен: в API нет /auth/login/ (404). Используйте демо-доступ."
          : status === 403
          ? "Email не подтверждён. Подтвердите его через письмо на сайте."
          : general || Object.values(fields)[0] || "Не удалось войти."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-[#003B73] text-white p-12">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-[#003B73]">
            <Store size={22} />
          </span>
          <span className="text-lg font-bold">СтройОптТорг</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">Управление магазином</h2>
          <p className="text-white/70 mt-3 max-w-md leading-relaxed">
            Товары, заказы, склад, клиенты и контент сайта — в одном месте.
          </p>
        </div>
        <p className="text-xs text-white/40">Только для сотрудников магазина</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} noValidate className="w-full max-w-sm bg-white rounded-xl shadow-sm p-8 space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Вход в админ-панель</h1>
            <p className="text-sm text-gray-500 mt-1">Используйте учётную запись сотрудника</p>
          </div>

          <Field label="Email" required>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@stroiopttorg.ru"
              className={inputCls}
            />
          </Field>

          <Field label="Пароль" required>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>

          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2 text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 accent-[#012F91]"
              />
              Запомнить меня
            </label>
            <Link href="/kantak/vosstanovlenie" className="text-[#012F91] hover:underline">
              Забыли пароль?
            </Link>
          </div>

          {error && <p className="text-sm text-[#EE0906] bg-red-50 rounded-lg px-3 py-2.5">{error}</p>}

          <Button type="submit" loading={isLoading} className="w-full">
            Войти
          </Button>

          <Link href="/" className="block text-center text-sm text-gray-500 hover:text-gray-800">
            ← Вернуться на сайт
          </Link>
        </form>
      </div>
    </div>
  );
}
