import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getBusinessById } from '@/lib/auth'
import { sendCancellationNotification } from '@/lib/sms'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Telefono requerido' },
        { status: 400 }
      )
    }

    // Get the booking and verify it belongs to this phone
    const booking = await sql`
      SELECT b.*, c.phone as client_phone
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      WHERE b.id = ${id}
    `

    if (booking.length === 0) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      )
    }

    // Normalize phones for comparison
    const normalizePhone = (p: string) => {
      let normalized = p.replace(/\s+/g, '').replace(/-/g, '')
      if (!normalized.startsWith('+')) {
        if (normalized.startsWith('34')) {
          normalized = '+' + normalized
        } else {
          normalized = '+34' + normalized
        }
      }
      return normalized
    }

    if (normalizePhone(booking[0].client_phone) !== normalizePhone(phone)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Check if booking can be cancelled
    if (!['confirmed', 'pending'].includes(booking[0].status)) {
      return NextResponse.json(
        { error: 'Esta reserva no puede ser cancelada' },
        { status: 400 }
      )
    }

    // Cancel the booking
    await sql`
      UPDATE bookings SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${id}
    `

    // Send cancellation notification
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Cancel Booking] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
