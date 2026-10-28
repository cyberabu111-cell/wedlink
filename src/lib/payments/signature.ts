import { createHmac, timingSafeEqual } from "node:crypto";

/** Cashfree signs timestamp + exact raw bytes. Idempotent persistence handles legitimate retries/replays. */
export function verifyCashfreeSignature(raw: Buffer, signature: string, timestamp: string, secret: string): boolean {
  if (!secret || !/^\d{10,16}$/.test(timestamp) || !/^[A-Za-z0-9+/]{43}=$/.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(timestamp).update(raw).digest();
  const received = Buffer.from(signature, "base64");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
