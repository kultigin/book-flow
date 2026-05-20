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
    const expertId = session.accountHolder.id

    const existing = await sql`
      SELECT expert_id FROM expert_blocked_dates WHERE id = ${id}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Fecha no encontrada' }, { status: 404 })
    }

    if (existing[0].expert_id !== expertId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await sql`DELETE FROM expert_blocked_dates WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ExpertBlockedDates] DELETE error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
