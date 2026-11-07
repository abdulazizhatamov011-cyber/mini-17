import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import CookieNotification from "@/components/CookieNotification";
import CallbackModal from "@/components/CallbackModal";
import StoreProvider from "@/lib/store/StoreProvider";

import "./globals.css";

import Header from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import ShopOnly from "@/components/layout/ShopOnly";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Стройоптторг — всё для строительства и ремонта",
  description: "Интернет-магазин строительных материалов, инструмента, сантехники и электротоваров с доставкой.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StoreProvider>
          <ShopOnly>
            <Header />
          </ShopOnly>
          <main className="flex-1">
            {children}
            <ShopOnly>
              <CookieNotification />
              <CallbackModal />
              <Footer />
            </ShopOnly>
          </main>
        </StoreProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
