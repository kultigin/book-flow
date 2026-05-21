import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'

async function getTreatmentAndVerifyAccess(id: string, session: Awaited<ReturnType<typeof getSession>>) {
  if (!session) return null
  const result = await sql`SELECT * FROM treatments WHERE id = ${id}`
  if (result.length === 0) return null
  const treatment = result[0]
  const { id: accountHolderId, business_id: businessId, role } = session.accountHolder
  if (treatment.business_id !== businessId) return null
  if (role !== 'admin' && treatment.expert_id !== accountHolderId) return null
  return treatment
}

async function getTreatmentWithSchedules(id: string) {
  const result = await sql`
    SELECT t.*, ah.name as expert_name,
      COALESCE(
        json_agg(
          json_build_object('id', ts.id, 'day_of_week', ts.day_of_week, 'start_time', ts.start_time::text)
          ORDER BY ts.day_of_week, ts.start_time
        ) FILTER (WHERE ts.id IS NOT NULL),
        '[]'::json
      ) as schedules
    FROM treatments t
    JOIN account_holders ah ON t.expert_id = ah.id
    LEFT JOIN treatment_schedules ts ON ts.treatment_id = t.id
    WHERE t.id = ${id}
    GROUP BY t.id, ah.name
  `
  return result[0] ?? null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const treatment = await getTreatmentAndVerifyAccess(id, session)
    if (!treatment) return NextResponse.json({ error: 'Tratamiento no encontrado' }, { status: 404 })

    const { name, duration_minutes, price, description, is_active, expert_id, is_group, max_capacity, schedules } = await request.json()

    const targetExpertId = session.accountHolder.role === 'admin' && expert_id ? expert_id : treatment.expert_id

    const newIsGroup = is_group !== undefined ? is_group : treatment.is_group
    const newMaxCapacity = newIsGroup
      ? (max_capacity !== undefined ? max_capacity : treatment.max_capacity)
      : null

    await sql`
      UPDATE treatments
      SET
        name = COALESCE(${name ?? null}, name),
        duration_minutes = COALESCE(${duration_minutes ?? null}, duration_minutes),
        price = ${price !== undefined ? price : treatment.price},
        description = ${description !== undefined ? description : treatment.description},
        is_active = COALESCE(${is_active !== undefined ? is_active : null}, is_active),
        expert_id = ${targetExpertId},
        is_group = ${newIsGroup},
        max_capacity = ${newMaxCapacity},
        updated_at = NOW()
      WHERE id = ${id}
    `

    if (is_group !== undefined || schedules !== undefined) {
      await sql`DELETE FROM treatment_schedules WHERE treatment_id = ${id}`
      if (newIsGroup && Array.isArray(schedules) && schedules.length > 0) {
        for (const s of schedules) {
          await sql`
            INSERT INTO treatment_schedules (treatment_id, day_of_week, start_time)
            VALUES (${id}, ${s.day_of_week}, ${s.start_time})
          `
        }
      }
    }

    const updated = await getTreatmentWithSchedules(id)
    return NextResponse.json({ treatment: updated })
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
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id } = await params
    const treatment = await getTreatmentAndVerifyAccess(id, session)
    if (!treatment) return NextResponse.json({ error: 'Tratamiento no encontrado' }, { status: 404 })

    await sql`DELETE FROM treatments WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Treatments] DELETE error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
