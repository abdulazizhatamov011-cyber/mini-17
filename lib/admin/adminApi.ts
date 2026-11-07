import { baseApi } from "@/lib/api/baseApi";
import type { AdminOrder, AdminPage, OrderPayment, OrderStatus } from "./types";

// /api/v1/admin/{resource}/ — barcha admin bo'limlar uchun umumiy CRUD.
// resource: "products" | "categories" | "brands" | "orders" | "stock" | "users" | ...
// Demo rejimda bu so'rovlarni lib/admin/demo.ts ushlaydi (baseApi ichida).
type Params = Record<string, string | number | boolean | undefined | null>;

const clean = (params?: Params) =>
  Object.fromEntries(
    Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );

// FormData bo'lsa (rasm yuklash) — multipart, aks holda JSON
type Body = Record<string, unknown> | FormData;

export const adminApi = baseApi.injectEndpoints({
  // Dev rejimida fayl qayta yuklanganda (HMR) endpointlar qayta ro'yxatdan o'tadi
  overrideExisting: process.env.NODE_ENV === "development",
  endpoints: (build) => ({
    adminList: build.query<AdminPage<unknown>, { resource: string; params?: Params }>({
      query: ({ resource, params }) => ({ url: `/admin/${resource}`, params: clean(params) }),
      providesTags: (_r, _e, { resource }) => [{ type: "Admin", id: resource }],
    }),
    adminGet: build.query<unknown, { resource: string; id: number | string }>({
      query: ({ resource, id }) => `/admin/${resource}/${id}`,
      providesTags: (_r, _e, { resource, id }) => [
        { type: "Admin", id: resource },
        { type: "Admin", id: `${resource}:${id}` },
      ],
    }),
    adminCreate: build.mutation<unknown, { resource: string; body: Body }>({
      query: ({ resource, body }) => ({ url: `/admin/${resource}`, method: "POST", body }),
      invalidatesTags: (_r, _e, { resource }) => [{ type: "Admin", id: resource }, "Products", "Home"],
    }),
    adminUpdate: build.mutation<unknown, { resource: string; id: number | string; body: Body }>({
      query: ({ resource, id, body }) => ({ url: `/admin/${resource}/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { resource }) => [{ type: "Admin", id: resource }, "Products", "Home"],
    }),
    adminDelete: build.mutation<void, { resource: string; id: number | string }>({
      query: ({ resource, id }) => ({ url: `/admin/${resource}/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { resource }) => [{ type: "Admin", id: resource }, "Products", "Home"],
    }),
    // POST /admin/orders/{id}/set-status/
    setOrderStatus: build.mutation<AdminOrder, { id: number; status: OrderStatus }>({
      query: ({ id, status }) => ({ url: `/admin/orders/${id}/set-status`, method: "POST", body: { status } }),
      invalidatesTags: [{ type: "Admin", id: "orders" }],
    }),
    // GET /payments/orders/{order_id}/ — buyurtma bo'yicha to'lovlar (tranzaksiya ID bilan)
    orderPayments: build.query<OrderPayment[], number>({
      query: (id) => `/payments/orders/${id}`,
      providesTags: [{ type: "Admin", id: "orders" }],
    }),
  }),
});

export const {
  useAdminListQuery,
  useAdminGetQuery,
  useAdminCreateMutation,
  useAdminUpdateMutation,
  useAdminDeleteMutation,
  useSetOrderStatusMutation,
  useOrderPaymentsQuery,
} = adminApi;

// Tipli yordamchi: useAdminList<AdminProduct>("products", {...})
export function useAdminList<T>(resource: string, params?: Params, options?: { skip?: boolean }) {
  const res = useAdminListQuery({ resource, params }, options);
  return { ...res, data: res.data as AdminPage<T> | undefined };
}

export function useAdminItem<T>(resource: string, id: number | string | undefined) {
  const res = useAdminGetQuery({ resource, id: id ?? 0 }, { skip: id === undefined || id === "new" });
  return { ...res, data: res.data as T | undefined };
}
