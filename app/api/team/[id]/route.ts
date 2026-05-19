import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.accountHolder.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verify the member belongs to same business
    const member = await sql`
      SELECT business_id FROM account_holders WHERE id = ${id}
    `

    if (member.length === 0) {
      return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })
    }

    if (member[0].business_id !== session.accountHolder.business_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Team] Update error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.accountHolder.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Cannot delete yourself
    if (id === session.accountHolder.id) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })
    }

    // Verify the member belongs to same business
    const member = await sql`
      SELECT business_id FROM account_holders WHERE id = ${id}
    `

    if (member.length === 0) {
      return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })
    }

    if (member[0].business_id !== session.accountHolder.business_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Delete member
    await sql`DELETE FROM account_holders WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Team] Delete error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
