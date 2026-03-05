"use client";

import { useState } from "react";
import OrdersSection from "./OrdersSection";
import SubscriptionsSection from "./SubscriptionsSection";
import LoyaltySection from "./LoyaltySection";
import ProfileSection from "./ProfileSection";
import LogoutButton from "./LogoutButton";
import type { UserSession } from "@/lib/types";

type Tab = "orders" | "subscriptions" | "loyalty" | "profile";

const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "orders", label: "Orders", icon: "📦" },
    { key: "subscriptions", label: "Subscriptions", icon: "🔄" },
    { key: "loyalty", label: "Loyalty & Rewards", icon: "⭐" },
    { key: "profile", label: "Profile", icon: "👤" },
];

type Props = {
    session: UserSession | null;
};

export default function DashboardTabs({ session }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>("orders");

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                    Welcome back{session ? `, ${session.name}` : ""}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    Manage orders, subscriptions, loyalty points, and your profile.
                </p>
            </div>

            {/* Desktop tab bar */}
            <div className="hidden rounded-xl border border-gray-200 bg-gray-50 p-1 sm:flex">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${activeTab === tab.key
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <span className="mr-1.5">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Mobile accordion */}
            <div className="space-y-3 sm:hidden">
                {tabs.map((tab) => {
                    const isOpen = activeTab === tab.key;
                    return (
                        <div key={tab.key} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                            <button
                                onClick={() => setActiveTab(isOpen ? activeTab : tab.key)}
                                className="flex w-full items-center justify-between px-4 py-3 text-left"
                            >
                                <span className="text-sm font-semibold text-gray-900">
                                    <span className="mr-2">{tab.icon}</span>
                                    {tab.label}
                                </span>
                                <svg
                                    className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {isOpen && (
                                <div className="border-t border-gray-100 px-4 py-4">
                                    {tab.key === "orders" && <OrdersSection />}
                                    {tab.key === "subscriptions" && <SubscriptionsSection />}
                                    {tab.key === "loyalty" && <LoyaltySection />}
                                    {tab.key === "profile" && <ProfileSection session={session} />}
                                </div>
                            )}
                        </div>
                    );
                })}

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-sm font-semibold text-gray-900">Logout</p>
                    <p className="mt-1 text-xs text-gray-500">Sign out of your account</p>
                    <div className="mt-3">
                        <LogoutButton fullWidth />
                    </div>
                </div>
            </div>

            {/* Desktop content */}
            <div className="hidden sm:block">
                {activeTab === "orders" && <OrdersSection />}
                {activeTab === "subscriptions" && <SubscriptionsSection />}
                {activeTab === "loyalty" && <LoyaltySection />}
                {activeTab === "profile" && <ProfileSection session={session} />}
            </div>
        </div>
    );
}
