import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const expertId = session.accountHolder.id

    const availability = await sql`
      SELECT * FROM expert_availability
      WHERE expert_id = ${expertId}
      ORDER BY day_of_week
    `

    return NextResponse.json({ availability })
  } catch (error) {
    console.error('[ExpertAvailability] GET error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const expertId = session.accountHolder.id
    const { availability } = await request.json()

    await sql`DELETE FROM expert_availability WHERE expert_id = ${expertId}`

    for (const day of availability) {
      await sql`
        INSERT INTO expert_availability (expert_id, day_of_week, start_time, end_time, is_active)
        VALUES (
          ${expertId},
          ${day.day_of_week},
          ${day.start_time},
          ${day.end_time},
          ${day.is_active ?? true}
        )
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ExpertAvailability] POST error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
