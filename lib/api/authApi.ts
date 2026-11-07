import { baseApi } from "./baseApi";
import { tokenStorage } from "./tokenStorage";
import type {
  Address,
  Detail,
  EmailCodeRequest,
  LoginRequest,
  LoginResponse,
  OrderList,
  Paginated,
  Profile,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
} from "./types";

/* Auth va shaxsiy kabinet: /api/v1/auth/*, /api/v1/user/*
   DIQQAT: yeteper714 backend'ining hozirgi versiyasida bu endpointlar yo'q (404) —
   login, ro'yxatdan o'tish, profil va manzillar backend qaytarilguncha ishlamaydi.
   Buyurtmalar ro'yxati esa akkauntsiz, sessiya bo'yicha ishlaydi (GET /orders/). */
export const authApi = baseApi.injectEndpoints({
  // Dev rejimida fayl qayta yuklanganda (HMR) endpointlar qayta ro'yxatdan o'tadi
  overrideExisting: process.env.NODE_ENV === "development",
  endpoints: (build) => ({
    // remember — "Запомнить меня" (backend'ga yuborilmaydi, faqat token qayerda saqlanishini belgilaydi)
    login: build.mutation<LoginResponse, LoginRequest & { remember?: boolean }>({
      query: ({ email, password }) => ({ url: "/auth/login", method: "POST", body: { email, password } }),
      // Tokenlarni tag'lar invalid bo'lishidan oldin saqlaymiz
      transformResponse: (data: LoginResponse, _meta, arg) => {
        tokenStorage.set(data.tokens, arg.remember ?? true);
        return data;
      },
      invalidatesTags: ["Profile", "Orders", "Cart", "Admin"],
    }),
    // Ro'yxatdan o'tish: akkaunt yaratiladi va emailga 6 xonali kod yuboriladi
    register: build.mutation<RegisterResponse, RegisterRequest>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),
    // Emailni kod bilan tasdiqlash (shundan keyin login qilish mumkin)
    verifyEmail: build.mutation<Detail, EmailCodeRequest>({
      query: (body) => ({ url: "/auth/verify", method: "POST", body }),
    }),
    resendVerification: build.mutation<Detail, { email: string }>({
      query: (body) => ({ url: "/auth/resend-verification", method: "POST", body }),
    }),
    // Parolni tiklash: email -> kod -> yangi parol
    forgotPassword: build.mutation<Detail, { email: string }>({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
    }),
    verifyResetCode: build.mutation<Detail, EmailCodeRequest>({
      query: (body) => ({ url: "/auth/verify-reset-code", method: "POST", body }),
    }),
    resetPassword: build.mutation<Detail, ResetPasswordRequest>({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
    }),
    changePassword: build.mutation<
      unknown,
      { old_password: string; new_password: string; new_password2: string }
    >({
      query: (body) => ({ url: "/user/password/change", method: "POST", body }),
    }),
    getAddresses: build.query<Address[], void>({
      query: () => "/user/addresses",
      providesTags: ["Addresses"],
    }),
    addAddress: build.mutation<Address, Omit<Address, "id">>({
      query: (body) => ({ url: "/user/addresses", method: "POST", body }),
      invalidatesTags: ["Addresses"],
    }),
    deleteAddress: build.mutation<void, number>({
      query: (id) => ({ url: `/user/addresses/${id}`, method: "DELETE" }),
      invalidatesTags: ["Addresses"],
    }),
    // PATCH /user/addresses/{id}/
    updateAddress: build.mutation<Address, Partial<Address> & { id: number }>({
      query: ({ id, ...body }) => ({ url: `/user/addresses/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Addresses"],
    }),
    // POST /user/addresses/{id}/set-default/ — asosiy manzil (checkout'da birinchi tanlanadi)
    setDefaultAddress: build.mutation<Address, number>({
      query: (id) => ({ url: `/user/addresses/${id}/set-default`, method: "POST", body: {} }),
      invalidatesTags: ["Addresses"],
    }),
    logout: build.mutation<Detail, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
        body: { refresh: tokenStorage.getRefresh() ?? "" },
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          tokenStorage.clear();
          dispatch(baseApi.util.resetApiState());
        }
      },
    }),

    getProfile: build.query<Profile, void>({
      query: () => "/user/profile",
      providesTags: ["Profile"],
    }),
    updateProfile: build.mutation<Profile, Partial<Profile>>({
      query: (body) => ({ url: "/user/profile", method: "PATCH", body }),
      invalidatesTags: ["Profile"],
    }),
    // GET /orders/ — shu sessiyadan (brauzerdan) berilgan buyurtmalar, akkaunt shart emas
    getMyOrders: build.query<Paginated<OrderList>, { page?: number } | void>({
      query: (params) => ({ url: "/orders", params: params ?? undefined }),
      providesTags: ["Orders"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useForgotPasswordMutation,
  useVerifyResetCodeMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useGetAddressesQuery,
  useAddAddressMutation,
  useDeleteAddressMutation,
  useUpdateAddressMutation,
  useSetDefaultAddressMutation,
  useLogoutMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetMyOrdersQuery,
} = authApi;
