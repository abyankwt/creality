import Link from "next/link";
import { cookies } from "next/headers";
import LogoutButton from "@/components/account/LogoutButton";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth-session";

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySession(token) : null;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Welcome back{session ? `, ${session.name}` : ""}
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Keep track of your purchases and manage your delivery information.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/account/orders"
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            View orders
          </Link>
          <Link
            href="/account/addresses"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Manage addresses
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            Status
          </p>
          <p className="mt-3 text-lg font-semibold text-gray-900">Account ready</p>
          <p className="mt-2 text-sm text-gray-500">
            Your profile is connected to WooCommerce and ready to shop.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            Email
          </p>
          <p className="mt-3 text-lg font-semibold text-gray-900">
            {session?.email ?? "Not available"}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Update billing contact details from the addresses page.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">Quick sign out</h3>
        <p className="mt-2 text-sm text-gray-500">
          You can sign out anytime. Your cart will stay available on this device.
        </p>
        <div className="mt-4">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
