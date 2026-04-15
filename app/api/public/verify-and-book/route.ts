import { NextRequest, NextResponse } from 'next/server'
import { getBusinessById } from '@/lib/auth'
import { sql } from '@/lib/db'
import { verifyCode, sendBookingConfirmation } from '@/lib/sms'

export async function POST(request: NextRequest) {
  try {
    const {
      businessId,
      date,
      slotTime,
      clientName,
      clientPhone,
      clientEmail,
      notes,
      verificationCode
    } = await request.json()

    // Validate required fields
    if (!businessId || !date || !slotTime || !clientName || !clientPhone || !verificationCode) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Verify the code
    const isValidCode = await verifyCode(clientPhone, verificationCode)
    if (!isValidCode) {
      return NextResponse.json(
        { error: 'Codigo invalido o expirado' },
        { status: 400 }
      )
    }

    // Get or create client
    let clientResult = await sql`
      SELECT id FROM clients WHERE phone = ${clientPhone} AND business_id = ${businessId}
    `

    let clientId: string
    if (clientResult.length === 0) {
      const newClient = await sql`
        INSERT INTO clients (business_id, phone, name, email, is_verified)
        VALUES (${businessId}, ${clientPhone}, ${clientName}, ${clientEmail}, true)
        RETURNING id
      `
      clientId = newClient[0].id
    } else {
      clientId = clientResult[0].id
      await sql`
        UPDATE clients 
        SET name = ${clientName}, email = COALESCE(${clientEmail}, email), is_verified = true
        WHERE id = ${clientId}
      `
    }

    // Get slot duration
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

    // Check if slot is still available
    const existingBooking = await sql`
      SELECT id FROM bookings 
      WHERE business_id = ${businessId}
        AND date = ${date}
        AND start_time = ${slotTime}
        AND status IN ('confirmed', 'pending')
    `

    if (existingBooking.length > 0) {
      return NextResponse.json(
        { error: 'Este horario ya no esta disponible' },
        { status: 400 }
      )
    }

    // Create the booking (confirmed since phone is verified)
    const booking = await sql`
      INSERT INTO bookings (
        business_id, client_id, date, start_time, end_time, 
        status, notes
      )
      VALUES (
        ${businessId}, ${clientId}, ${date}, ${slotTime}, ${endTime},
        'confirmed', ${notes}
      )
      RETURNING *
    `

    // Get business name and send confirmation
    const business = await getBusinessById(businessId)
    const formattedDate = new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    })

    await sendBookingConfirmation(
      clientPhone,
      business?.name || 'Nuestro negocio',
      formattedDate,
      slotTime,
      booking[0].id
    )

    return NextResponse.json({ booking: booking[0] })
  } catch (error) {
    console.error('[Verify and Book] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
