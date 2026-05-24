import { NextRequest, NextResponse } from 'next/server'
import { getBusinessById } from '@/lib/auth'
import { sql } from '@/lib/db'
import { verifyCode, sendBookingConfirmation } from '@/lib/sms'

export async function POST(request: NextRequest) {
  try {
    const {
      businessId,
      expertId,
      treatmentId,
      date,
      slotTime,
      clientName,
      clientPhone,
      clientEmail,
      reminderMinutes = 180,
      verificationCode,
    } = await request.json()

    if (!businessId || !date || !slotTime || !clientName || !clientPhone || !verificationCode) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const isValid = await verifyCode(clientPhone, verificationCode)
    if (!isValid) {
      return NextResponse.json({ error: 'Codigo invalido o expirado' }, { status: 400 })
    }

    // Get treatment details (duration, is_group, max_capacity)
    let slotDuration = 30
    let isGroupSession = false
    let maxCapacity = 0
    let treatmentName: string | null = null
    let expertName: string | null = null

    if (treatmentId) {
      const treatment = await sql`
        SELECT t.duration_minutes, t.is_group, t.max_capacity, t.name as treatment_name,
               ah.name as expert_name
        FROM treatments t
        LEFT JOIN account_holders ah ON ah.id = ${expertId || null}::uuid
        WHERE t.id = ${treatmentId}
      `
      if (treatment.length > 0) {
        slotDuration = treatment[0].duration_minutes
        isGroupSession = treatment[0].is_group ?? false
        maxCapacity = treatment[0].max_capacity ?? 0
        treatmentName = treatment[0].treatment_name
        expertName = treatment[0].expert_name
      }
    }

    const [h, m] = slotTime.split(':').map(Number)
    const endMinutes = h * 60 + m + slotDuration
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`

    if (isGroupSession) {
      // Group: check capacity instead of overlap
      const countResult = await sql`
        SELECT COUNT(*) as count FROM bookings
        WHERE treatment_id = ${treatmentId}
          AND date = ${date}
          AND start_time = ${slotTime}
          AND status IN ('confirmed', 'pending_verification')
      `
      if (parseInt(countResult[0].count) >= maxCapacity) {
        return NextResponse.json({ error: 'La sesion esta completa' }, { status: 400 })
      }
    } else {
      // Individual: check for time overlap
      const conflict = expertId
        ? await sql`
            SELECT id FROM bookings
            WHERE expert_id = ${expertId}
              AND date = ${date}
              AND status IN ('confirmed', 'pending_verification')
              AND start_time < ${endTime}
              AND end_time > ${slotTime}
          `
        : await sql`
            SELECT id FROM bookings
            WHERE business_id = ${businessId}
              AND date = ${date}
              AND status IN ('confirmed', 'pending_verification')
              AND start_time < ${endTime}
              AND end_time > ${slotTime}
          `
      if (conflict.length > 0) {
        return NextResponse.json({ error: 'Este horario ya no esta disponible' }, { status: 400 })
      }
    }

    let clientResult = await sql`SELECT id FROM clients WHERE phone = ${clientPhone}`
    let clientId: string

    if (clientResult.length === 0) {
      const newClient = await sql`
        INSERT INTO clients (phone, name, email, is_verified)
        VALUES (${clientPhone}, ${clientName}, ${clientEmail || null}, true)
        RETURNING id
      `
      clientId = newClient[0].id
    } else {
      clientId = clientResult[0].id
      await sql`
        UPDATE clients
        SET name = ${clientName}, email = COALESCE(${clientEmail || null}, email), is_verified = true
        WHERE id = ${clientId}
      `
    }

    const booking = await sql`
      INSERT INTO bookings (
        business_id, client_id, treatment_id, expert_id,
        date, start_time, end_time,
        status, reminder_minutes
      )
      VALUES (
        ${businessId}, ${clientId}, ${treatmentId || null}, ${expertId || null},
        ${date}, ${slotTime}, ${endTime},
        'confirmed', ${reminderMinutes}
      )
      RETURNING *
    `

    const business = await getBusinessById(businessId)
    const formattedDate = new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long',
    })

    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const cancelUrl = `${protocol}://${host}/cancel/${booking[0].id}`

    await sendBookingConfirmation(
      clientPhone,
      business?.name || 'Nuestro negocio',
      formattedDate,
      slotTime,
      booking[0].id,
      treatmentName,
      expertName,
      cancelUrl
    )

    return NextResponse.json({ booking: booking[0] })
  } catch (error) {
    console.error('[VerifyAndBook] Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
