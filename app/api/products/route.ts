import { NextRequest, NextResponse } from "next/server";
import { fetchProducts } from "@/lib/woocommerce";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const perPage = parseInt(searchParams.get("per_page") ?? "12", 10);
    const search = searchParams.get("search") ?? undefined;
    const stock_status = searchParams.get("stock_status") ?? undefined;
    const orderby = searchParams.get("orderby") ?? undefined;
    const order = (searchParams.get("order") as "asc" | "desc" | null) ?? undefined;
    const category = searchParams.get("category");
    const exclude = searchParams.get("exclude");

    const result = await fetchProducts({
      page,
      perPage,
      search,
      stock_status,
      orderby,
      order: order ?? undefined,
      category: category ? Number(category) : undefined,
    });

    const excludedId = exclude ? Number(exclude) : undefined;
    const products = Number.isFinite(excludedId)
      ? result.data.filter((product) => product.id !== excludedId)
      : result.data;

    return NextResponse.json({
      products,
      pagination: {
        page,
        perPage,
        totalPages: result.totalPages,
        totalProducts: result.totalProducts,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
