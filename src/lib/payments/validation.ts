import { z } from "zod";
import { weddingDataSchema } from "@/lib/validation/wedding";
import { getEventTimeRange } from "@/utils/calendar";

// One-time publication entitlement for any registered design. Never accept a browser price.
export const PUBLISH_AMOUNT_INR = 1499;
export const checkoutRequestSchema = z.object({
  weddingId: z.uuid(),
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().trim().regex(/^(?:\+91)?[6-9]\d{9}$/)
    .transform((value) => value.replace(/^\+91/, "")),
}).strict();

export const publishableWeddingSchema = weddingDataSchema.superRefine((data, ctx) => {
  const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });
  if (!data.couple.brideName.trim()) issue(["couple", "brideName"], "Enter the bride's name.");
  if (!data.couple.groomName.trim()) issue(["couple", "groomName"], "Enter the groom's name.");
  if (!data.couple.weddingDate) issue(["couple", "weddingDate"], "Choose the wedding date.");
  if (!data.events.length) issue(["events"], "Add at least one wedding event.");
  data.events.forEach((event, index) => {
    if (!event.eventName.trim()) issue(["events", index, "eventName"], "Name every event.");
    if (!getEventTimeRange(event)) issue(["events", index, "date"], "Give every event a valid date and start/end times.");
    if (!event.venueName.trim() || !event.venueAddress.trim()) issue(["events", index, "venueName"], "Enter each venue name and address.");
  });
});

export const successWebhookSchema = z.object({
  type: z.literal("PAYMENT_SUCCESS_WEBHOOK"),
  data: z.object({
    order: z.object({
      order_id: z.string().min(1).max(255),
      order_amount: z.number().positive(),
      order_currency: z.literal("INR"),
    }),
    payment: z.object({
      cf_payment_id: z.union([z.string().regex(/^\d+$/), z.number().int().positive().max(Number.MAX_SAFE_INTEGER)]).transform(String),
      payment_status: z.literal("SUCCESS"),
      payment_amount: z.number().positive(),
      payment_currency: z.literal("INR"),
    }),
  }),
});

export function toPaise(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.00001) {
    throw new Error("Invalid payment amount");
  }
  return Math.round(amount * 100);
}
