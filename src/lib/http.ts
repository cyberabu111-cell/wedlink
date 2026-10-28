import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function readLimitedBody(request: Request, limit = 16_384): Promise<Buffer> {
  if (Number(request.headers.get("content-length") || 0) > limit) throw new HttpError(413, "Request too large.");
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > limit) { await reader.cancel(); throw new HttpError(413, "Request too large."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  if (!origin || origin !== new URL(allowed).origin) throw new HttpError(403, "Request origin not allowed.");
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  // Do not log credentials, checkout sessions, customer details or upstream request headers.
  console.error("Payment request failed", error instanceof Error ? error.name : "UnknownError");
  return json({ error: "Payment service is temporarily unavailable. Please try again." }, 503);
}
