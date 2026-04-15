import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { businessId, date, reason } = await request.json()

    // Verify user belongs to this business
    if (session.accountHolder.business_id !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const result = await sql`
      INSERT INTO blocked_dates (business_id, date, reason)
      VALUES (${businessId}, ${date}, ${reason})
      ON CONFLICT (business_id, date) DO UPDATE SET reason = ${reason}
      RETURNING *
    `

    return NextResponse.json({ blockedDate: result[0] })
  } catch (error) {
    console.error('[BlockedDates] Add error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
