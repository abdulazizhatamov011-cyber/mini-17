import { baseApi } from "./baseApi";
import type { Banner, Faq, LeadCreateRequest, Paginated, StaticPage } from "./types";

const list = <T,>(res: Paginated<T> | T[]) => (Array.isArray(res) ? res : res.results);

// Ochiq kontent: FAQ, bannerlar, statik sahifalar, arizalar (leads)
export const contentApi = baseApi.injectEndpoints({
  // Dev rejimida fayl qayta yuklanganda (HMR) endpointlar qayta ro'yxatdan o'tadi
  overrideExisting: process.env.NODE_ENV === "development",
  endpoints: (build) => ({
    getFaq: build.query<Faq[], void>({
      query: () => "/faq",
      transformResponse: list<Faq>,
      providesTags: ["Faq"],
    }),
    getBanners: build.query<Banner[], void>({
      query: () => "/banners",
      transformResponse: list<Banner>,
      providesTags: ["Banners"],
    }),
    getStaticPage: build.query<StaticPage, string>({
      query: (slug) => `/pages/${slug}`,
    }),
    // POST /leads/ — qo'ng'iroq, narx so'rovi, "1 klikda xarid"
    createLead: build.mutation<LeadCreateRequest & { id: number }, LeadCreateRequest>({
      query: (body) => ({ url: "/leads", method: "POST", body }),
    }),
  }),
});

export const {
  useGetFaqQuery,
  useGetBannersQuery,
  useGetStaticPageQuery,
  useCreateLeadMutation,
} = contentApi;
