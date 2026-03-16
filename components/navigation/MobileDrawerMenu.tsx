"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

type MobileDrawerMenuProps = {
  onNavigate?: () => void;
};

type DrawerLink = {
  label: string;
  href: string;
};

type DrawerSection = DrawerLink & {
  id: string;
  children?: DrawerLink[];
};

const mainSections: DrawerSection[] = [
  {
    id: "all-products",
    label: "All Products",
    href: "/store",
    children: [
      { label: "3D Printer", href: "/category/3d-printers" },
      { label: "3D Scanner", href: "/category/3d-scanners" },
      { label: "Accessory", href: "/category/accessories" },
      { label: "Material", href: "/category/materials" },
      { label: "Washing and Curing", href: "/category/washing-curing" },
      { label: "Laser", href: "/category/laser-milling" },
      { label: "Milling", href: "/category/laser-milling-series" },
    ],
  },
  {
    id: "printing-service",
    label: "Printing Service",
    href: "/printing-service",
    children: [{ label: "Start a Print Job", href: "/printing-service" }],
  },
  {
    id: "downloads",
    label: "Downloads",
    href: "/downloads",
    children: [
      { label: "3D Print Files", href: "/downloads" },
      { label: "Documents", href: "/downloads" },
      { label: "Software", href: "/downloads" },
    ],
  },
  {
    id: "support",
    label: "Support",
    href: "/support",
  },
];

const accountSection: DrawerSection = {
  id: "account",
  label: "Account",
  href: "/account",
  children: [
    { label: "Dashboard", href: "/account" },
    { label: "Orders", href: "/account/orders" },
    { label: "Addresses", href: "/account/addresses" },
  ],
};

function DrawerRow({
  section,
  expanded,
  onNavigate,
  onToggle,
}: {
  section: DrawerSection;
  expanded: boolean;
  onNavigate?: () => void;
  onToggle: () => void;
}) {
  const hasChildren = Boolean(section.children?.length);
  const panelId = `${section.id}-submenu`;

  return (
    <div className="border-b border-gray-100 transition hover:bg-gray-50">
      <div className="flex items-center justify-between gap-4 py-4">
        <Link
          href={section.href}
          className="min-w-0 flex-1 text-sm font-medium text-gray-900"
          onClick={onNavigate}
        >
          {section.label}
        </Link>
        {hasChildren && (
          <button
            type="button"
            onClick={onToggle}
            className="rounded-md p-1 text-gray-400 transition hover:text-gray-900"
            aria-expanded={expanded}
            aria-controls={panelId}
            aria-label={`${expanded ? "Collapse" : "Expand"} ${section.label}`}
          >
            <ChevronDown
              size={18}
              className={`transition-transform ${expanded ? "rotate-180" : "rotate-0"}`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
      {hasChildren && expanded && (
        <div id={panelId} className="flex flex-col gap-2 pb-3 pl-4 text-gray-600">
          {section.children?.map((child) => (
            <Link
              key={`${section.id}-${child.href}-${child.label}`}
              href={child.href}
              className="text-sm transition hover:text-gray-900"
              onClick={onNavigate}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MobileDrawerMenu({ onNavigate }: MobileDrawerMenuProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setOpenSection((current) => (current === sectionId ? null : sectionId));
  };

  return (
    <div className="flex flex-col">
      <div>
        {mainSections.map((section) => (
          <DrawerRow
            key={section.id}
            section={section}
            expanded={openSection === section.id}
            onNavigate={onNavigate}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </div>

      <div className="mt-2">
        <DrawerRow
          section={accountSection}
          expanded={openSection === accountSection.id}
          onNavigate={onNavigate}
          onToggle={() => toggleSection(accountSection.id)}
        />
      </div>
    </div>
  );
}
