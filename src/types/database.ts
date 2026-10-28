import type { WeddingData } from "./wedding";

export type WeddingRow = {
  id: string;
  user_id: string;
  slug: string;
  template_id: "royal-rajwada" | "minimal-sage" | "boho-floral" | "nikah-emerald";
  plan_tier: "basic" | "premium";
  is_paid: boolean;
  wedding_data: WeddingData;
  created_at: string;
  updated_at: string;
};
export type PaymentRow = {
  id: string;
  wedding_id: string;
  user_id: string;
  cf_order_id: string;
  cf_payment_session_id: string | null;
  amount: number;
  currency: "INR";
  status: "PENDING" | "SUCCESS" | "FAILED";
  created_at: string;
};
export type RsvpRow = {
  id: string;
  wedding_id: string;
  guest_name: string;
  phone_number: string | null;
  attending: boolean;
  guests_count: number;
  events_attending: string[] | null;
  dietary_notes: string | null;
  message_for_couple: string | null;
  created_at: string;
};

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

/** Matches migration 202610270001; regenerate from Supabase before adding schema changes. */
export type Database = {
  public: {
    Tables: {
      weddings: Table<WeddingRow,
        Pick<WeddingRow, "slug" | "wedding_data"> & Partial<Omit<WeddingRow, "slug" | "wedding_data">>,
        Partial<WeddingRow>>;
      payments: Table<PaymentRow,
        Pick<PaymentRow, "wedding_id" | "user_id" | "cf_order_id" | "amount"> & Partial<Omit<PaymentRow, "wedding_id" | "user_id" | "cf_order_id" | "amount">>,
        Partial<PaymentRow>>;
      rsvps: Table<RsvpRow,
        Pick<RsvpRow, "wedding_id" | "guest_name"> & Partial<Omit<RsvpRow, "wedding_id" | "guest_name">>,
        Partial<RsvpRow>>;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

/** Only these fields may be supplied by an authenticated invitation owner. */
export type WeddingDraftInsert = Pick<WeddingRow, "slug" | "wedding_data"> &
  Partial<Pick<WeddingRow, "template_id">>;
export type WeddingDraftUpdate = Partial<Pick<WeddingRow, "slug" | "template_id" | "wedding_data">>;
