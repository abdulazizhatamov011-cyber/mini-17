"use client";

import { useAddToCartMutation } from "@/lib/api/cartApi";
import { showAddedToCartToast, showCartErrorToast } from "@/components/CartToast";

// Backend xatosidan o'qiladigan matnni olish: {"quantity": ["..."]} yoki {"detail": "..."}
export function getApiErrorMessage(error: unknown, fallback: string) {
  const data = (error as { data?: unknown })?.data;
  // HTML xato sahifasini (Django 404/500) foydalanuvchiga ko'rsatmaymiz
  if (typeof data === "string") return data.trimStart().startsWith("<") ? fallback : data;
  if (data && typeof data === "object") {
    const first = Object.values(data as Record<string, unknown>)[0];
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
    if (typeof first === "string") return first;
  }
  return fallback;
}

// Backend'ning inglizcha xabarlarini foydalanuvchiga tushunarli qilish
function cartErrorText(error: unknown) {
  const message = getApiErrorMessage(error, "");
  const stock = message.match(/Only (\d+) unit/i);
  if (stock) {
    return Number(stock[1]) === 0
      ? "Этого товара сейчас нет в наличии."
      : `На складе осталось только ${stock[1]} шт.`;
  }
  if ((error as { status?: unknown })?.status === "FETCH_ERROR") {
    return "Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз.";
  }
  return message || "Попробуйте ещё раз немного позже.";
}

// POST /cart/items/ — savatga qo'shish va natija haqida bildirishnoma ko'rsatish
export function useAddToCart() {
  const [addToCart, { isLoading }] = useAddToCartMutation();

  const add = async (productId: number, quantity = 1) => {
    try {
      const cart = await addToCart({ product_id: productId, quantity }).unwrap();
      showAddedToCartToast(cart, productId, quantity);
      return true;
    } catch (error) {
      showCartErrorToast(cartErrorText(error));
      return false;
    }
  };

  return { add, isLoading };
}
