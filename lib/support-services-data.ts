import "server-only";

import {
  findSupportServiceDefinition,
  SUPPORT_SERVICE_DEFINITIONS,
  type SupportService,
} from "@/lib/supportServices";
import { getWooProductsByTagSlug } from "@/lib/woo-client";

export async function fetchSupportServices(): Promise<SupportService[]> {
  const result = await getWooProductsByTagSlug("service");

  if (!result.ok) {
    return [];
  }

  const matchedProducts = new Map(
    result.data.flatMap((product) => {
      const definition = findSupportServiceDefinition({
        name: product.name,
        slug: product.slug,
      });

      if (!definition) {
        return [];
      }

      return [[definition.key, product] as const];
    })
  );

  const products = SUPPORT_SERVICE_DEFINITIONS.flatMap((definition) => {
    const product = matchedProducts.get(definition.key);

    if (!product) {
      return [];
    }

    return [
      {
        ...product,
        supportDescription: definition.description,
      },
    ];
  });

  console.log(products);

  const services = products.map((product) => ({
    id: product.id,
    title: product.name,
    description: product.supportDescription,
    price: product.price ?? "0",
    image: product.images?.[0]?.src || "",
    slug: product.slug,
  }));

  services.forEach((service) => {
    console.log(service.image);
  });

  return services;
}
