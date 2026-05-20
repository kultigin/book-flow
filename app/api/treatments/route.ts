import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: accountHolderId, business_id: businessId, role } = session.accountHolder

    const treatments = role === 'admin'
      ? await sql`
          SELECT t.*, ah.name as expert_name
          FROM treatments t
          JOIN account_holders ah ON t.expert_id = ah.id
          WHERE t.business_id = ${businessId}
          ORDER BY ah.name, t.name
        `
      : await sql`
          SELECT t.*, ah.name as expert_name
          FROM treatments t
          JOIN account_holders ah ON t.expert_id = ah.id
          WHERE t.business_id = ${businessId} AND t.expert_id = ${accountHolderId}
          ORDER BY t.name
        `

    return NextResponse.json({ treatments })
  } catch (error) {
    console.error('[Treatments] GET error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: accountHolderId, business_id: businessId, role } = session.accountHolder
    const { name, duration_minutes, price, description, expert_id } = await request.json()

    // Staff can only create treatments for themselves
    const targetExpertId = role === 'admin' ? expert_id : accountHolderId

    if (!targetExpertId) {
      return NextResponse.json({ error: 'Experto requerido' }, { status: 400 })
    }

    // Verify target expert belongs to this business
    const expert = await sql`
      SELECT id FROM account_holders WHERE id = ${targetExpertId} AND business_id = ${businessId}
    `
    if (expert.length === 0) {
      return NextResponse.json({ error: 'Experto no encontrado' }, { status: 404 })
    }

    const result = await sql`
      INSERT INTO treatments (business_id, expert_id, name, duration_minutes, price, description)
      VALUES (${businessId}, ${targetExpertId}, ${name}, ${duration_minutes}, ${price ?? null}, ${description ?? null})
      RETURNING *
    `

    const treatment = await sql`
      SELECT t.*, ah.name as expert_name
      FROM treatments t
      JOIN account_holders ah ON t.expert_id = ah.id
      WHERE t.id = ${result[0].id}
    `

    return NextResponse.json({ treatment: treatment[0] })
  } catch (error) {
    console.error('[Treatments] POST error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
