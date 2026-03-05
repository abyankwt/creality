import { NextResponse, type NextRequest } from "next/server";

const NONCE_HEADER = "Nonce";
const CART_TOKEN_HEADER = "Cart-Token";

const WC_NONCE_COOKIE = "wc_nonce";
const WC_CART_TOKEN_COOKIE = "wc_cart_token";

export async function proxyToWooStore(
  path: string,
  request: NextRequest
): Promise<NextResponse> {
  const baseUrl = process.env.WC_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { error: "WC_BASE_URL environment variable is not set." },
      { status: 500 }
    );
  }

  const url = `${baseUrl.replace(/\/$/, "")}/wp-json/wc/store/${path}`;

  const outgoing = new Headers();

  const clientCartToken = request.headers.get(CART_TOKEN_HEADER);
  const storedCartToken = request.cookies.get(WC_CART_TOKEN_COOKIE)?.value;
  const cartToken = clientCartToken || storedCartToken;


  if (cartToken) {
    outgoing.set(CART_TOKEN_HEADER, cartToken);
  }

  const clientNonce = request.headers.get(NONCE_HEADER);
  const storedNonce = request.cookies.get(WC_NONCE_COOKIE)?.value;
  const nonceToSend = clientNonce || storedNonce;
  if (nonceToSend) {
    outgoing.set(NONCE_HEADER, nonceToSend);
  }

  const method = request.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    outgoing.set("content-type", "application/json");
  }

  let body: string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    try {
      const json = await request.json();
      body = JSON.stringify(json);
    } catch {
      // No body
    }
  }

  let wooResponse: Response;
  try {
    // Add cache-busting for GET requests to avoid stale cart data
    const fetchUrl = method === "GET"
      ? `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`
      : url;

    if (method === "GET") {
      outgoing.set("Cache-Control", "no-cache, no-store, must-revalidate");
      outgoing.set("Pragma", "no-cache");
    }

    wooResponse = await fetch(fetchUrl, { method, headers: outgoing, body, cache: "no-store" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    return NextResponse.json({ error: `Failed to reach WooCommerce: ${msg}` }, { status: 502 });
  }

  const text = await wooResponse.text();


  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  const nextResponse = NextResponse.json(data, {
    status: wooResponse.status,
  });

  const responseCartToken = wooResponse.headers.get(CART_TOKEN_HEADER);
  if (responseCartToken) {
    nextResponse.cookies.set(WC_CART_TOKEN_COOKIE, responseCartToken, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    nextResponse.headers.set(CART_TOKEN_HEADER, responseCartToken);
  }

  const responseNonce = wooResponse.headers.get(NONCE_HEADER);
  if (responseNonce) {
    nextResponse.cookies.set(WC_NONCE_COOKIE, responseNonce, {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24,
      sameSite: "lax",
    });
    nextResponse.headers.set(NONCE_HEADER, responseNonce);
  }

  nextResponse.headers.set(
    "Access-Control-Expose-Headers",
    `${NONCE_HEADER}, ${CART_TOKEN_HEADER}`
  );

  return nextResponse;
}
