import CatalogPage from "@/components/CatalogPage";
import {
  buildCatalogApiQuery,
  fetchCatalogProducts,
  getCatalogParam,
  slugToTitle,
  type RawCatalogSearchParams,
} from "@/lib/catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title: slugToTitle(slug),
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawCatalogSearchParams>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const sort = getCatalogParam(resolvedSearchParams, "sort");
  const stock =
    getCatalogParam(resolvedSearchParams, "stock") ??
    getCatalogParam(resolvedSearchParams, "stock_status");
  const title = slugToTitle(slug);
  const { data: products, totalPages } = await fetchCatalogProducts({
    categorySlug: slug,
    sort,
    stockStatus: stock,
  });

  return (
    <CatalogPage
      title={title}
      products={products}
      totalPages={totalPages}
      apiQuery={buildCatalogApiQuery({
        categorySlug: slug,
        sort,
        stockStatus: stock,
      })}
      emptyMessage={`No products found in ${title}.`}
    />
  );
}
