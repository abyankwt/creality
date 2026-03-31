import type { Metadata } from "next";
import ContactInquiryForm from "@/components/ContactInquiryForm";
import { INQUIRY_EMAIL, SUPPORT_EMAIL } from "@/config/emails";

export const metadata: Metadata = {
  title: "Contact Us | Creality Kuwait",
  description: "Send a general inquiry to the Creality Kuwait team.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
              Contact
            </p>
            <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">
              General Inquiries
            </h1>
            <p className="text-sm leading-relaxed text-gray-500 sm:text-base">
              Send your question without leaving the site. Your message will be
              delivered directly to our inquiry team.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900">Send a Message</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Use this form for general questions, partnerships, and non-order
              inquiries.
            </p>
            <div className="mt-6">
              <ContactInquiryForm />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">Email Roles</h2>
              <div className="mt-5 space-y-4 text-sm text-gray-600">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="font-semibold text-gray-900">General inquiries</p>
                  <p className="mt-1">{INQUIRY_EMAIL}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <p className="font-semibold text-gray-900">Support</p>
                  <p className="mt-1">{SUPPORT_EMAIL}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">Response Guidance</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Include enough detail for a first reply. For order issues, use the
                support center so the team can resolve purchase-specific requests
                faster.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
