import Link from "next/link";
import Image from "next/image";
import { WCProduct } from "@/lib/api";

type NewProductArrivalsProps = {
    products: WCProduct[];
};

export default function NewProductArrivals({ products }: NewProductArrivalsProps) {
    if (!products || products.length === 0) return null;

    return (
        <section className="bg-[#eef0f2] py-12 sm:py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="mb-6 flex items-end justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                            New Hardware Arrivals
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            The latest additions to our production ecosystem.
                        </p>
                    </div>
                    <Link
                        href="/store?sort=date_desc"
                        className="hidden text-sm font-semibold text-[#6BBE45] hover:underline sm:block uppercase tracking-wider"
                    >
                        View all new →
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {products.slice(0, 4).map((product) => {
                        const formattedPrice = new Intl.NumberFormat("en-KW", {
                            style: "currency",
                            currency: "KWD",
                            minimumFractionDigits: 2,
                        }).format(parseFloat(product.price || "0"));

                        const isAvailable = Boolean(product.purchasable && product.stock_status === "instock");

                        return (
                            <Link
                                key={product.id}
                                href={`/product/${product.slug}`}
                                className="group flex flex-col rounded-2xl border border-transparent bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-md sm:p-4"
                            >
                                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-50 mb-4">
                                    <Image
                                        src={product.images?.[0]?.src || "/placeholder.png"}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 768px) 50vw, 25vw"
                                        className="object-cover transition duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute left-2 top-2 z-10 rounded-full bg-black px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-white">
                                        New
                                    </div>
                                </div>

                                <div className="flex flex-1 flex-col justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-wider text-gray-400">
                                            Hardware
                                        </p>
                                        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-gray-900 group-hover:text-black">
                                            {product.name}
                                        </h3>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-sm font-bold text-gray-900">
                                            {formattedPrice}
                                        </span>
                                        <span className={`text-[11px] font-medium transition ${isAvailable ? "text-[#6BBE45]" : "text-gray-400"}`}>
                                            {isAvailable ? "Learn More" : "Out of Stock"}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                <div className="mt-6 flex justify-center sm:hidden">
                    <Link
                        href="/store?sort=date_desc"
                        className="rounded-xl border border-gray-200 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                    >
                        View all new
                    </Link>
                </div>
            </div>
        </section>
    );
}
