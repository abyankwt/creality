import SupportPageClient from "@/components/SupportPageClient";
import { fetchSupportServices } from "@/lib/support-services-data";

export default async function SupportPage() {
  const services = await fetchSupportServices();

  return <SupportPageClient initialServices={services} />;
}
