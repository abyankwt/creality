import { Suspense } from "react";
import ProductGrid from "@/components/ProductGrid";
import FilterBar from "@/components/store/FilterBar";
import { fetchProducts, fetchHeroImages } from "@/lib/api";
import InteractiveFlyer from "@/components/InteractiveFlyer";
import NewProductArrivals from "@/components/NewProductArrivals";
import { FLYERS } from "@/config/flyers";

type RawSearchParams = Record<string, string | string[] | undefined>;

function getString(p: RawSearchParams, k: string): string | undefined {
  const v = p[k];
  return typeof v === "string" ? v : undefined;
}

function resolveSort(sort?: string): { orderby: string; order: "asc" | "desc" } {
  switch (sort) {
    case "price_asc": return { orderby: "price", order: "asc" };
    case "price_desc": return { orderby: "price", order: "desc" };
    case "date_desc": return { orderby: "date", order: "desc" };
    default: return { orderby: "popularity", order: "desc" };
  }
}

type PageProps = {
  searchParams?: Promise<RawSearchParams>;
};

export default async function HomePage({ searchParams }: PageProps) {
  const params: RawSearchParams = await (searchParams ?? Promise.resolve({}));
  const sort = getString(params, "sort");
  const stock = getString(params, "stock");
  const { orderby, order } = resolveSort(sort);

  const { data: products, totalPages, totalProducts } = await fetchProducts({
    orderby,
    order,
    stock_status: stock || undefined,
  });

  const { data: newProducts } = await fetchProducts({
    orderby: "date",
    order: "desc",
    perPage: 4,
  });

  const wpHeroImages = await fetchHeroImages();

  const featuredProducts = products.filter(
    (p) => (p as { featured?: boolean }).featured
  );

  // Hydrate flyers with images from WordPress backend
  const dynamicFlyers = FLYERS.map((flyer, index) => {
    // Top priority: Direct WP Home matching index
    // Second priority: WP Home first image
    // Third priority: Featured Product main image
    // Fallback: Static config image

    // We try to pull exactly the WP slide that matches index:
    const specificWpImg = wpHeroImages[index];
    const fallbackWpImg = index === 0 ? specificWpImg : (wpHeroImages[0] || specificWpImg); // If more flyers than wp images, reuse the first one.

    const p = featuredProducts[index];
    const featuredProImg = p?.images?.[0]?.src;

    const resolvedHeroImage = specificWpImg || fallbackWpImg || featuredProImg || flyer.image;

    const productsImages = p?.images && p.images.length > 1
      ? [p.images[0].src, p.images[1].src]
      : flyer.products;

    return {
      ...flyer,
      image: resolvedHeroImage,
      products: productsImages
    };
  });

  const displayProducts = featuredProducts.length ? featuredProducts : products;

  return (
    <main className="bg-[#f8f8f8] text-gray-900 pb-10">
      <InteractiveFlyer flyers={dynamicFlyers} />
      <NewProductArrivals products={newProducts} />

      {/* Featured Products */}
      <section className="bg-[#f8f8f8] py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-5 text-center sm:text-left">
            <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
              Featured Products
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Ready-to-ship systems and essentials for professionals.
            </p>
          </div>

          <Suspense fallback={null}>
            <FilterBar totalCount={totalProducts} />
          </Suspense>

          <ProductGrid
            initialProducts={displayProducts}
            initialPage={1}
            totalPages={totalPages}
          />
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-[#f8f8f8] pt-2 pb-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 max-w-lg mx-auto text-center">
            <h2 className="text-lg font-bold text-gray-900">Be the First to Know</h2>
            <p className="mt-1 text-sm text-gray-500">
              Hardware updates and community drops.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <label className="sr-only" htmlFor="newsletter-email">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-black focus:outline-none"
              />
              <button
                type="button"
                className="w-full rounded-lg bg-black px-6 py-3 text-sm font-semibold tracking-wide text-white transition duration-150 hover:bg-gray-800 uppercase"
                aria-label="Subscribe to newsletter"
              >
                Join Now
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
