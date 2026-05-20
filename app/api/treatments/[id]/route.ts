import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'

async function getTreatmentAndVerifyAccess(id: string, session: Awaited<ReturnType<typeof getSession>>) {
  if (!session) return null

  const result = await sql`
    SELECT * FROM treatments WHERE id = ${id}
  `
  if (result.length === 0) return null

  const treatment = result[0]
  const { id: accountHolderId, business_id: businessId, role } = session.accountHolder

  if (treatment.business_id !== businessId) return null
  if (role !== 'admin' && treatment.expert_id !== accountHolderId) return null

  return treatment
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const treatment = await getTreatmentAndVerifyAccess(id, session)
    if (!treatment) {
      return NextResponse.json({ error: 'Tratamiento no encontrado' }, { status: 404 })
    }

    const { name, duration_minutes, price, description, is_active, expert_id } = await request.json()

    // Only admin can reassign expert
    const targetExpertId = session.accountHolder.role === 'admin' && expert_id
      ? expert_id
      : treatment.expert_id

    const result = await sql`
      UPDATE treatments
      SET
        name = COALESCE(${name ?? null}, name),
        duration_minutes = COALESCE(${duration_minutes ?? null}, duration_minutes),
        price = ${price !== undefined ? price : treatment.price},
        description = ${description !== undefined ? description : treatment.description},
        is_active = COALESCE(${is_active !== undefined ? is_active : null}, is_active),
        expert_id = ${targetExpertId},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    const updated = await sql`
      SELECT t.*, ah.name as expert_name
      FROM treatments t
      JOIN account_holders ah ON t.expert_id = ah.id
      WHERE t.id = ${id}
    `

    return NextResponse.json({ treatment: updated[0] })
  } catch (error) {
    console.error('[Treatments] PATCH error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

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
    const treatment = await getTreatmentAndVerifyAccess(id, session)
    if (!treatment) {
      return NextResponse.json({ error: 'Tratamiento no encontrado' }, { status: 404 })
    }

    await sql`DELETE FROM treatments WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Treatments] DELETE error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
