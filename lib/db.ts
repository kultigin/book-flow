import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const sql = neon(process.env.DATABASE_URL)

// Type definitions for database models
export interface Business {
  id: string
  name: string
  slug: string
  timezone: string
  default_slot_duration: number
  created_at: Date
  updated_at: Date
}

export interface AccountHolder {
  id: string
  business_id: string
  email: string
  password_hash: string | null
  name: string | null
  role: "admin" | "staff"
  magic_link_token: string | null
  magic_link_expires_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface Client {
  id: string
  phone: string
  name: string | null
  email: string | null
  created_at: Date
  updated_at: Date
}

export interface Availability {
  id: string
  business_id: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration: number
  is_active: boolean
  created_at: Date
}

export interface BlockedDate {
  id: string
  business_id: string
  date: Date
  reason: string | null
  created_at: Date
}

export interface Booking {
  id: string
  business_id: string
  client_id: string | null
  created_by_account_holder_id: string | null
  date: Date
  start_time: string
  end_time: string
  status: "pending_verification" | "confirmed" | "cancelled" | "completed" | "no_show"
  notes: string | null
  cancellation_token: string | null
  created_at: Date
  updated_at: Date
}

export interface VerificationCode {
  id: string
  phone: string
  code: string
  booking_id: string
  expires_at: Date
  used: boolean
  created_at: Date
}

export interface SmsLog {
  id: string
  booking_id: string
  phone: string
  message_type: "verification" | "confirmation" | "reminder_24h" | "reminder_2h" | "cancellation" | "staff_created"
  message_content: string | null
  sent_at: Date
  twilio_sid: string | null
}

export interface Session {
  id: string
  account_holder_id: string
  token: string
  expires_at: Date
  created_at: Date
}
