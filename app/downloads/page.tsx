"use client";

import { useState } from "react";
import DocumentationLibrary from "@/components/downloads/DocumentationLibrary";
import SoftwareCenter from "@/components/downloads/SoftwareCenter";
import ModelRepository from "@/components/downloads/ModelRepository";

type Tab = "models" | "docs" | "software";

export default function DownloadsPage() {
    const [activeTab, setActiveTab] = useState<Tab>("models");

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                        Downloads &amp; Resources
                    </h1>
                    <p className="mt-2 text-base text-gray-500 max-w-2xl">
                        Access our community 3D models repository, official product documentation, and latest software slicers.
                    </p>
                </div>

                {/* Tabs */}
                <div className="mb-8 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab("models")}
                            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-semibold transition-colors ${activeTab === "models"
                                ? "border-black text-black"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                }`}
                        >
                            3D Models
                        </button>
                        <button
                            onClick={() => setActiveTab("docs")}
                            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-semibold transition-colors ${activeTab === "docs"
                                ? "border-black text-black"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                }`}
                        >
                            Documentation
                        </button>
                        <button
                            onClick={() => setActiveTab("software")}
                            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-semibold transition-colors ${activeTab === "software"
                                ? "border-black text-black"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                }`}
                        >
                            Software Center
                        </button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 min-h-[500px]">
                    {activeTab === "models" && <ModelRepository />}
                    {activeTab === "docs" && <DocumentationLibrary />}
                    {activeTab === "software" && <SoftwareCenter />}
                </div>

            </div>
        </div>
    );
}
