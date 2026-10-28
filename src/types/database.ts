import type { WeddingData } from "./wedding";

export type WeddingRow = {
  id: string;
  user_id: string;
  slug: string;
  template_id: string;
  plan_tier: "basic" | "premium";
  is_paid: boolean;
  published_by_admin?: boolean;
  views_count?: number;
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
  cf_payment_id: string | null;
  cf_environment: "SANDBOX" | "PRODUCTION";
  checkout_request: Record<string, unknown> | null;
  last_checked_at: string;
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

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  created_at: string;
};

export type TemplateDbRow = {
  id: string;
  name: string;
  description: string | null;
  category: "Traditional" | "Minimal" | "Modern" | "Floral" | "Luxury";
  price_inr: number;
  thumbnail_url: string;
  demo_slug: string | null;
  is_active: boolean;
  default_theme_config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type PageEventRow = {
  id: string;
  wedding_id: string;
  event_type: "page_view" | "map_click" | "calendar_click" | "rsvp_submit";
  device_type: "mobile" | "desktop" | null;
  referrer: string | null;
  created_at: string;
};

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      weddings: Table<
        WeddingRow,
        Pick<WeddingRow, "slug" | "wedding_data"> &
          Partial<Omit<WeddingRow, "slug" | "wedding_data">>,
        Partial<WeddingRow>
      >;
      payments: Table<
        PaymentRow,
        Pick<PaymentRow, "wedding_id" | "user_id" | "cf_order_id" | "amount"> &
          Partial<Omit<PaymentRow, "wedding_id" | "user_id" | "cf_order_id" | "amount">>,
        Partial<PaymentRow>
      >;
      rsvps: Table<
        RsvpRow,
        Pick<RsvpRow, "wedding_id" | "guest_name"> &
          Partial<Omit<RsvpRow, "wedding_id" | "guest_name">>,
        Partial<RsvpRow>
      >;
      profiles: Table<
        ProfileRow,
        Pick<ProfileRow, "id" | "email"> & Partial<Omit<ProfileRow, "id" | "email">>,
        Partial<ProfileRow>
      >;
      templates: Table<
        TemplateDbRow,
        Pick<TemplateDbRow, "id" | "name" | "category" | "thumbnail_url"> &
          Partial<Omit<TemplateDbRow, "id" | "name" | "category" | "thumbnail_url">>,
        Partial<TemplateDbRow>
      >;
      page_events: Table<
        PageEventRow,
        Pick<PageEventRow, "wedding_id" | "event_type"> &
          Partial<Omit<PageEventRow, "wedding_id" | "event_type">>,
        Partial<PageEventRow>
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      reserve_checkout: {
        Args: {
          p_wedding_id: string;
          p_user_id: string;
          p_amount: number;
          p_environment: string;
          p_customer: Record<string, string>;
          p_app_url: string;
        };
        Returns: PaymentRow[];
      };
      confirm_cashfree_payment: {
        Args: {
          p_order_id: string;
          p_payment_id: string;
          p_order_amount: number;
          p_payment_amount: number;
          p_currency: string;
          p_environment: string;
        };
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

/** Only these fields may be supplied by an authenticated invitation owner. */
export type WeddingDraftInsert = Pick<WeddingRow, "slug" | "wedding_data"> &
  Partial<Pick<WeddingRow, "template_id">>;
export type WeddingDraftUpdate = Partial<Pick<WeddingRow, "slug" | "template_id" | "wedding_data">>;
