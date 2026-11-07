import { baseApi } from "./baseApi";
import type { ComparisonRow, MyReview } from "./types";

/* Taqqoslash (sessiya bo'yicha, akkaunt shart emas): /api/v1/catalog/compare/*
   Sharh yozish: /api/v1/user/reviews/ — DIQQAT: yeteper714'ning hozirgi versiyasida yo'q (404).
   Sevimlilar (/user/wishlist/) ham yo'q — ular brauzerdagi zustand store'da qoladi. */
export const userContentApi = baseApi.injectEndpoints({
  // Dev rejimida fayl qayta yuklanganda (HMR) endpointlar qayta ro'yxatdan o'tadi
  overrideExisting: process.env.NODE_ENV === "development",
  endpoints: (build) => ({
    // GET /catalog/compare/ — xususiyatlar bo'yicha taqqoslash jadvali
    getCompare: build.query<ComparisonRow[], void>({
      query: () => "/catalog/compare",
      providesTags: ["Compare"],
    }),
    // POST /catalog/compare/{product_id}/add/
    addToCompare: build.mutation<unknown, number>({
      query: (productId) => ({ url: `/catalog/compare/${productId}/add`, method: "POST" }),
      invalidatesTags: ["Compare"],
    }),
    // DELETE /catalog/compare/{product_id}/
    removeFromCompare: build.mutation<void, number>({
      query: (productId) => ({ url: `/catalog/compare/${productId}`, method: "DELETE" }),
      invalidatesTags: ["Compare"],
    }),
    // DELETE /catalog/compare/
    clearCompare: build.mutation<void, void>({
      query: () => ({ url: "/catalog/compare", method: "DELETE" }),
      invalidatesTags: ["Compare"],
    }),

    // POST /user/reviews/ — moderatsiyadan keyin saytda chiqadi
    createReview: build.mutation<MyReview, { product: number | null; author_name: string; rating: number; comment: string }>({
      query: (body) => ({ url: "/user/reviews", method: "POST", body }),
      invalidatesTags: ["Reviews"],
    }),
  }),
});

export const {
  useGetCompareQuery,
  useAddToCompareMutation,
  useRemoveFromCompareMutation,
  useClearCompareMutation,
  useCreateReviewMutation,
} = userContentApi;
