"use client";

import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import { useGetProductsQuery } from "@/lib/api/productsApi";
import { styles } from "@/styles/index.styles";

const PAGE_SIZE = 20;

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  // GET /catalog/products/?page=&page_size=
  const { data, isLoading, isFetching, isError, refetch } = useGetProductsQuery({
    page,
    page_size: PAGE_SIZE,
  });

  return (
    <main className={`${styles.container} px-4 sm:px-6 lg:px-8 py-6 sm:py-8`}>
      {/* Sahifa sarlavhasi */}
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
          Все продукты
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Каталог доступных товаров для вашего заказа
          {data ? ` · ${data.count} шт.` : ""}
        </p>
      </div>

      {isError ? (
        <div className="text-center py-10">
          <p className="text-sm text-gray-500 mb-3">Не удалось загрузить товары.</p>
          <button onClick={refetch} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm">
            Повторить
          </button>
        </div>
      ) : (
        <>
          {/* Mahsulotlar gridi */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4">
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
                ))
              : data?.results.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>

          {/* Sahifalash */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                type="button"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40"
              >
                Назад
              </button>
              <span className="text-sm text-gray-600">
                {page} / {data.pages}
              </span>
              <button
                type="button"
                disabled={page >= data.pages || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40"
              >
                Вперёд
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
