"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LogoutResponse =
  | { success: true; data: Record<string, never> }
  | { success: false; error: string };

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      const data = (await response.json()) as LogoutResponse;

      if (!response.ok || !data.success) {
        const errorMsg = !data.success ? data.error : "Unable to sign out.";
        setError(errorMsg);
        return;
      }

      router.replace("/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to sign out.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? "Signing out..." : "Logout"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
