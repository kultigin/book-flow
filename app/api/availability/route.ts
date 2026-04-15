import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { businessId, availability } = await request.json()

    // Verify user belongs to this business
    if (session.accountHolder.business_id !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Delete existing availability
    await sql`DELETE FROM availability WHERE business_id = ${businessId}`

    // Insert new availability
    for (const day of availability) {
      await sql`
        INSERT INTO availability (business_id, day_of_week, start_time, end_time, is_available, slot_duration_minutes)
        VALUES (
          ${businessId},
          ${day.day_of_week},
          ${day.start_time},
          ${day.end_time},
          ${day.is_available},
          ${day.slot_duration_minutes}
        )
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Availability] Save error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ error: 'businessId requerido' }, { status: 400 })
    }

    const availability = await sql`
      SELECT * FROM availability WHERE business_id = ${businessId} ORDER BY day_of_week
    `

    return NextResponse.json({ availability })
  } catch (error) {
    console.error('[Availability] Get error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
