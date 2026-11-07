/* ДЕМО-РЕЖИМ админ-панели.
   Вход с DEMO_EMAIL / DEMO_PASSWORD включает работу на тестовых данных в браузере
   (localStorage), без обращения к бэкенду. Пароль виден в JS-коде сайта, поэтому это
   НЕ защита — режим открывает только демо-данные, реальные данные магазина недоступны.
   Настоящий вход сотрудника идёт через /auth/login/ и требует is_staff на бэкенде. */

export const DEMO_EMAIL = "abo2010@gmail.com";
export const DEMO_PASSWORD = "abo2010!";

const FLAG_KEY = "admin-demo";
const DB_KEY = "admin-demo-db-v1";

type Row = Record<string, unknown> & { id: number | string };
type Db = Record<string, Row[]>;

const isBrowser = () => typeof window !== "undefined";

export function isDemo() {
  try {
    return isBrowser() && localStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function enableDemo() {
  try {
    localStorage.setItem(FLAG_KEY, "1");
  } catch {}
}

export function disableDemo() {
  try {
    localStorage.removeItem(FLAG_KEY);
  } catch {}
}

export function resetDemoData() {
  try {
    localStorage.removeItem(DB_KEY);
  } catch {}
  cache = null;
}

export const isDemoCredentials = (email: string, password: string) =>
  email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD;

// ---------- Namunaviy ma'lumotlar ----------
const DAY = 86_400_000;

function seedDb(): Db {
  let seed = 20261012;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
  const now = Date.now();

  const categories: Row[] = [
    { id: 1, parent: null, name: "Строительные материалы", slug: "stroymaterialy", sort: 0, is_active: true },
    { id: 2, parent: 1, name: "Сухие смеси", slug: "suhie-smesi", sort: 0, is_active: true },
    { id: 3, parent: 1, name: "Кирпич и блоки", slug: "kirpich-bloki", sort: 1, is_active: true },
    { id: 4, parent: 1, name: "Листовые материалы", slug: "listovye", sort: 2, is_active: true },
    { id: 5, parent: null, name: "Инструмент", slug: "instrument", sort: 1, is_active: true },
    { id: 6, parent: 5, name: "Электроинструмент", slug: "elektroinstrument", sort: 0, is_active: true },
    { id: 7, parent: 5, name: "Ручной инструмент", slug: "ruchnoy", sort: 1, is_active: true },
    { id: 8, parent: null, name: "Сантехника", slug: "santehnika", sort: 2, is_active: true },
    { id: 9, parent: null, name: "Электротовары", slug: "elektrotovary", sort: 3, is_active: true },
    { id: 10, parent: null, name: "Лакокрасочные материалы", slug: "lakokraska", sort: 4, is_active: true },
    { id: 11, parent: null, name: "Строительная техника", slug: "tehnika", sort: 5, is_active: true },
  ];
  const brands: Row[] = [
    { id: 1, name: "Bosch", slug: "bosch", logo: "/images/bosch.png" },
    { id: 2, name: "Makita", slug: "makita", logo: null },
    { id: 3, name: "Knauf", slug: "knauf", logo: null },
    { id: 4, name: "Ceresit", slug: "ceresit", logo: "/images/ceresit.png" },
    { id: 5, name: "Керамин", slug: "keramin", logo: "/images/keramin.png" },
    { id: 6, name: "Electrolux", slug: "electrolux", logo: "/images/electolux.png" },
    { id: 7, name: "Oasis", slug: "oasis", logo: "/images/oasis.png" },
  ];

  // [nom, kategoriya, brend, narx, eski narx, qoldiq, rasm, xususiyatlar]
  const P: [string, number, number | null, number, number | null, number, string, Record<string, string>][] = [
    ["Цемент М500 Д0, 50 кг", 2, null, 780, null, 340, "/images/gish.png", { "Марка": "М500", "Вес, кг": "50" }],
    ["Штукатурка гипсовая Knauf Ротбанд, 30 кг", 2, 3, 690, 760, 120, "/images/mato.png", { "Вес, кг": "30", "Расход, кг/м²": "8,5" }],
    ["Плиточный клей Ceresit CM 11, 25 кг", 2, 4, 540, null, 4, "/images/porret.png", { "Вес, кг": "25" }],
    ["Шпаклёвка финишная Knauf Мульти-финиш, 25 кг", 2, 3, 610, null, 85, "/images/mato.png", {}],
    ["Кирпич облицовочный красный М150", 3, null, 32, null, 0, "/images/gish.png", { "Размер, мм": "250×120×65" }],
    ["Газоблок D500 600×300×200", 3, null, 245, 270, 900, "/images/gish.png", { "Плотность": "D500" }],
    ["Гипсокартон Knauf ГКЛ 12,5 мм 2500×1200", 4, 3, 420, null, 260, "/images/reyka.png", { "Толщина, мм": "12,5" }],
    ["Перфоратор Bosch GBH 2-26 DRE, 800 Вт", 6, 1, 12789, 14990, 7, "/images/drels.png", { "Мощность, Вт": "800", "Энергия удара, Дж": "2,7", "Вес, кг": "2,7" }],
    ["Дрель-шуруповёрт Makita DF347DWE, 14,4 В", 6, 2, 8990, null, 15, "/images/drel.png", { "Напряжение, В": "14,4", "Ёмкость АКБ, А·ч": "1,5" }],
    ["Болгарка Makita GA5030, 720 Вт", 6, 2, 5490, 6990, 0, "/images/drels.png", { "Мощность, Вт": "720", "Диаметр диска, мм": "125" }],
    ["Лобзик Bosch PST 700 E", 6, 1, 6290, null, 11, "/images/drel.png", { "Мощность, Вт": "500" }],
    ["Набор гравировальных насадок Nozzle-Tok", 7, null, 1290, 1590, 48, "/images/ip.png", {}],
    ["Уровень строительный 600 мм", 7, null, 690, null, 3, "/images/reyka.png", { "Длина, мм": "600" }],
    ["Смеситель для раковины Faris G-120", 8, null, 1789, 2100, 34, "/images/rokovina.png", { "Материал": "латунь" }],
    ["Унитаз подвесной Aragio с инсталляцией", 8, null, 12789, 15999, 6, "/images/unitaz.png", {}],
    ["Ванна акриловая 170×70", 8, null, 15400, null, 2, "/images/vanna.png", { "Размер, см": "170×70" }],
    ["Светодиодная лампа E27 12 Вт", 9, null, 120, null, 640, "/images/chiroqY.png", { "Мощность, Вт": "12", "Цоколь": "E27" }],
    ["Кабель ВВГнг 3×2,5, бухта 100 м", 9, null, 9800, null, 18, "/images/ip.png", { "Сечение, мм²": "3×2,5" }],
    ["Эмаль ПФ-115 белая, 2,7 кг", 10, null, 610, null, 70, "/images/porret.png", {}],
    ["Краска фасадная акриловая, 10 л", 10, null, 3290, 3690, 25, "/images/porret.png", {}],
    ["Бетономешалка 160 л, 650 Вт", 11, null, 18990, null, 5, "/images/drels.png", { "Объём, л": "160", "Мощность, Вт": "650" }],
    ["Генератор бензиновый 3 кВт", 11, null, 32500, 36900, 3, "/images/pechka.png", { "Мощность, кВт": "3" }],
    ["Печь для бани «Тунгус»", 11, null, 27900, null, 0, "/images/pechka.png", {}],
    ["Леса строительные рамные, секция 2 м", 11, null, 4200, null, 40, "/images/reyka.png", {}],
  ];

  const products: Row[] = [];
  const stock: Row[] = [];
  const images: Row[] = [];
  P.forEach(([name, category, brand, price, old, qty, image, attrs], i) => {
    const id = i + 1;
    products.push({
      id,
      category,
      brand,
      name,
      slug: `demo-product-${id}`,
      article: `SO-${(48210 + id * 37).toString()}`,
      price: price.toFixed(2),
      old_price: old ? old.toFixed(2) : null,
      description: `${name}. Демонстрационное описание товара для админ-панели.`,
      attrs_json: attrs,
      is_active: id !== 23,
      is_featured: [1, 8, 9, 14, 21].includes(id),
      created_at: new Date(now - id * 4 * DAY).toISOString(),
    });
    stock.push({
      id,
      product: id,
      product_name: name,
      quantity: qty,
      status: qty === 0 ? "out_of_stock" : qty < 8 ? "low_stock" : "in_stock",
      synced_at: new Date(now - DAY).toISOString(),
    });
    images.push({ id, product: id, image, sort: 0, is_main: true });
  });

  const people: [string, string, string, string][] = [
    ["Алишер", "Каримов", "alisher.karimov", "+998901234567"],
    ["Дилноза", "Юсупова", "dilnoza.yusupova", "+998935551122"],
    ["Иван", "Петров", "ivan.petrov", "+79281234567"],
    ["Мария", "Смирнова", "m.smirnova", "+79054443322"],
    ["Бекзод", "Рахимов", "bekzod.r", "+998977778899"],
    ["Ольга", "Ким", "olga.kim", "+998901112233"],
    ["Тимур", "Ахмедов", "timur.ahmedov", "+998946667788"],
    ["Нигора", "Турсунова", "nigora.t", "+998909998877"],
    ["Сергей", "Волков", "s.volkov", "+79187776655"],
    ["Камола", "Норматова", "kamola.n", "+998933334455"],
    ["ООО «СтройИнвест»", "", "zakaz.stroyinvest", "+998712001010"],
    ["Азиз", "Исмоилов", "aziz.ismoilov", "+998915556677"],
    ["Елена", "Орлова", "elena.orlova", "+79613332211"],
    ["Жасур", "Хамидов", "jasur.h", "+998901010101"],
  ];
  const users: Row[] = [
    {
      id: "demo-admin",
      email: DEMO_EMAIL,
      first_name: "Abo",
      last_name: "Admin",
      full_name: "Abo Admin",
      phone_number: "500200684",
      language: "ru",
      is_active: true,
      is_staff: true,
      date_joined: new Date(now - 200 * DAY).toISOString(),
      last_login: new Date(now).toISOString(),
    },
    ...people.map(([first, last, login, phone], i) => ({
      id: `u${i + 1}`,
      email: `${login}@mail.uz`,
      first_name: first,
      last_name: last,
      full_name: `${first} ${last}`.trim(),
      phone_number: phone,
      language: "ru",
      is_active: i !== 6,
      is_staff: false,
      date_joined: new Date(now - (i * 6 + 1) * DAY).toISOString(),
      last_login: new Date(now - i * DAY).toISOString(),
    })),
  ];

  const STATUSES = ["new", "awaiting_payment", "processing", "assembled", "shipped", "ready_for_pickup", "completed", "completed", "completed", "completed", "cancelled", "refunded"];
  const customers = users.slice(1);
  const orders: Row[] = Array.from({ length: 72 }, (_, i) => {
    const items = Array.from({ length: 1 + Math.floor(rnd() * 3) }, (_, k) => {
      const p = pick(products);
      return {
        id: i * 10 + k,
        product: p.id,
        name_snapshot: p.name,
        article_snapshot: p.article,
        price: p.price,
        quantity: 1 + Math.floor(rnd() * (Number(p.price) < 1000 ? 20 : 3)),
      };
    });
    const subtotal = items.reduce((s, it) => s + Number(it.price) * it.quantity, 0);
    const status = i < 4 ? (i % 2 ? "new" : "awaiting_payment") : pick(STATUSES);
    const created = new Date(now - Math.floor(rnd() * 88) * DAY - Math.floor(rnd() * DAY));
    const deliveryType = rnd() > 0.4 ? "delivery" : "pickup";
    const delivery = deliveryType === "delivery" ? (subtotal > 20000 ? 0 : 500) : 0;
    const discount = subtotal >= 20000 ? Math.round(subtotal * 0.15) : subtotal >= 7000 ? Math.round(subtotal * 0.1) : subtotal >= 3000 ? Math.round(subtotal * 0.05) : 0;
    const u = pick(customers);
    const paid = ["processing", "assembled", "shipped", "ready_for_pickup", "completed", "refunded"].includes(status);
    return {
      id: 5000 + i,
      number: `SO-${26100 + i}`,
      user: u.id,
      customer_email: u.email,
      status,
      delivery_type: deliveryType,
      payment_method: u.id === "u11" ? "invoice" : pick(["card", "card", "card", "on_delivery"]),
      address_snapshot:
        deliveryType === "delivery"
          ? { full_name: u.full_name, phone: u.phone_number, city: pick(["Ташкент", "Самарканд", "Черкесск"]), street: pick(["ул. Амира Темура", "ул. Навои", "ул. Октябрьская"]), house: String(1 + Math.floor(rnd() * 120)) }
          : null,
      subtotal: subtotal.toFixed(2),
      cart_discount: discount.toFixed(2),
      promo_discount: "0.00",
      delivery_cost: delivery.toFixed(2),
      total: (subtotal - discount + delivery).toFixed(2),
      items,
      created_at: created.toISOString(),
      paid_at: paid ? new Date(created.getTime() + 40 * 60_000).toISOString() : null,
    };
  }).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

  const reviews: Row[] = [
    [8, "Дилноза", 5, "Отличный перфоратор, мощный и не тяжёлый. Пользуюсь каждый день.", true],
    [1, "Иван", 4, "Цемент хороший, доставили на следующий день.", true],
    [14, "Бекзод", 2, "Смеситель начал подтекать через месяц.", false],
    [9, "Ольга", 5, "Удобный шуруповёрт, аккумулятора хватает на весь день.", false],
    [21, "ООО «СтройИнвест»", 4, "Бетономешалку взяли на объект, работает без нареканий.", true],
    [17, "Азиз", 3, "Лампы светят нормально, но одна перегорела.", false],
  ].map(([product, author, rating, comment, published], i) => ({
    id: i + 1,
    user: `u${i + 2}`,
    product,
    author_name: author,
    rating,
    comment,
    is_published: published,
    created_at: new Date(now - (i + 1) * DAY).toISOString(),
    updated_at: new Date(now - (i + 1) * DAY).toISOString(),
  }));

  const leads: Row[] = [
    ["one_click", "Тимур", "+998 90 123-45-67", 8, "new", 0.05],
    ["callback", "Ольга", "+998 93 765-43-21", null, "new", 0.3],
    ["price_request", "ООО «СтройИнвест»", "+998 71 200-10-10", 6, "in_progress", 1],
    ["consultation", "Сергей", "+7 918 777-66-55", null, "done", 3],
    ["one_click", "Камола", "+998 93 333-44-55", 15, "rejected", 6],
  ].map(([type, name, phone, product, status, daysAgo], i) => ({
    id: i + 1,
    type,
    name,
    phone,
    product,
    consent: true,
    status,
    created_at: new Date(now - Number(daysAgo) * DAY).toISOString(),
  }));

  return {
    categories,
    brands,
    products,
    stock,
    users,
    orders,
    reviews,
    leads,
    "product-images": images,
    promotions: [
      { id: 1, title: "Скидки на лакокрасочные материалы", slug: "lakokraska", body: "Скидка до 30% на краски и эмали.", image: "/images/home2.png", discount_label: "до -30%", valid_until: new Date(now + 40 * DAY).toISOString().slice(0, 10), category: 10 },
      { id: 2, title: "Всё для отопления", slug: "otoplenie", body: "Котлы, радиаторы и комплектующие со скидкой.", image: "/images/home4.png", discount_label: "до -30%", valid_until: new Date(now + 15 * DAY).toISOString().slice(0, 10), category: null },
      { id: 3, title: "Метизные изделия", slug: "metizy", body: "", image: "/images/home.png", discount_label: "до -15%", valid_until: new Date(now - 5 * DAY).toISOString().slice(0, 10), category: null },
    ],
    "promo-codes": [
      { id: 1, code: "LAKOART20", type: "percent", value: "20.00", min_order: "3000.00", valid_to: null, usage_limit: 100, used_count: 37 },
      { id: 2, code: "STROY500", type: "fixed", value: "500.00", min_order: "5000.00", valid_to: new Date(now + 30 * DAY).toISOString(), usage_limit: null, used_count: 12 },
      { id: 3, code: "SUMMER10", type: "percent", value: "10.00", min_order: "0.00", valid_to: new Date(now - 20 * DAY).toISOString(), usage_limit: 50, used_count: 50 },
    ],
    "discount-tiers": [
      { id: 1, threshold: "3000.00", percent: 5, is_active: true },
      { id: 2, threshold: "7000.00", percent: 10, is_active: true },
      { id: 3, threshold: "20000.00", percent: 15, is_active: true },
    ],
    banners: [
      { id: 1, title: "Электроинструмент для любых нужд", image: "/images/homeR.png", link: "/catalog", sort: 0 },
      { id: 2, title: "Сантехника для вашего дома", image: "/images/santexnika.jpg", link: "/catalog", sort: 1 },
    ],
    articles: [
      { id: 1, type: "news", title: "Масштабное обновление каталога инструментов", slug: "obnovlenie-kataloga", body: "В каталоге появилось более 300 новых позиций.", image: "/images/news1.png", published_at: new Date(now - 2 * DAY).toISOString() },
      { id: 2, type: "article", title: "Как выбрать электродрель", slug: "kak-vybrat-drel", body: "## Мощность\nДля дома достаточно 500–700 Вт.", image: "/images/news2.png", published_at: new Date(now - 10 * DAY).toISOString() },
      { id: 3, type: "blog", title: "5 советов по укладке плитки", slug: "ukladka-plitki", body: "Черновик статьи.", image: "/images/news3.png", published_at: null },
    ],
    faq: [
      { id: 1, question: "Как оформить доставку?", answer: "Выберите «Доставка магазина» при оформлении заказа и укажите адрес.", sort: 0 },
      { id: 2, question: "Можно ли вернуть товар?", answer: "Да, в течение 30 дней при сохранении товарного вида.", sort: 1 },
      { id: 3, question: "Работаете ли вы с юрлицами?", answer: "Да, выставляем счёт на оплату для юридических лиц.", sort: 2 },
    ],
    pages: [
      { id: 1, slug: "dostavka", title: "Доставка", body: "Доставляем по городу в течение 1–2 дней." },
      { id: 2, slug: "oplata", title: "Оплата", body: "Картой онлайн, при получении или по счёту." },
      { id: 3, slug: "kontakty", title: "Контакты", body: "Телефон: 500200684" },
    ],
  };
}

// ---------- Saqlash ----------
let cache: Db | null = null;

function db(): Db {
  if (cache) return cache;
  try {
    const saved = localStorage.getItem(DB_KEY);
    cache = saved ? (JSON.parse(saved) as Db) : seedDb();
  } catch {
    cache = seedDb();
  }
  return cache;
}

function save() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(cache));
  } catch {}
}

const clone = <T,>(v: T): T => (v === null || v === undefined ? v : JSON.parse(JSON.stringify(v)));
const ok = (data: unknown) => ({ data: clone(data) });
const notFound = { error: { status: 404, data: { detail: "Не найдено." } } };

type Args = string | { url: string; method?: string; params?: Record<string, unknown>; body?: unknown };

// Demo rejimda /admin/*, /user/profile va /payments/orders/* so'rovlariga javob (faqat /admin sahifalarida)
export function demoQuery(args: Args) {
  if (!isBrowser() || !window.location.pathname.startsWith("/admin") || !isDemo()) return null;
  const a = typeof args === "string" ? { url: args } : args;
  const [path, qs] = a.url.split("?");
  const method = (a.method ?? "GET").toUpperCase();
  const store = db();

  if (path === "/user/profile" || path === "/auth/profile") return ok(store.users.find((u) => u.id === "demo-admin"));
  if (path === "/auth/logout") return ok({ detail: "ok" });
  const pay = path.match(/^\/payments\/orders\/(\d+)$/);
  if (pay) {
    const o = store.orders.find((x) => String(x.id) === pay[1]);
    return ok(
      o?.paid_at && o.payment_method === "card"
        ? [{ id: Number(o.id), order: o.id, order_number: o.number, provider: "fintechhub", provider_id: `FH-${o.id}-${String(o.number).slice(-4)}`, payment_type: "card", status: o.status === "refunded" ? "refunded" : "succeeded", amount: o.total, created_at: o.paid_at }]
        : []
    );
  }

  const m = path.match(/^\/admin\/([^/]+)(?:\/([^/]+))?(?:\/(set-status))?$/);
  if (!m) return null;
  const [, resource, id, action] = m;
  const table = (store[resource] ??= []);
  const body: Record<string, unknown> =
    a.body instanceof FormData
      ? Object.fromEntries(
          [...a.body.entries()].map(([k, v]) => [k, typeof v === "string" ? (v === "true" ? true : v === "false" ? false : v) : v])
        )
      : ((a.body as Record<string, unknown>) ?? {});
  // Fayllar demo'da saqlanmaydi — rasm o'rniga mavjud rasm qo'yiladi
  for (const [k, v] of Object.entries(body)) if (typeof File !== "undefined" && v instanceof File) body[k] = "/images/no-image.svg";

  if (action === "set-status") {
    const row = table.find((r) => String(r.id) === id);
    if (!row) return notFound;
    row.status = body.status;
    if (["processing", "assembled", "shipped", "completed"].includes(String(body.status)) && !row.paid_at && row.payment_method === "card")
      row.paid_at = new Date().toISOString();
    save();
    return ok(row);
  }

  if (id) {
    const row = table.find((r) => String(r.id) === id);
    if (!row) return notFound;
    if (method === "PATCH" || method === "PUT") {
      Object.assign(row, body);
      if (resource === "stock") row.status = Number(row.quantity) === 0 ? "out_of_stock" : row.status;
      save();
    }
    if (method === "DELETE") {
      table.splice(table.indexOf(row), 1);
      save();
      return { data: null };
    }
    return ok(row);
  }

  if (method === "POST") {
    const nextId = Math.max(0, ...table.map((r) => Number(r.id) || 0)) + 1;
    const row: Row = { ...body, id: nextId };
    if (resource === "products") row.created_at = new Date().toISOString();
    if (resource === "promo-codes") row.used_count = 0;
    if (resource === "stock") row.product_name = store.products.find((p) => p.id === Number(body.product))?.name ?? "";
    table.unshift(row);
    save();
    return ok(row);
  }

  // GET ro'yxat: filtrlar, qidiruv, saralash, sahifalash
  const params: Record<string, unknown> = { ...Object.fromEntries(new URLSearchParams(qs ?? "")), ...(a.params ?? {}) };
  let rows = [...table];
  for (const [k, v] of Object.entries(params)) {
    if (["page", "page_size", "ordering", "search"].includes(k) || v === "" || v === undefined || v === null) continue;
    if (k === "category" && resource === "products") {
      const ids = new Set([Number(v), ...store.categories.filter((c) => c.parent === Number(v)).map((c) => Number(c.id))]);
      rows = rows.filter((r) => ids.has(Number(r.category)));
      continue;
    }
    rows = rows.filter((r) => String(r[k]) === String(v));
  }
  if (params.search) {
    const q = String(params.search).toLowerCase();
    rows = rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }
  if (params.ordering) {
    const key = String(params.ordering).replace(/^-/, "").replace("product__name", "product_name");
    const dir = String(params.ordering).startsWith("-") ? -1 : 1;
    rows.sort((x, y) => {
      const a1 = x[key];
      const b1 = y[key];
      const na = Number(a1);
      const nb = Number(b1);
      return (!Number.isNaN(na) && !Number.isNaN(nb) && a1 !== null && b1 !== null ? na - nb : String(a1 ?? "").localeCompare(String(b1 ?? ""), "ru")) * dir;
    });
  }
  const size = Number(params.page_size ?? 20);
  const page = Number(params.page ?? 1);
  return ok({
    count: rows.length,
    pages: Math.max(1, Math.ceil(rows.length / size)),
    next: page * size < rows.length ? "next" : null,
    previous: page > 1 ? "prev" : null,
    results: rows.slice((page - 1) * size, page * size),
  });
}
