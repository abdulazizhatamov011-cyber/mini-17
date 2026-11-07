import { baseApi } from "./baseApi";
import type {
  City,
  InvoiceResponse,
  OrderCreateRequest,
  OrderDetail,
  Paginated,
  Payment,
  PaymentInitResponse,
  QrResponse,
} from "./types";

// Buyurtmalar (akkauntsiz — sessionid cookie bo'yicha): /api/v1/orders/*, to'lovlar: /api/v1/payments/*
export const ordersApi = baseApi.injectEndpoints({
  // Dev rejimida fayl qayta yuklanganda (HMR) endpointlar qayta ro'yxatdan o'tadi
  overrideExisting: process.env.NODE_ENV === "development",
  endpoints: (build) => ({
    // GET /geo/cities/ — yetkazib berish shaharlari va narxi
    getCities: build.query<City[], void>({
      query: () => ({ url: "/geo/cities", params: { page_size: 500 } }),
      transformResponse: (res: Paginated<City> | City[]) => (Array.isArray(res) ? res : res.results),
    }),
    // POST /orders/ — savatdagi mahsulotlardan buyurtma (narx va qoldiq backend'da qayta tekshiriladi)
    createOrder: build.mutation<OrderDetail, OrderCreateRequest>({
      query: (body) => ({ url: "/orders", method: "POST", body }),
      invalidatesTags: ["Orders", "Cart", "Products"],
    }),
    // GET /orders/{id}/
    getMyOrder: build.query<OrderDetail, number>({
      query: (id) => `/orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Orders", id }],
    }),
    // POST /orders/{id}/cancel/ — faqat new / awaiting_payment / processing holatida
    cancelMyOrder: build.mutation<OrderDetail, number>({
      query: (id) => ({ url: `/orders/${id}/cancel`, method: "POST" }),
      invalidatesTags: (_r, _e, id) => ["Orders", { type: "Orders", id }],
    }),

    // POST /payments/init/ — to'lov sessiyasi (buyurtma awaiting_payment bo'ladi)
    initPayment: build.mutation<PaymentInitResponse, { order_id: number; phone_number?: string; return_url?: string }>({
      query: (body) => ({ url: "/payments/init", method: "POST", body }),
      invalidatesTags: (_r, _e, { order_id }) => ["Orders", { type: "Orders", id: order_id }],
    }),
    // POST /payments/qr/ — click.uz QR kod (base64 PNG) va to'lov havolasi
    createPaymentQr: build.mutation<QrResponse, { order_id: number; return_url?: string }>({
      query: (body) => ({ url: "/payments/qr", method: "POST", body }),
    }),
    // POST /payments/invoices/ — telefon raqamiga to'lov hisobi
    createInvoice: build.mutation<InvoiceResponse, { order_id: number; phone_number: string }>({
      query: (body) => ({ url: "/payments/invoices", method: "POST", body }),
    }),
    // GET /payments/invoices/{id}/ — created / paid / expired / cancelled
    getInvoice: build.query<InvoiceResponse, number>({
      query: (id) => `/payments/invoices/${id}`,
    }),
    // GET /payments/orders/{order_id}/
    getMyOrderPayments: build.query<Payment[], number>({
      query: (orderId) => `/payments/orders/${orderId}`,
      providesTags: (_r, _e, id) => [{ type: "Orders", id }],
    }),
    // POST /payments/{payment_id}/sync/ — to'lov holatini shlyuzdan qayta tekshirish
    syncPayment: build.mutation<Payment, { paymentId: number; orderId: number }>({
      query: ({ paymentId }) => ({ url: `/payments/${paymentId}/sync`, method: "POST" }),
      invalidatesTags: (_r, _e, { orderId }) => ["Orders", { type: "Orders", id: orderId }],
    }),
  }),
});

export const {
  useGetCitiesQuery,
  useCreateOrderMutation,
  useGetMyOrderQuery,
  useCancelMyOrderMutation,
  useInitPaymentMutation,
  useCreatePaymentQrMutation,
  useCreateInvoiceMutation,
  useGetInvoiceQuery,
  useGetMyOrderPaymentsQuery,
  useSyncPaymentMutation,
} = ordersApi;
