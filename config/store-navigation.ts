export interface NavGroup {
  title: string;
  categories?: string[];
  groups?: NavGroup[];
}

export const STORE_NAVIGATION: NavGroup[] = [
  {
    title: "3D Printers",
    groups: [
      {
        title: "FDM Printers",
        categories: ["3d-printers", "fdm-printers"],
      },
      {
        title: "Resin Printers",
        categories: ["resin-printers"],
      },
      {
        title: "Series",
        categories: ["k1-series", "ender-series", "cr-series", "halot-series"],
      },
    ],
  },
  {
    title: "3D Scanners",
    groups: [
      {
        title: "Portable",
        categories: ["3d-scanners", "portable-scanners"],
      },
      {
        title: "Professional",
        categories: ["professional-scanners"],
      },
    ],
  },
  {
    title: "Post Processing",
    groups: [
      {
        title: "Finishing",
        categories: ["post-processing", "wash-cure"],
      },
      {
        title: "Tools",
        categories: ["tools", "accessories"],
      },
    ],
  },
  {
    title: "Materials",
    groups: [
      {
        title: "Filament",
        categories: ["materials", "filament", "pla", "abs", "petg"],
      },
      {
        title: "Resin",
        categories: ["resin"],
      },
    ],
  },
  {
    title: "Spare Parts",
    groups: [
      {
        title: "Core Components",
        categories: ["spare-parts", "nozzles", "hotends", "extruders"],
      },
      {
        title: "Upgrades",
        categories: ["upgrades", "upgrade-kits"],
      },
    ],
  },
];
