import { NextResponse, type NextRequest } from "next/server";
import { apiError, apiSuccess, ERROR_MESSAGES, resolveErrorMessage } from "@/lib/errors";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth-session";
import { getWooCustomer, updateWooCustomer } from "@/lib/woo-client";
import type { WooAddress, WooCustomer } from "@/lib/types";

type CustomerUpdatePayload = {
  billing?: Partial<WooAddress>;
  shipping?: Partial<WooAddress>;
};

const pickAddress = (input: Partial<WooAddress>) => ({
  first_name: input.first_name ?? "",
  last_name: input.last_name ?? "",
  company: input.company ?? "",
  address_1: input.address_1 ?? "",
  address_2: input.address_2 ?? "",
  city: input.city ?? "",
  state: input.state ?? "",
  postcode: input.postcode ?? "",
  country: input.country ?? "",
  email: input.email,
  phone: input.phone,
});

const sanitizeUpdate = (payload: CustomerUpdatePayload) => {
  const update: Record<string, unknown> = {};
  if (payload.billing) {
    update.billing = pickAddress(payload.billing);
  }
  if (payload.shipping) {
    update.shipping = pickAddress(payload.shipping);
  }
  return update;
};

const normalizeCustomer = (customer: WooCustomer): WooCustomer => ({
  billing: pickAddress(customer.billing),
  shipping: pickAddress(customer.shipping),
});

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(apiError(ERROR_MESSAGES.unauthorized), { status: 401 });
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json(apiError(ERROR_MESSAGES.unauthorized), { status: 401 });
    }

    const response = await getWooCustomer(session.userId);
    if (!response.ok || !response.data) {
      return NextResponse.json(apiError(ERROR_MESSAGES.serviceUnavailable), {
        status: response.status || 502,
      });
    }

    const customer = normalizeCustomer(response.data);
    return NextResponse.json(apiSuccess(customer));
  } catch (error) {
    const message = resolveErrorMessage(error, ERROR_MESSAGES.serverError);
    return NextResponse.json(apiError(message), { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json(apiError(ERROR_MESSAGES.unauthorized), { status: 401 });
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json(apiError(ERROR_MESSAGES.unauthorized), { status: 401 });
    }

    const body = (await request.json()) as CustomerUpdatePayload;
    if (!body || typeof body !== "object") {
      return NextResponse.json(apiError(ERROR_MESSAGES.badRequest), { status: 400 });
    }
    const update = sanitizeUpdate(body ?? {});
    if (!update.billing && !update.shipping) {
      return NextResponse.json(apiError(ERROR_MESSAGES.badRequest), { status: 400 });
    }

    const response = await updateWooCustomer(session.userId, update);
    if (!response.ok || !response.data) {
      return NextResponse.json(apiError(ERROR_MESSAGES.serviceUnavailable), {
        status: response.status || 502,
      });
    }

    const customer = normalizeCustomer(response.data);
    return NextResponse.json(apiSuccess(customer));
  } catch (error) {
    const message = resolveErrorMessage(error, ERROR_MESSAGES.serverError);
    return NextResponse.json(apiError(message), { status: 500 });
  }
}
