import { baseApi } from "./baseApi";
import type { Cart } from "./types";

// Savat: /api/v1/cart/  (akkaunt shart emas — sessionid cookie orqali ishlaydi)
export const cartApi = baseApi.injectEndpoints({
  // Dev rejimida fayl qayta yuklanganda (HMR) endpointlar qayta ro'yxatdan o'tadi
  overrideExisting: process.env.NODE_ENV === "development",
  endpoints: (build) => ({
    getCart: build.query<Cart, void>({
      query: () => "/cart",
      providesTags: ["Cart"],
    }),
    addToCart: build.mutation<Cart, { product_id: number; quantity?: number }>({
      query: (body) => ({ url: "/cart/items", method: "POST", body }),
      invalidatesTags: ["Cart"],
    }),
    updateCartItem: build.mutation<Cart, { product_id: number; quantity: number }>({
      query: ({ product_id, quantity }) => ({
        url: `/cart/items/${product_id}`,
        method: "PATCH",
        body: { quantity },
      }),
      invalidatesTags: ["Cart"],
    }),
    removeCartItem: build.mutation<void, number>({
      query: (product_id) => ({
        url: `/cart/items/${product_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),
    clearCart: build.mutation<void, void>({
      query: () => ({ url: "/cart", method: "DELETE" }),
      invalidatesTags: ["Cart"],
    }),
    applyPromo: build.mutation<Cart, string>({
      query: (code) => ({ url: "/cart/promo", method: "POST", body: { code } }),
      invalidatesTags: ["Cart"],
    }),
    removePromo: build.mutation<void, void>({
      query: () => ({ url: "/cart/promo", method: "DELETE" }),
      invalidatesTags: ["Cart"],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useApplyPromoMutation,
  useRemovePromoMutation,
} = cartApi;
