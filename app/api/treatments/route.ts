import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'

const WITH_SCHEDULES = (where: string) => `
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
  WHERE ${where}
  GROUP BY t.id, ah.name
`

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id: accountHolderId, business_id: businessId, role } = session.accountHolder

    const treatments = role === 'admin'
      ? await sql`
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
          WHERE t.business_id = ${businessId}
          GROUP BY t.id, ah.name
          ORDER BY ah.name, t.name
        `
      : await sql`
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
          WHERE t.business_id = ${businessId} AND t.expert_id = ${accountHolderId}
          GROUP BY t.id, ah.name
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
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { id: accountHolderId, business_id: businessId, role } = session.accountHolder
    const { name, duration_minutes, price, description, expert_id, is_group, max_capacity, schedules } = await request.json()

    const targetExpertId = role === 'admin' ? expert_id : accountHolderId
    if (!targetExpertId) return NextResponse.json({ error: 'Experto requerido' }, { status: 400 })

    const expert = await sql`SELECT id FROM account_holders WHERE id = ${targetExpertId} AND business_id = ${businessId}`
    if (expert.length === 0) return NextResponse.json({ error: 'Experto no encontrado' }, { status: 404 })

    const result = await sql`
      INSERT INTO treatments (business_id, expert_id, name, duration_minutes, price, description, is_group, max_capacity)
      VALUES (
        ${businessId}, ${targetExpertId}, ${name}, ${duration_minutes},
        ${price ?? null}, ${description ?? null},
        ${is_group ?? false}, ${is_group ? (max_capacity ?? null) : null}
      )
      RETURNING *
    `
    const treatmentId = result[0].id

    if (is_group && Array.isArray(schedules) && schedules.length > 0) {
      for (const s of schedules) {
        await sql`
          INSERT INTO treatment_schedules (treatment_id, day_of_week, start_time)
          VALUES (${treatmentId}, ${s.day_of_week}, ${s.start_time})
        `
      }
    }

    const treatment = await sql`
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
      WHERE t.id = ${treatmentId}
      GROUP BY t.id, ah.name
    `

    return NextResponse.json({ treatment: treatment[0] })
  } catch (error) {
    console.error('[Treatments] POST error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
