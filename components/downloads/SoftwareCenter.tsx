"use client";

import { Monitor, Apple, Terminal } from "lucide-react";

type Software = {
    id: string;
    name: string;
    version: string;
    releaseDate: string;
    os: "Windows" | "Mac" | "Linux";
    notes: string;
    url: string;
};

const MOCK_SOFTWARE: Software[] = [
    { id: "1", name: "Creality Print", version: "5.0.3", releaseDate: "2024-02-15", os: "Windows", notes: "Added K1 Max high-speed profile support. Optimized slicing engine.", url: "#" },
    { id: "2", name: "Creality Print", version: "5.0.3", releaseDate: "2024-02-15", os: "Mac", notes: "Apple Silicon natively supported. Fixed UI bugs.", url: "#" },
    { id: "3", name: "Creality Print", version: "5.0.3", releaseDate: "2024-02-15", os: "Linux", notes: "AppImage release with updated dependencies.", url: "#" },
    { id: "4", name: "Halot Box", version: "3.2.1", releaseDate: "2023-11-10", os: "Windows", notes: "Improved resin exposure calculation algorithms.", url: "#" },
    { id: "5", name: "Halot Box", version: "3.2.1", releaseDate: "2023-11-10", os: "Mac", notes: "Intel and Apple Silicon universal binary.", url: "#" },
];

const OSDict = {
    Windows: { icon: <Monitor className="h-4 w-4" />, color: "bg-blue-50 text-blue-700 border-blue-200" },
    Mac: { icon: <Apple className="h-4 w-4" />, color: "bg-gray-50 text-gray-800 border-gray-300" },
    Linux: { icon: <Terminal className="h-4 w-4" />, color: "bg-orange-50 text-orange-700 border-orange-200" },
};

export default function SoftwareCenter() {
    const handleDownload = (swName: string, version: string) => {
        // Analytics/Click tracking would go here
        console.log(`Downloading ${swName} v${version}`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid gap-5 lg:grid-cols-2">
                {MOCK_SOFTWARE.map((sw) => {
                    const config = OSDict[sw.os];

                    return (
                        <div key={sw.id} className="flex flex-col sm:flex-row gap-4 p-5 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-gray-900">{sw.name}</h3>
                                    <span className="px-2 py-0.5 rounded bg-gray-100 text-[10px] font-bold text-gray-600 tracking-wider">
                                        v{sw.version}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600 line-clamp-2">
                                    {sw.notes}
                                </p>
                                <p className="text-[11px] text-gray-400 font-medium">
                                    Released: {sw.releaseDate}
                                </p>
                            </div>

                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t border-gray-100 sm:border-t-0 sm:border-l sm:pl-5 pt-4 sm:pt-0 gap-3">
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${config.color}`}>
                                    {config.icon} {sw.os}
                                </div>
                                <button
                                    onClick={() => handleDownload(sw.name, sw.version)}
                                    className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                                >
                                    Download
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
