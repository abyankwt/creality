"use client";

import { useCallback, useRef, useState } from "react";
import type { ApiResponse } from "@/lib/types";

/* ---- Types ---- */

type PrinterMatch = {
    id: string;
    name: string;
    build_volume: string;
};

type CostBreakdown = {
    material_cost: number;
    processing_cost: number;
    delivery_cost: number;
    total_cost: number;
    currency: string;
};

type PrintAnalysisResponse = {
    job_id: number;
    file_name: string;
    dimensions: { width: number; height: number; depth: number };
    volume_cm3: number;
    material_grams: number;
    estimated_time_minutes: number;
    estimated_time_display: string;
    compatible_printers: PrinterMatch[];
    breakdown: CostBreakdown;
};

type UploadState =
    | { status: "idle" }
    | { status: "uploading"; fileName: string; fileSize: string }
    | { status: "error"; message: string }
    | { status: "success"; data: PrintAnalysisResponse };

/* ---- Helpers ---- */

const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
};

const ALLOWED = new Set(["stl", "obj"]);
const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

/* ---- Component ---- */

export default function PrintEstimator() {
    const [state, setState] = useState<UploadState>({ status: "idle" });
    const [dragOver, setDragOver] = useState(false);
    const [ordering, setOrdering] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    /* --- File validation --- */
    const validateFile = (file: File): string | null => {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!ALLOWED.has(ext)) return "Only .stl and .obj files are accepted.";
        if (file.size > MAX_SIZE) return "File exceeds the 50 MB limit.";
        return null;
    };

    /* --- Upload handler --- */
    const handleUpload = useCallback(async (file: File) => {
        const error = validateFile(file);
        if (error) {
            setState({ status: "error", message: error });
            return;
        }

        setState({ status: "uploading", fileName: file.name, fileSize: formatBytes(file.size) });

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/print/analyze", {
                method: "POST",
                body: formData,
            });

            const body = (await res.json()) as ApiResponse<PrintAnalysisResponse>;
            if (!res.ok || !body.success) {
                setState({ status: "error", message: body.success ? "Analysis failed." : body.error });
                return;
            }

            setState({ status: "success", data: body.data });
        } catch (err) {
            setState({ status: "error", message: err instanceof Error ? err.message : "Upload failed." });
        }
    }, []);

    /* --- Drag & drop --- */
    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleUpload(file);
        },
        [handleUpload]
    );

    const onFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            // Reset input so same file can be re-selected.
            e.target.value = "";
        },
        [handleUpload]
    );

    /* --- Add to cart --- */
    const handleOrder = async () => {
        if (state.status !== "success") return;
        setOrdering(true);

        const d = state.data;
        try {
            const res = await fetch("/api/print/add-to-cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    job_id: d.job_id,
                    total_cost: d.breakdown.total_cost,
                    summary: {
                        dimensions: `${d.dimensions.width}×${d.dimensions.height}×${d.dimensions.depth} mm`,
                        material_grams: d.material_grams,
                        estimated_time: d.estimated_time_display,
                        printer: d.compatible_printers[0]?.name ?? "N/A",
                    },
                }),
            });

            const body = (await res.json()) as ApiResponse<{ order_id: number; checkout_url: string }>;
            if (!res.ok || !body.success) {
                setOrdering(false);
                setState({ status: "error", message: body.success ? "Order failed." : body.error });
                return;
            }

            // Redirect to WooCommerce checkout.
            window.location.href = body.data.checkout_url;
        } catch {
            setOrdering(false);
            setState({ status: "error", message: "Failed to create order." });
        }
    };

    /* --- Reset --- */
    const reset = () => {
        setState({ status: "idle" });
        setOrdering(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900">Instant Print Estimate</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Upload your 3D model to get an instant price, time, and printer compatibility estimate.
                </p>
            </div>

            {/* Upload area — shown when idle or error */}
            {(state.status === "idle" || state.status === "error") && (
                <>
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={onDrop}
                        onClick={() => inputRef.current?.click()}
                        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition ${dragOver
                                ? "border-gray-900 bg-gray-100"
                                : "border-gray-300 bg-[#fafafa] hover:border-gray-400 hover:bg-gray-50"
                            }`}
                    >
                        {/* Upload icon */}
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                            <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                            {dragOver ? "Drop file here" : "Drag & drop your 3D model"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            or <span className="font-medium text-gray-700 underline underline-offset-2">browse files</span>
                        </p>
                        <p className="mt-3 text-[11px] text-gray-400">STL or OBJ · Max 50 MB</p>
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".stl,.obj"
                            onChange={onFileChange}
                            className="hidden"
                        />
                    </div>

                    {state.status === "error" && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
                            {state.message}
                        </div>
                    )}
                </>
            )}

            {/* Uploading spinner */}
            {state.status === "uploading" && (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
                    <p className="text-sm font-semibold text-gray-900">Analyzing your model…</p>
                    <p className="mt-1 text-xs text-gray-500">
                        {state.fileName} · {state.fileSize}
                    </p>
                </div>
            )}

            {/* Results */}
            {state.status === "success" && (
                <div className="space-y-4">
                    {/* File info */}
                    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{state.data.file_name}</p>
                                <p className="text-xs text-gray-500">Job #{state.data.job_id}</p>
                            </div>
                        </div>
                        <button
                            onClick={reset}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                            New Upload
                        </button>
                    </div>

                    {/* Estimation cards */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Dimensions</p>
                            <p className="mt-1 text-sm font-bold text-gray-900">
                                {state.data.dimensions.width}×{state.data.dimensions.height}×{state.data.dimensions.depth}
                            </p>
                            <p className="text-[11px] text-gray-400">mm</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Volume</p>
                            <p className="mt-1 text-sm font-bold text-gray-900">{state.data.volume_cm3}</p>
                            <p className="text-[11px] text-gray-400">cm³</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Material</p>
                            <p className="mt-1 text-sm font-bold text-gray-900">{state.data.material_grams.toFixed(1)}</p>
                            <p className="text-[11px] text-gray-400">grams</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Print Time</p>
                            <p className="mt-1 text-sm font-bold text-gray-900">{state.data.estimated_time_display}</p>
                            <p className="text-[11px] text-gray-400">estimated</p>
                        </div>
                    </div>

                    {/* Compatible printers */}
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <p className="text-sm font-semibold text-gray-900">Compatible Printers</p>
                        {state.data.compatible_printers.length === 0 ? (
                            <p className="mt-2 text-xs text-red-500">
                                No compatible printers found. The model may exceed available build volumes.
                            </p>
                        ) : (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {state.data.compatible_printers.map((p) => (
                                    <div key={p.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                        <p className="text-xs font-semibold text-gray-900">{p.name}</p>
                                        <p className="text-[11px] text-gray-500">{p.build_volume}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cost breakdown */}
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <p className="text-sm font-semibold text-gray-900">Cost Breakdown</p>
                        <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Material</span>
                                <span className="font-medium text-gray-900">
                                    {state.data.breakdown.material_cost.toFixed(3)} {state.data.breakdown.currency}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Processing</span>
                                <span className="font-medium text-gray-900">
                                    {state.data.breakdown.processing_cost.toFixed(3)} {state.data.breakdown.currency}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Delivery</span>
                                <span className="font-medium text-gray-900">
                                    {state.data.breakdown.delivery_cost.toFixed(3)} {state.data.breakdown.currency}
                                </span>
                            </div>
                            <div className="border-t border-gray-200 pt-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-base font-bold text-gray-900">Total</span>
                                    <span className="text-xl font-bold text-gray-900">
                                        {state.data.breakdown.total_cost.toFixed(3)} {state.data.breakdown.currency}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <button
                        onClick={handleOrder}
                        disabled={ordering || state.data.compatible_printers.length === 0}
                        className="w-full rounded-xl bg-black py-4 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:bg-gray-800 disabled:opacity-50"
                    >
                        {ordering ? "Creating Order…" : "Proceed to Order"}
                    </button>

                    {state.data.compatible_printers.length === 0 && (
                        <p className="text-center text-xs text-gray-500">
                            Order unavailable — no compatible printer for this model size.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
