import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verify the blocked date belongs to user's business
    const existing = await sql`
      SELECT * FROM blocked_dates WHERE id = ${id}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    if (existing[0].business_id !== session.accountHolder.business_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await sql`DELETE FROM blocked_dates WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[BlockedDates] Delete error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
