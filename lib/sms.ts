import twilio from 'twilio'
import { sql } from './db'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER

function getClient() {
  if (!accountSid || !authToken) {
    console.warn('[SMS] Twilio credentials not configured - SMS will be logged only')
    return null
  }
  return twilio(accountSid, authToken)
}

export type SmsType = 
  | 'verification' 
  | 'booking_confirmation' 
  | 'booking_created_by_staff'
  | 'reminder_24h' 
  | 'reminder_2h' 
  | 'cancellation'

interface SendSmsParams {
  to: string
  message: string
  type: SmsType
  bookingId?: string
}

export async function sendSms({ to, message, type, bookingId }: SendSmsParams): Promise<boolean> {
  const client = getClient()
  
  // Normalize Spanish phone numbers
  let normalizedPhone = to.replace(/\s+/g, '').replace(/-/g, '')
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = normalizedPhone.substring(1)
  }
  if (!normalizedPhone.startsWith('+')) {
    if (normalizedPhone.startsWith('34')) {
      normalizedPhone = '+' + normalizedPhone
    } else {
      normalizedPhone = '+34' + normalizedPhone
    }
  }
  
  let status = 'pending'
  let errorMessage: string | null = null
  
  try {
    if (client && fromNumber) {
      const result = await client.messages.create({
        body: message,
        from: fromNumber,
        to: normalizedPhone
      })
      status = result.status
      console.log(`[SMS] Sent to ${normalizedPhone}: ${type}`)
    } else {
      // Mock mode - log the message
      console.log(`[SMS MOCK] To: ${normalizedPhone}, Type: ${type}, Message: ${message}`)
      status = 'mock_sent'
    }
  } catch (error) {
    status = 'failed'
    errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[SMS] Failed to send to ${normalizedPhone}:`, errorMessage)
  }
  
  // Log to database
  await sql`
    INSERT INTO sms_log (phone, message_type, status, booking_id, error_message)
    VALUES (${normalizedPhone}, ${type}, ${status}, ${bookingId || null}, ${errorMessage})
  `
  
  return status !== 'failed'
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendVerificationCode(phone: string, businessName: string): Promise<string> {
  const code = generateVerificationCode()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  
  // Delete any existing codes for this phone
  await sql`DELETE FROM verification_codes WHERE phone = ${phone}`
  
  // Store the new code
  await sql`
    INSERT INTO verification_codes (phone, code, expires_at)
    VALUES (${phone}, ${code}, ${expiresAt.toISOString()})
  `
  
  await sendSms({
    to: phone,
    message: `Tu codigo de verificacion para ${businessName} es: ${code}. Valido por 10 minutos.`,
    type: 'verification'
  })
  
  return code
}

export async function verifyCode(phone: string, code: string): Promise<boolean> {
  const result = await sql`
    SELECT id FROM verification_codes 
    WHERE phone = ${phone} 
      AND code = ${code} 
      AND expires_at > NOW()
      AND used_at IS NULL
  `
  
  if (result.length === 0) return false
  
  // Mark as used
  await sql`
    UPDATE verification_codes 
    SET used_at = NOW() 
    WHERE phone = ${phone} AND code = ${code}
  `
  
  return true
}

export async function sendBookingConfirmation(
  phone: string, 
  businessName: string, 
  date: string, 
  time: string,
  bookingId: string
): Promise<void> {
  await sendSms({
    to: phone,
    message: `Reserva confirmada en ${businessName} para el ${date} a las ${time}. Para cancelar, visita el enlace en tu confirmacion.`,
    type: 'booking_confirmation',
    bookingId
  })
}

export async function sendStaffCreatedBookingNotification(
  phone: string,
  businessName: string,
  date: string,
  time: string,
  bookingId: string
): Promise<void> {
  await sendSms({
    to: phone,
    message: `${businessName} ha creado una reserva para ti el ${date} a las ${time}. Te enviaremos un recordatorio.`,
    type: 'booking_created_by_staff',
    bookingId
  })
}

export async function sendReminder24h(
  phone: string,
  businessName: string,
  date: string,
  time: string,
  bookingId: string
): Promise<void> {
  await sendSms({
    to: phone,
    message: `Recordatorio: Tienes una cita manana en ${businessName} a las ${time}.`,
    type: 'reminder_24h',
    bookingId
  })
}

export async function sendReminder2h(
  phone: string,
  businessName: string,
  time: string,
  bookingId: string
): Promise<void> {
  await sendSms({
    to: phone,
    message: `Recordatorio: Tu cita en ${businessName} es en 2 horas (${time}).`,
    type: 'reminder_2h',
    bookingId
  })
}

export async function sendCancellationNotification(
  phone: string,
  businessName: string,
  date: string,
  time: string,
  bookingId: string
): Promise<void> {
  await sendSms({
    to: phone,
    message: `Tu reserva en ${businessName} para el ${date} a las ${time} ha sido cancelada.`,
    type: 'cancellation',
    bookingId
  })
}
