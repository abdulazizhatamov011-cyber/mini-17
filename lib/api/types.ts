// Backend javob tiplari (OpenAPI sxemasidan: /api/schema/)

export interface Paginated<T> {
  count: number;
  pages: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ---------- Auth ----------
export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string | null;
  language: string;
  is_active: boolean;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: TokenPair;
}

export interface RegisterRequest {
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name?: string;
  phone_number?: string;
}

export interface Address {
  id: number;
  company_name?: string;
  region?: string;
  city?: string;
  street?: string;
  house?: string;
  phone?: string;
  is_default?: boolean;
}

export interface Detail {
  detail: string;
}

export interface RegisterResponse {
  detail: string;
  email: string;
}

// Email tasdiqlash va parolni tiklash uchun 6 xonali kod
export interface EmailCodeRequest {
  email: string;
  code: string;
}

export interface ResetPasswordRequest extends EmailCodeRequest {
  new_password: string;
  new_password2: string;
}

// ---------- Katalog ----------
export interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number | null;
  sort: number;
  product_count: number;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo?: string | null;
}

export interface ProductList {
  id: number;
  name: string;
  slug: string;
  article: string;
  price: string;
  old_price: string | null;
  discount_percent: number;
  brand: Brand | null;
  category: Category | null;
  main_image: string | null;
  rating: string;
  review_count: number;
  stock_quantity: number;
  in_stock: boolean;
  is_featured: boolean;
  created_at: string;
}

// ---------- Savat ----------
export interface CartItem {
  id: number;
  product: ProductList;
  quantity: number;
  price: string;
  total: string;
}

export interface CartTotals {
  subtotal: string;
  cart_discount: string;
  promo_discount: string;
  discount_total: string;
  delivery_cost: string;
  total: string;
  tier_percent: number;
  item_count: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  promo_code: string | null;
  totals: CartTotals;
  updated_at: string;
}

// ---------- Foydalanuvchi ----------
export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string | null;
  language: string;
  region: number | null;
  date_joined: string;
  is_active: boolean;
}

export type OrderStatus =
  | "new"
  | "awaiting_payment"
  | "processing"
  | "assembled"
  | "shipped"
  | "ready_for_pickup"
  | "completed"
  | "cancelled"
  | "refunded";

export interface OrderList {
  id: number;
  number: string;
  status: OrderStatus;
  status_display: string;
  delivery_type: string;
  payment_method: string;
  total: string;
  item_count: number;
  created_at: string;
  paid_at: string | null;
}

// ---------- Kontent ----------
export interface Faq {
  id: number;
  question: string;
  answer: string;
  sort: number;
}

export interface Banner {
  id: number;
  title: string;
  image: string | null;
  link: string;
  sort: number;
}

export interface StaticPage {
  id: number;
  slug: string;
  title: string;
  body: string;
}

export type LeadType = "callback" | "price_request" | "consultation" | "one_click";

export interface LeadCreateRequest {
  type?: LeadType;
  name: string;
  phone: string;
  product?: number | null;
  consent?: boolean;
}

// ---------- Buyurtma (mijoz tomoni) ----------
export type DeliveryType = "delivery" | "pickup";
export type PaymentMethod = "card" | "on_delivery" | "invoice";

// POST /orders/ — mehmon buyurtmasi (akkaunt shart emas, savat sessiya cookie'siga bog'langan)
export interface OrderCreateRequest {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  address?: { company_name?: string; street: string; house?: string };
  delivery_type: DeliveryType;
  payment_method: PaymentMethod;
  city_id?: number | null;
}

// GET /geo/cities/ — yetkazib berish narxi shaharga bog'liq
export interface City {
  id: number;
  name: string;
  region: string;
  delivery_cost: string;
}

export interface OrderItem {
  id: number;
  product: number | null;
  product_slug: string;
  name_snapshot: string;
  article_snapshot: string;
  price: string;
  quantity: number;
  total: string;
}

export interface OrderDetail extends OrderList {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  payment_due_at?: string | null;
  items: OrderItem[];
  address_snapshot: Record<string, unknown> | null;
  subtotal: string;
  cart_discount: string;
  promo_discount: string;
  delivery_cost: string;
}

// ---------- To'lov ----------
export type PaymentStatus = "pending" | "succeeded" | "cancelled" | "failed" | "refunded";

export interface Payment {
  id: number;
  order: number;
  order_number: string;
  provider: string;
  provider_id: string;
  payment_type: string;
  status: PaymentStatus;
  amount: string;
  created_at: string;
}

export interface PaymentInitResponse {
  payment: Payment;
  payment_id: string;
  return_url: string;
  amount: string;
}

export interface QrResponse {
  qr_image: string;
  payment_url: string;
  amount: string;
  merchant_trans_id: string;
}

export interface InvoiceResponse {
  error_code?: number;
  error_note?: string;
  invoice_id?: number;
  status?: "created" | "paid" | "expired" | "cancelled";
}

// ---------- Sevimlilar, taqqoslash, sharhlar ----------
export interface WishlistItem {
  id: number;
  product: ProductList;
}

export interface ComparisonRow {
  attribute_id: number;
  code: string;
  name: string;
  unit: string;
  is_common: boolean;
  values: Record<string, string | null>;
}

export interface MyReview {
  id: number;
  product: number | null;
  author_name: string;
  rating: number;
  comment: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}
