import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import GlobalClientUI from "@/components/GlobalClientUI";
import Navbar from "@/components/navigation/Navbar";
import { buildNavigation, type PromotionMenuItem } from "@/config/navigation";
import { CartProvider } from "@/context/CartContext";
import { getCategoryTree } from "@/lib/categories";
import { hasPreOrderProducts } from "@/lib/preOrders";

export const metadata: Metadata = {
  title: "Creality Kuwait",
  description:
    "Official Creality 3D printer store in Kuwait. FDM, resin printers, materials, and spare parts.",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [categories, hasPreOrders] = await Promise.all([
    getCategoryTree(),
    hasPreOrderProducts(),
  ]);
  // Replace this with the WordPress seasonal menu payload when the endpoint is ready.
  const seasonalPromotions: PromotionMenuItem[] = [];
  const navigation = buildNavigation({
    hasPreOrders,
    promotions: seasonalPromotions,
    now: new Date(),
  });

  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-white text-gray-900" suppressHydrationWarning>
        <CartProvider>
          <Navbar categories={categories} navigation={navigation} />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <GlobalClientUI />
        </CartProvider>
      </body>
    </html>
  );
}
