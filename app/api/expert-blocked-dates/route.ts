import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const expertId = session.accountHolder.id
    const { date, reason } = await request.json()

    if (!date) {
      return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })
    }

    const existing = await sql`
      SELECT id FROM expert_blocked_dates WHERE expert_id = ${expertId} AND date = ${date}
    `
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Esta fecha ya esta bloqueada' }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO expert_blocked_dates (expert_id, date, reason)
      VALUES (${expertId}, ${date}, ${reason ?? null})
      RETURNING *
    `

    return NextResponse.json({ blockedDate: result[0] })
  } catch (error) {
    console.error('[ExpertBlockedDates] POST error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
