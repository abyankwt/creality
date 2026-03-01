"use client";

import { useState } from "react";
import { Search, FileText, Download } from "lucide-react";

type Doc = {
    id: string;
    title: string;
    category: string;
    version: string;
    url: string;
    size: string;
};

const MOCK_DOCS: Doc[] = [
    { id: "1", title: "K1 Max User Manual", category: "FDM Printers", version: "V1.2", url: "#", size: "12.4 MB" },
    { id: "2", title: "Halot Mage Pro Setup Guide", category: "Resin Printers", version: "V2.0", url: "#", size: "8.1 MB" },
    { id: "3", title: "Ender 3 V3 KE Assembly", category: "FDM Printers", version: "V1.0", url: "#", size: "15.2 MB" },
    { id: "4", title: "Creality Print User Guide", category: "Software", version: "V4.3", url: "#", size: "5.5 MB" },
];

export default function DocumentationLibrary() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");

    const categories = ["All", ...new Set(MOCK_DOCS.map(d => d.category))];

    const filteredDocs = MOCK_DOCS.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = filter === "All" || doc.category === filter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search manuals and guides..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-black focus:outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${filter === cat ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredDocs.map((doc) => (
                    <div key={doc.id} className="group flex flex-col justify-between rounded-xl border border-gray-200 p-5 hover:border-gray-400 transition-colors">
                        <div>
                            <div className="flex items-start justify-between">
                                <div className="rounded-lg bg-gray-100 p-2.5 text-gray-600">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">
                                    {doc.version}
                                </span>
                            </div>
                            <h3 className="mt-4 text-base font-semibold text-gray-900 group-hover:text-black line-clamp-2">
                                {doc.title}
                            </h3>
                            <p className="mt-1 text-xs text-gray-500 uppercase tracking-wider">{doc.category}</p>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                            <span className="text-xs text-gray-400 font-medium">{doc.size}</span>
                            <button className="flex items-center gap-1.5 text-sm font-semibold text-black hover:opacity-70 transition-opacity">
                                PDF <Download className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {filteredDocs.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 text-sm">
                        No documentation found for your search.
                    </div>
                )}
            </div>
        </div>
    );
}
