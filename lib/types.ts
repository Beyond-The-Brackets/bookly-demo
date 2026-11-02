export type BookingStatus = "confirmed" | "cancelled" | "completed";

export interface Profile {
  id: string;
  slug: string;
  display_name: string;
  profession: string | null;
  bio: string | null;
  timezone: string;
  currency: string;
  is_admin: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  profile_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  active: boolean;
  created_at: string;
}

export interface Availability {
  id: string;
  profile_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

export interface Client {
  id: string;
  profile_id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  profile_id: string;
  service_id: string;
  client_id: string;
  starts_at: string;
  ends_at: string;
  status: BookingStatus;
  price_paid_cents: number;
  cancellation_fee_cents: number | null;
  cancelled_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface BookingWithRelations
  extends Pick<
    Booking,
    "id" | "starts_at" | "ends_at" | "status" | "price_paid_cents" | "notes"
  > {
  service: Pick<Service, "name" | "duration_minutes"> | null;
  client: Pick<Client, "name" | "email" | "phone"> | null;
}

export interface DiscountCode {
  id: string;
  code: string;
  percent_off: number;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface BusyInterval {
  starts_at: string;
  ends_at: string;
}

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
