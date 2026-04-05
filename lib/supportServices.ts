export type SupportService = {
  id: number;
  title: string;
  description: string;
  price: string;
  image: string;
  slug: string;
};

export type SupportServiceDefinition = {
  key: "maintenance" | "home_service" | "out_of_warranty";
  title: string;
  description: string;
  matchNames: string[];
  matchSlugs: string[];
};

export const SUPPORT_SERVICE_DEFINITIONS: SupportServiceDefinition[] = [
  {
    key: "maintenance",
    title: "Maintenance Service",
    description:
      "Request scheduled maintenance for printers, scanners, and workshop equipment.",
    matchNames: ["maintenance service", "maintenance"],
    matchSlugs: ["maintenance-service", "maintenance-service-2"],
  },
  {
    key: "home_service",
    title: "Home Service",
    description:
      "Arrange an on-site visit for diagnostics, setup help, and repair support.",
    matchNames: ["home service"],
    matchSlugs: ["home-service", "home-service-2"],
  },
  {
    key: "out_of_warranty",
    title: "Out of Warranty Service",
    description:
      "Get paid repair assistance for products that are no longer covered by warranty.",
    matchNames: ["out of warranty service", "out of creality", "out of warranty"],
    matchSlugs: ["out-of-warranty-service", "out-of-creality"],
  },
];

function normalizeMatchValue(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
}

export function findSupportServiceDefinition(input: {
  name?: string | null;
  slug?: string | null;
}) {
  const normalizedName = input.name ? normalizeMatchValue(input.name) : null;
  const normalizedSlug = input.slug ? normalizeMatchValue(input.slug) : null;

  return (
    SUPPORT_SERVICE_DEFINITIONS.find((definition) => {
      const matchesSlug = normalizedSlug
        ? definition.matchSlugs.some(
            (slug) => normalizeMatchValue(slug) === normalizedSlug
          )
        : false;

      if (matchesSlug) {
        return true;
      }

      return normalizedName
        ? definition.matchNames.some(
            (name) => normalizeMatchValue(name) === normalizedName
          )
        : false;
    }) ?? null
  );
}
