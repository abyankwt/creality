"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

const navItems = [
  { href: "/account", label: "Dashboard" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
];

export default function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
        Account
      </p>
      <nav className="mt-5 space-y-2">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={`${item.href}-${index}`}
              href={item.href}
              className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${isActive
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
          Profile
        </p>
        <p className="mt-2 text-xs text-gray-500">Sign out of your account</p>
        <div className="mt-3">
          <LogoutButton fullWidth />
        </div>
      </div>
    </aside>
  );
}
