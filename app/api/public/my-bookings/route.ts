import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { error: 'Telefono requerido' },
        { status: 400 }
      )
    }

    // Normalize phone
    let normalizedPhone = phone.replace(/\s+/g, '').replace(/-/g, '')
    if (!normalizedPhone.startsWith('+')) {
      if (normalizedPhone.startsWith('34')) {
        normalizedPhone = '+' + normalizedPhone
      } else {
        normalizedPhone = '+34' + normalizedPhone
      }
    }

    // Get all clients with this phone number
    const clients = await sql`
      SELECT id, business_id FROM clients 
      WHERE phone = ${normalizedPhone} OR phone = ${phone}
    `

    if (clients.length === 0) {
      return NextResponse.json({ bookings: [] })
    }

    const clientIds = clients.map(c => c.id)

    // Get all bookings for these clients
    const bookings = await sql`
      SELECT 
        b.id, b.date, b.start_time, b.end_time, b.status, b.notes,
        bus.name as business_name, bus.slug as business_slug
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      JOIN businesses bus ON b.business_id = bus.id
      WHERE c.id = ANY(${clientIds})
        AND b.date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY b.date DESC, b.start_time DESC
    `

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('[MyBookings] Get error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
