import Link from "next/link";
import StoreProductCard, { type StoreProduct } from "./ProductCard";

type FeaturedProductsProps = {
  title?: string;
  products: StoreProduct[];
};

export default function FeaturedProducts({
  title = "Featured printers",
  products,
}: FeaturedProductsProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Featured
          </p>
          <h2 className="mt-3 text-[24px] font-semibold tracking-tight text-[#0b0b0b] sm:text-[32px]">
            {title}
          </h2>
        </div>
        <Link
          href="/category/3d-printers"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 transition hover:text-[#0b0b0b]"
        >
          View printers
        </Link>
      </div>

      <div className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pr-1 md:gap-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible xl:grid-cols-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="min-w-[260px] flex-1 snap-start lg:min-w-0"
          >
            <StoreProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
