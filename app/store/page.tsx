import PromoModal from "./promo-modal";
import Hero from "@/components/store/Hero";
import CategoryGrid from "@/components/store/CategoryGrid";
import FeaturedProducts from "@/components/store/FeaturedProducts";
import { fetchProductsByCategory } from "@/lib/api";

export default async function StorePage() {
  const { data: featuredProducts } = await fetchProductsByCategory("3d-printers", 1);
  const featured = featuredProducts.slice(0, 8);

  return (
    <div className="bg-white">
      <PromoModal />
      <Hero />
      <CategoryGrid />
      <FeaturedProducts products={featured} />
    </div>
  );
}
