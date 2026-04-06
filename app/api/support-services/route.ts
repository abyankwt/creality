import { NextResponse } from "next/server";
import type { SupportService } from "@/lib/supportServices";
import { fetchSupportServices } from "@/lib/support-services-data";

export const revalidate = 60;

export async function GET() {
  const services: SupportService[] = await fetchSupportServices();

  return NextResponse.json({ services });
}
