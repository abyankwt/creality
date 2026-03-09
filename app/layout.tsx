import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import GlobalClientUI from "@/components/GlobalClientUI";
import Navbar from "@/components/navigation/Navbar";
import { CartProvider } from "@/context/CartContext";
import { getCategoryTree } from "@/lib/categories";

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
  const categories = await getCategoryTree();

  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-white text-gray-900">
        <CartProvider>
          <Navbar categories={categories} />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <GlobalClientUI />
        </CartProvider>
      </body>
    </html>
  );
}
