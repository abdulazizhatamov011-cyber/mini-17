// Backend xatolarini ({"field": ["msg"]} yoki {"detail": "msg"}) maydonlar bo'yicha ajratish
export type FieldErrors = Record<string, string>;

// Backend'ning ko'p uchraydigan inglizcha xabarlari
const TRANSLATIONS: [RegExp, string][] = [
  [/Invalid email or password/i, "Неверный email или пароль."],
  [/not verified|verify your email/i, "Email не подтверждён. Введите код из письма."],
  [/Enter a valid email/i, "Введите корректный email."],
  [/already exists|already registered|already in use/i, "Пользователь с таким email уже зарегистрирован."],
  [/Passwords do not match|didn.t match/i, "Пароли не совпадают."],
  [/special character/i, "Пароль должен содержать специальный символ (например ! @ # $ %)."],
  [/uppercase/i, "Пароль должен содержать заглавную букву."],
  [/lowercase/i, "Пароль должен содержать строчную букву."],
  [/at least one (digit|number)|must contain a (digit|number)/i, "Пароль должен содержать цифру."],
  [/at least 8 characters/i, "Пароль должен содержать минимум 8 символов."],
  [/too common/i, "Слишком простой пароль."],
  [/entirely numeric/i, "Пароль не может состоять только из цифр."],
  [/too similar/i, "Пароль слишком похож на ваши личные данные."],
  [/at least 2 characters/i, "Минимум 2 символа."],
  [/Invalid or expired code/i, "Неверный или просроченный код."],
  [/Too many|locked|try again later/i, "Слишком много попыток. Попробуйте позже."],
  [/This field may not be blank|This field is required/i, "Заполните это поле."],
];

export const translate = (msg: string) =>
  TRANSLATIONS.find(([re]) => re.test(msg))?.[1] ?? msg;

export function parseAuthError(error: unknown): { fields: FieldErrors; general: string; status?: number | string } {
  const err = error as { status?: number | string; originalStatus?: number; data?: unknown };
  const fields: FieldErrors = {};
  let general = "";

  if (err?.status === "FETCH_ERROR") {
    return { fields, general: "Нет соединения с сервером. Попробуйте ещё раз.", status: err.status };
  }
  // Backend JSON o'rniga HTML qaytarsa (404/500 sahifasi) — RTK "PARSING_ERROR" beradi, asl kod originalStatus'da.
  // HTML matnini tarjima qilmaymiz: unda tasodifiy so'zlar ("didn't match") bo'ladi.
  if (err?.status === "PARSING_ERROR") {
    const status = err.originalStatus;
    const general =
      status === 404
        ? "Сервис временно недоступен (404): endpoint не найден на сервере."
        : status && status >= 500
          ? `Ошибка сервера (${status}). Попробуйте позже.`
          : "Что-то пошло не так. Попробуйте ещё раз.";
    return { fields, general, status };
  }

  const data = err?.data;
  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const msg = Array.isArray(value) ? String(value[0] ?? "") : typeof value === "string" ? value : "";
      if (!msg) continue;
      if (key === "detail" || key === "non_field_errors") general = translate(msg);
      // Bir nechta xabar bo'lsa, birinchisi yetarli
      else fields[key] = translate(msg);
    }
  } else if (typeof data === "string" && data) {
    general = translate(data);
  }

  if (!general && !Object.keys(fields).length) general = "Что-то пошло не так. Попробуйте ещё раз.";
  return { fields, general, status: err?.status };
}
