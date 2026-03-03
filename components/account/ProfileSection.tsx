"use client";

import Link from "next/link";
import type { UserSession } from "@/lib/types";
import LogoutButton from "./LogoutButton";

type Props = {
    session: UserSession | null;
};

export default function ProfileSection({ session }: Props) {
    return (
        <div className="space-y-4">
            {/* Info grid */}
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Name</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{session?.name ?? "—"}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Email</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{session?.email ?? "—"}</p>
                </div>
            </div>

            {/* Quick links */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm font-semibold text-gray-900">Quick Links</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                        href="/account/addresses"
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        Manage Addresses
                    </Link>
                    <Link
                        href="/account/orders"
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                        View All Orders
                    </Link>
                </div>
            </div>

            {/* Sign out */}
            <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm font-semibold text-gray-900">Sign Out</p>
                <p className="mt-1 text-xs text-gray-500">Your cart will stay available on this device.</p>
                <div className="mt-3">
                    <LogoutButton />
                </div>
            </div>
        </div>
    );
}
