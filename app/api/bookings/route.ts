import { NextRequest, NextResponse } from 'next/server'
import { getSession, getBusinessById } from '@/lib/auth'
import { sql } from '@/lib/db'
import { sendBookingConfirmation, sendStaffCreatedBookingNotification } from '@/lib/sms'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      businessId,
      createdBy,
      date,
      slotTime,
      clientName,
      clientPhone,
      clientEmail,
      notes,
      treatmentId,
      expertId,
      reminderMinutes = 180,
      skipVerification = false,
    } = body

    if (!businessId || !date || !slotTime || !clientName || !clientPhone) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    if (skipVerification) {
      const session = await getSession()
      if (!session || session.accountHolder.business_id !== businessId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
    }

    // Get treatment duration, name and expert name
    let slotDuration = 30
    let treatmentName: string | null = null
    let expertName: string | null = null
    if (treatmentId) {
      const treatment = await sql`
        SELECT t.duration_minutes, t.name as treatment_name, ah.name as expert_name
        FROM treatments t
        LEFT JOIN account_holders ah ON ah.id = ${expertId || null}::uuid
        WHERE t.id = ${treatmentId} AND t.business_id = ${businessId}
      `
      if (treatment.length > 0) {
        slotDuration = treatment[0].duration_minutes
        treatmentName = treatment[0].treatment_name
        expertName = treatment[0].expert_name
      }
    }

    // Calculate end time
    const [hours, minutes] = slotTime.split(':').map(Number)
    const endMinutes = hours * 60 + minutes + slotDuration
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`

    // Check slot conflict for this expert (or business-wide if no expert)
    const conflictCheck = expertId
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

    if (conflictCheck.length > 0) {
      return NextResponse.json({ error: 'Este horario ya esta ocupado' }, { status: 400 })
    }

    // Get or create client (clients are global, identified by phone)
    let clientResult = await sql`
      SELECT id FROM clients WHERE phone = ${clientPhone}
    `

    let clientId: string
    if (clientResult.length === 0) {
      const newClient = await sql`
        INSERT INTO clients (phone, name, email)
        VALUES (${clientPhone}, ${clientName}, ${clientEmail || null})
        RETURNING id
      `
      clientId = newClient[0].id
    } else {
      clientId = clientResult[0].id
      await sql`
        UPDATE clients
        SET name = ${clientName}, email = COALESCE(${clientEmail || null}, email)
        WHERE id = ${clientId}
      `
    }

    const booking = await sql`
      INSERT INTO bookings (
        business_id, client_id, treatment_id, expert_id,
        date, start_time, end_time,
        status, notes, created_by_account_holder_id, reminder_minutes
      )
      VALUES (
        ${businessId}, ${clientId}, ${treatmentId || null}, ${expertId || null},
        ${date}, ${slotTime}, ${endTime},
        ${skipVerification ? 'confirmed' : 'pending_verification'},
        ${notes || null}, ${createdBy || null}, ${reminderMinutes}
      )
      RETURNING *
    `

    const business = await getBusinessById(businessId)
    const businessName = business?.name || 'Nuestro negocio'
    const formattedDate = new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })

    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
    const cancelUrl = `${protocol}://${host}/cancel/${booking[0].id}`

    if (skipVerification) {
      await sendStaffCreatedBookingNotification(
        clientPhone, businessName, formattedDate, slotTime, booking[0].id,
        treatmentName, expertName, cancelUrl
      )
    } else {
      await sendBookingConfirmation(
        clientPhone, businessName, formattedDate, slotTime, booking[0].id,
        treatmentName, expertName, cancelUrl
      )
    }

    return NextResponse.json({ booking: booking[0] })
  } catch (error) {
    console.error('[Bookings] Create error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
