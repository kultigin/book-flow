import { NextRequest, NextResponse } from 'next/server'
import { getSession, getBusinessById } from '@/lib/auth'
import { sql } from '@/lib/db'
import { sendCancellationNotification } from '@/lib/sms'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const { status } = await request.json()

    // Validate status
    const validStatuses = ['confirmed', 'pending', 'cancelled', 'completed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado invalido' }, { status: 400 })
    }

    // Get the booking and verify it belongs to user's business
    const booking = await sql`
      SELECT b.*, c.phone as client_phone, c.name as client_name
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      WHERE b.id = ${id}
    `

    if (booking.length === 0) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
    }

    if (booking[0].business_id !== session.accountHolder.business_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Update the booking status
    await sql`
      UPDATE bookings SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
    `

    // If cancelling, send notification to client
    if (status === 'cancelled') {
      const business = await getBusinessById(booking[0].business_id)
      const formattedDate = new Date(booking[0].date).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
      
      await sendCancellationNotification(
        booking[0].client_phone,
        business?.name || 'Nuestro negocio',
        formattedDate,
        booking[0].start_time.slice(0, 5),
        id
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Bookings] Status update error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
