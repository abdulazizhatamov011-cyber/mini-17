import { baseApi } from "./baseApi";
import type { ApiBrand, ApiCategory, ApiCategoryTree, Paginated } from "@/types/api";

export const catalogApi = baseApi.injectEndpoints({
  // Dev rejimida fayl qayta yuklanganda (HMR) endpointlar qayta ro'yxatdan o'tadi
  overrideExisting: process.env.NODE_ENV === "development",
  endpoints: (build) => ({
    // GET /catalog/categories/
    getCategories: build.query<ApiCategory[], void>({
      query: () => ({ url: "/catalog/categories", params: { page_size: 100 } }),
      transformResponse: (res: Paginated<ApiCategory>) => res.results,
      providesTags: ["Categories"],
    }),
    // GET /catalog/categories/tree/
    getCategoryTree: build.query<ApiCategoryTree[], void>({
      query: () => "/catalog/categories/tree",
      providesTags: ["Categories"],
    }),
    // GET /catalog/brands/
    getBrands: build.query<ApiBrand[], void>({
      query: () => ({ url: "/catalog/brands", params: { page_size: 100 } }),
      transformResponse: (res: Paginated<ApiBrand>) => res.results,
      providesTags: ["Brands"],
    }),
  }),
});

export const { useGetCategoriesQuery, useGetCategoryTreeQuery, useGetBrandsQuery } = catalogApi;
