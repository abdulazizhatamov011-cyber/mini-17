import { baseApi } from "./baseApi";
import { mapProduct, mapProductDetail } from "./mappers";
import type {
  ApiProduct,
  ApiProductDetail,
  ApiProductReview,
  ApiRatingSummary,
  Paginated,
  ProductsQueryParams,
} from "@/types/api";
import type { ProductType } from "@/types/product";

export const productsApi = baseApi.injectEndpoints({
  // Dev rejimida fayl qayta yuklanganda (HMR) endpointlar qayta ro'yxatdan o'tadi
  overrideExisting: process.env.NODE_ENV === "development",
  endpoints: (build) => ({
    // GET /catalog/products/?category_slug=&search=&page=...
    getProducts: build.query<Paginated<ProductType>, ProductsQueryParams | void>({
      query: (params) => {
        // Massivlar (brand) takrorlanuvchi parametr bo'lib ketishi uchun qo'lda yig'amiz
        const search = new URLSearchParams();
        Object.entries(params ?? {}).forEach(([key, value]) => {
          if (value === undefined || value === null || value === "") return;
          if (Array.isArray(value)) value.forEach((v) => search.append(key, String(v)));
          else search.append(key, String(value));
        });
        const qs = search.toString();
        return qs ? `/catalog/products?${qs}` : "/catalog/products";
      },
      transformResponse: (res: Paginated<ApiProduct>) => ({
        ...res,
        results: res.results.map(mapProduct),
      }),
      providesTags: ["Products"],
    }),
    // GET /catalog/products/{id}/  (slug ham qabul qiladi)
    getProduct: build.query<ProductType, number | string>({
      query: (idOrSlug) => `/catalog/products/${idOrSlug}`,
      transformResponse: (res: ApiProductDetail) => mapProductDetail(res),
      providesTags: (_r, _e, id) => [{ type: "Products", id }],
    }),
    // Bir nechta mahsulotning to'liq ma'lumoti (taqqoslash sahifasi uchun)
    getProductsDetails: build.query<ProductType[], number[]>({
      async queryFn(ids, _api, _extra, baseQuery) {
        const results = await Promise.all(ids.map((id) => baseQuery(`/catalog/products/${id}`)));
        const failed = results.find((r) => r.error);
        if (failed?.error) return { error: failed.error };
        return { data: results.map((r) => mapProductDetail(r.data as ApiProductDetail)) };
      },
      providesTags: (_r, _e, ids) => ids.map((id) => ({ type: "Products" as const, id })),
    }),
    // GET /catalog/products/{slug}/related/
    getRelatedProducts: build.query<ProductType[], string>({
      query: (slug) => `/catalog/products/${slug}/related`,
      transformResponse: (res: ApiProduct[]) => res.map(mapProduct),
    }),
    // GET /catalog/products/{id}/rating/
    getProductRating: build.query<ApiRatingSummary, number>({
      query: (id) => `/catalog/products/${id}/rating`,
      providesTags: (_r, _e, id) => [{ type: "Reviews", id }],
    }),
    // GET /catalog/products/{id}/reviews/
    getProductReviews: build.query<Paginated<ApiProductReview>, { id: number; page?: number }>({
      query: ({ id, page }) => ({ url: `/catalog/products/${id}/reviews`, params: { page } }),
      providesTags: (_r, _e, { id }) => [{ type: "Reviews", id }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useGetProductsDetailsQuery,
  useGetRelatedProductsQuery,
  useGetProductRatingQuery,
  useGetProductReviewsQuery,
} = productsApi;
