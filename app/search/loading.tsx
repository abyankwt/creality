import ProductGridSkeleton from "@/components/ProductGridSkeleton";

export default function SearchLoading() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12 sm:py-16">
      <div className="mb-8 space-y-3">
        <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
        <div className="h-10 w-72 animate-pulse rounded bg-gray-100" />
        <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
      </div>

      <ProductGridSkeleton />
    </section>
  );
}
