'use client';

import { useState } from 'react';
import { ProductType } from '@/types/product';
import ProductReviews from '@/components/ProductReviews';

interface ProductTabsProps {
  product: ProductType;
}

type TabKey = 'specs' | 'about' | 'reviews' | 'delivery';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'specs', label: 'Характеристики' },
  { key: 'about', label: 'О товаре' },
  { key: 'reviews', label: 'Отзывы' },
  { key: 'delivery', label: 'Доставка и оплата' },
];

export default function ProductTabs({ product }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('about');
  const specs = product.specs ?? [];
  const half = Math.ceil(specs.length / 2);

  return (
    <div className="mt-8 sm:mt-10">
      <div className="flex items-center gap-5 sm:gap-6 md:gap-8 border-b border-gray-200 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap shrink-0 ${
              activeTab === tab.key
                ? 'text-gray-900 border-red-500'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="py-5 sm:py-6">
        {/* ХАРАКТЕРИСТИКИ */}
        {activeTab === 'specs' && (
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">
              Характеристики товара «{product.title}»
            </h2>
            {specs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 md:gap-x-10">
                {[specs.slice(0, half), specs.slice(half)].map((column, i) => (
                  <div key={i} className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
                    {column.map((spec) => (
                      <SpecRow key={spec.label} label={spec.label} value={spec.value} />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-gray-500">Характеристики пока не добавлены.</p>
            )}
            <p className="text-xs sm:text-sm text-black mt-5 sm:mt-6">
              Производитель оставляет за собой право без уведомления продавца менять характеристики,
              внешний вид, комплектацию товара и место его производства. Указанная информация не
              является публичной офертой.
            </p>
          </div>
        )}

        {/* О ТОВАРЕ */}
        {activeTab === 'about' && (
          <div className="text-xs sm:text-sm text-gray-700 space-y-3.5 sm:space-y-4 leading-relaxed">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">
              О товаре «{product.title}»
            </h2>
            {product.description ? (
              product.description
                .split(/\n+/)
                .filter((line) => line.trim())
                .map((line, i) => <p key={i}>{line}</p>)
            ) : (
              <p className="text-gray-500">Описание товара пока не добавлено.</p>
            )}
            <p>
              Оформить заказ довольно просто — положите товар в корзину или позвоните по телефону{' '}
              <a href="tel:500200684" className="text-blue-600 font-medium hover:underline">
                500200684
              </a>{' '}
              и наши консультанты Вам помогут!
            </p>
            <p className="text-gray-500">
              Обратите внимание! Изображение товара, представленного на фото, может незначительно
              отличаться от его фактического вида.
            </p>
          </div>
        )}

        {/* ДОСТАВКА И ОПЛАТА */}
        {/* ОТЗЫВЫ */}
        {activeTab === 'reviews' && <ProductReviews productId={product.id} />}

        {activeTab === 'delivery' && (
          <div className="text-xs sm:text-sm text-gray-700 space-y-5 sm:space-y-6 leading-relaxed">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-2.5 sm:mb-3">
                Доставка
              </h2>
              <p>Мы всегда готовы доставить приобретенный Вами товар в удобное для Вас время.</p>
              <p>
                <span className="font-semibold">Стоимость доставки</span> товаров определяется
                исходя из веса, габаритов и удаленности до места назначения. Доставка
                осуществляется до подъезда дома, офиса.
              </p>
              <p>Наш интернет-магазин предлагает несколько вариантов получения товара:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Самовывоз с территории компании.</li>
                <li>Быстрая доставка по Карачаево-Черкесской республике.</li>
                <li>Доставка транспортной компанией.</li>
                <li>Почтой России.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-2.5 sm:mb-3">
                Оплата
              </h2>
              <p>Оплатить свои покупки вы можете:</p>

              <p className="font-semibold mt-3">При заказе доставки:</p>
              <p className="mt-1">1. Банковской картой с помощью платежной системы на сайте</p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>МИР</li>
                <li>VISA International</li>
                <li>Mastercard Worldwide</li>
                <li>JCB</li>
              </ul>
              <p className="mt-2">2. Наличными водителю при получении заказа</p>

              <p className="font-semibold mt-3">При самовывозе:</p>
              <ul className="list-disc list-inside space-y-1 mt-1">
                <li>Банковской картой с помощью платежной системы на сайте или на кассе при получении заказа.</li>
                <li>Наличными на кассе при получении заказа.</li>
              </ul>

              <p className="mt-2">- Сервис «Покупай со Сбером»</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-end gap-1.5 sm:gap-2 border-b border-dashed border-gray-200 pb-1.5">
      <span className="text-gray-500 shrink-0 max-w-[55%] sm:max-w-none">{label}</span>
      <span className="flex-1 border-b border-dotted border-gray-200 mb-1 min-w-2"></span>
      <span className="text-gray-900 font-medium whitespace-nowrap shrink-0">{value}</span>
    </div>
  );
}