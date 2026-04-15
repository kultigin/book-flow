import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.accountHolder.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { businessId, name, description, address, phone } = await request.json()

    // Verify user is admin of this business
    if (session.accountHolder.business_id !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await sql`
      UPDATE businesses 
      SET name = ${name}, description = ${description}, address = ${address}, phone = ${phone}
      WHERE id = ${businessId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Business] Update error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
