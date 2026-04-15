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
      skipVerification = false
    } = body

    // Validate required fields
    if (!businessId || !date || !slotTime || !clientName || !clientPhone) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // If staff is creating the booking, verify auth
    if (skipVerification) {
      const session = await getSession()
      if (!session || session.accountHolder.business_id !== businessId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
    }

    // Get or create client
    let clientResult = await sql`
      SELECT id FROM clients WHERE phone = ${clientPhone} AND business_id = ${businessId}
    `

    let clientId: string
    if (clientResult.length === 0) {
      const newClient = await sql`
        INSERT INTO clients (business_id, phone, name, email)
        VALUES (${businessId}, ${clientPhone}, ${clientName}, ${clientEmail})
        RETURNING id
      `
      clientId = newClient[0].id
    } else {
      clientId = clientResult[0].id
      // Update client info if needed
      await sql`
        UPDATE clients 
        SET name = ${clientName}, email = COALESCE(${clientEmail}, email)
        WHERE id = ${clientId}
      `
    }

    // Get slot duration from availability
    const availability = await sql`
      SELECT slot_duration_minutes FROM availability 
      WHERE business_id = ${businessId} 
      LIMIT 1
    `
    const slotDuration = availability[0]?.slot_duration_minutes || 30

    // Calculate end time
    const [hours, minutes] = slotTime.split(':').map(Number)
    const endDate = new Date(2000, 0, 1, hours, minutes + slotDuration)
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`

    // Check if slot is available
    const existingBooking = await sql`
      SELECT id FROM bookings 
      WHERE business_id = ${businessId}
        AND date = ${date}
        AND start_time = ${slotTime}
        AND status IN ('confirmed', 'pending')
    `

    if (existingBooking.length > 0) {
      return NextResponse.json(
        { error: 'Este horario ya esta ocupado' },
        { status: 400 }
      )
    }

    // Create the booking
    const booking = await sql`
      INSERT INTO bookings (
        business_id, client_id, date, start_time, end_time, 
        status, notes, created_by
      )
      VALUES (
        ${businessId}, ${clientId}, ${date}, ${slotTime}, ${endTime},
        ${skipVerification ? 'confirmed' : 'pending'}, ${notes}, ${createdBy || null}
      )
      RETURNING *
    `

    // Get business name for SMS
    const business = await getBusinessById(businessId)
    const businessName = business?.name || 'Nuestro negocio'

    // Format date for SMS
    const formattedDate = new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })

    // Send SMS notification
    if (skipVerification) {
      // Staff created the booking - notify client
      await sendStaffCreatedBookingNotification(
        clientPhone,
        businessName,
        formattedDate,
        slotTime,
        booking[0].id
      )
    } else {
      // Client created - send confirmation
      await sendBookingConfirmation(
        clientPhone,
        businessName,
        formattedDate,
        slotTime,
        booking[0].id
      )
    }

    return NextResponse.json({ booking: booking[0] })
  } catch (error) {
    console.error('[Bookings] Create error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
