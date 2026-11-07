import { baseApi } from "./baseApi";
import { mapProduct } from "./mappers";
import type {
  ApiArticle,
  ApiArticleDetail,
  ApiHome,
  ApiProduct,
  ApiPromotion,
  ApiPromotionDetail,
  ArticleType,
  Paginated,
} from "@/types/api";
import type { ProductType } from "@/types/product";

type HomeProductsKey =
  | "popular_products"
  | "best_selling_products"
  | "new_products"
  | "discounted_products"
  | "featured_products";

export type HomeData = Omit<ApiHome, HomeProductsKey> & Record<HomeProductsKey, ProductType[]>;

const mapList = (list: ApiProduct[] = []) => list.map(mapProduct);

export const promoApi = baseApi.injectEndpoints({
  // Dev rejimida fayl qayta yuklanganda (HMR) endpointlar qayta ro'yxatdan o'tadi
  overrideExisting: process.env.NODE_ENV === "development",
  endpoints: (build) => ({
    // GET /home/ — bosh sahifa uchun hammasi bitta so'rovda
    getHome: build.query<HomeData, void>({
      query: () => "/home",
      transformResponse: (res: ApiHome) => ({
        ...res,
        popular_products: mapList(res.popular_products),
        best_selling_products: mapList(res.best_selling_products),
        new_products: mapList(res.new_products),
        discounted_products: mapList(res.discounted_products),
        featured_products: mapList(res.featured_products),
      }),
      providesTags: ["Home"],
    }),
    // GET /promotions/
    getPromotions: build.query<ApiPromotion[], void>({
      query: () => ({ url: "/promotions", params: { page_size: 50 } }),
      transformResponse: (res: Paginated<ApiPromotion>) => res.results,
      providesTags: ["Promotions"],
    }),
    // GET /promotions/{slug}/
    getPromotion: build.query<ApiPromotionDetail, string>({
      query: (slug) => `/promotions/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: "Promotions", id: slug }],
    }),
    // GET /news/?type=&page=&page_size=  (blog sahifasi ham shundan foydalanadi)
    getNews: build.query<
      Paginated<ApiArticle>,
      { page?: number; page_size?: number; type?: ArticleType } | void
    >({
      query: (params) => ({ url: "/news", params: params ?? undefined }),
      providesTags: ["News"],
    }),
    // GET /news/{slug}/
    getNewsItem: build.query<ApiArticleDetail, string>({
      query: (slug) => `/news/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: "News", id: slug }],
    }),
  }),
});

export const {
  useGetHomeQuery,
  useGetPromotionsQuery,
  useGetPromotionQuery,
  useGetNewsQuery,
  useGetNewsItemQuery,
} = promoApi;
