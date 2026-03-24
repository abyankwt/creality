import type { CategoryNode } from "@/lib/categories";

export type CategoryGroup = {
  id: string;
  label: string;
  categories: CategoryNode[];
};

const GROUP_BLUEPRINT = [
  {
    id: "machines",
    label: "3D Printers",
    slugs: ["3d-printers", "3d-scanners", "laser-milling"],
  },
  {
    id: "materials",
    label: "Materials",
    slugs: ["materials", "washing-curing"],
  },
  {
    id: "essentials",
    label: "Accessories",
    slugs: ["accessories", "spare-parts"],
  },
] as const;

export function buildCategoryGroups(categories: CategoryNode[]): CategoryGroup[] {
  const categoryMap = new Map(categories.map((category) => [category.slug, category]));
  const used = new Set<string>();

  const groups: CategoryGroup[] = GROUP_BLUEPRINT.map((group) => {
    const groupCategories = group.slugs
      .map((slug) => {
        const category = categoryMap.get(slug);
        if (category) {
          used.add(slug);
        }
        return category;
      })
      .filter((category): category is CategoryNode => Boolean(category));

    return {
      id: group.id,
      label: group.label,
      categories: groupCategories,
    };
  }).filter((group) => group.categories.length > 0);

  const remaining = categories.filter((category) => !used.has(category.slug));
  if (remaining.length > 0) {
    groups.push({
      id: "more",
      label: "More Categories",
      categories: remaining,
    });
  }

  return groups.slice(0, 4);
}
