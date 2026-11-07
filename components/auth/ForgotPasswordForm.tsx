"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyResetCodeMutation,
} from "@/lib/api/authApi";
import { parseAuthError, type FieldErrors } from "./authErrors";
import {
  AuthPage,
  Field,
  FormError,
  FormNotice,
  PasswordInput,
  PrimaryButton,
  inputClass,
} from "./ui";

type Step = "email" | "code" | "password";

// /kantak/vosstanovlenie — parolni tiklash: email -> kod -> yangi parol
export default function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [notice, setNotice] = useState("");

  const [forgot, { isLoading: sending }] = useForgotPasswordMutation();
  const [verifyCode, { isLoading: checking }] = useVerifyResetCodeMutation();
  const [resetPassword, { isLoading: saving }] = useResetPasswordMutation();

  const fail = (error: unknown) => {
    const { fields, general } = parseAuthError(error);
    setFieldErrors({
      ...fields,
      password: fields.new_password ?? fields.password,
      password2: fields.new_password2 ?? fields.password2,
    });
    setGeneralError(general);
  };

  const reset = () => {
    setFieldErrors({});
    setGeneralError("");
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (!email.trim()) return setFieldErrors({ email: "Заполните это поле." });
    try {
      // POST /auth/password/reset/request/
      await forgot({ email: email.trim() }).unwrap();
      setStep("code");
      setNotice(`Если аккаунт с адресом ${email.trim()} существует, мы отправили на него код для сброса пароля.`);
    } catch (error) {
      fail(error);
    }
  };

  const handleCode = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    try {
      // Kod alohida tekshirilmaydi
      await verifyCode({ email: email.trim(), code }).unwrap();
      setStep("password");
      setNotice("Код подтверждён. Придумайте новый пароль.");
    } catch (error) {
      fail(error);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (password !== password2) return setFieldErrors({ password2: "Пароли не совпадают." });
    try {
      // POST /auth/password/reset/confirm/
      await resetPassword({
        email: email.trim(),
        code,
        new_password: password,
        new_password2: password2,
      }).unwrap();
      toast.success("Пароль изменён. Войдите с новым паролем.");
      router.push("/kantak");
    } catch (error) {
      fail(error);
    }
  };

  return (
    <AuthPage crumb="Восстановление пароля" title="Восстановление пароля">
      <div className="max-w-md mx-auto border border-gray-200 rounded-md p-5 sm:p-8">
        {step === "email" && (
          <form onSubmit={handleEmail} className="space-y-5" noValidate>
            <p className="text-[13px] text-gray-700 leading-relaxed text-center">
              <strong className="font-semibold text-gray-900">Забыли свой пароль?</strong> Укажите свой
              Email. Код для создания нового пароля вы получите по электронной почте.
            </p>
            <Field label="Email" required error={fieldErrors.email}>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введите ваш email адрес"
                className={inputClass(!!fieldErrors.email)}
              />
            </Field>
            <FormError message={generalError} />
            <PrimaryButton loading={sending}>Сбросить пароль</PrimaryButton>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleCode} className="space-y-5" noValidate>
            <FormNotice message={notice} />
            {/* fixingtools backend tokeni 6 xonali raqam bo'lmasligi mumkin — istalgan matnni qabul qilamiz */}
            <Field label="Код из письма" required error={fieldErrors.code}>
              <input
                type="text"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                placeholder="Вставьте код из письма"
                className={inputClass(!!fieldErrors.code)}
              />
            </Field>
            <FormError message={generalError} />
            <PrimaryButton loading={checking}>Продолжить</PrimaryButton>
            <button
              type="button"
              onClick={() => {
                reset();
                setCode("");
                setStep("email");
              }}
              className="w-full text-center text-[13px] text-[#1f6fd8] hover:underline"
            >
              Изменить email
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handlePassword} className="space-y-5" noValidate>
            <FormNotice message={notice} />
            <Field label="Новый пароль" required error={fieldErrors.password}>
              <PasswordInput
                value={password}
                onChange={setPassword}
                error={!!fieldErrors.password}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Подтвердите пароль" required error={fieldErrors.password2}>
              <PasswordInput
                value={password2}
                onChange={setPassword2}
                error={!!fieldErrors.password2}
                autoComplete="new-password"
              />
            </Field>
            <FormError message={generalError || fieldErrors.code || ""} />
            <PrimaryButton loading={saving}>Сохранить пароль</PrimaryButton>
          </form>
        )}

        <p className="text-center text-[13px] text-gray-500 mt-5">
          Вспомнили пароль?{" "}
          <Link href="/kantak" className="text-[#1f6fd8] hover:underline">
            Авторизоваться
          </Link>
        </p>
      </div>
    </AuthPage>
  );
}
