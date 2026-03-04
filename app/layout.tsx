import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import Navbar from "@/components/navigation/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import GlobalClientUI from "@/components/GlobalClientUI";
import { getCategoryTree } from "@/lib/categories";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Creality Kuwait",
  description: "Official Creality 3D printer store in Kuwait. FDM, resin printers, materials, and spare parts.",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const categories = await getCategoryTree();

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-white text-gray-900`}>
        <CartProvider>
          <Navbar categories={categories} />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          {/* Global floating UI: CompareBar + PromoPopup — client-only */}
          <GlobalClientUI />
        </CartProvider>
      </body>
    </html>
  );
}
