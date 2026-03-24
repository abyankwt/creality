import ProductGridSkeleton from "@/components/ProductGridSkeleton";

export default function CatalogPageSkeleton() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-6 space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
        <div className="h-10 w-56 animate-pulse rounded bg-gray-100" />
      </div>

      <ProductGridSkeleton />
    </section>
  );
}
