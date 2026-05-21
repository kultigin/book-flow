import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

function upcomingDates(dayOfWeek: number, startTime: string, days = 28): string[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [h, m] = startTime.split(':').map(Number)
  const result: string[] = []

  for (let i = 0; i <= days; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    if (d.getDay() !== dayOfWeek) continue
    if (i === 0) {
      const now = new Date()
      if (now.getHours() * 60 + now.getMinutes() >= h * 60 + m) continue
    }
    result.push(d.toISOString().split('T')[0])
  }
  return result
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const expertId = searchParams.get('expertId')
    if (!expertId) return NextResponse.json({ error: 'expertId requerido' }, { status: 400 })

    const groupTreatments = await sql`
      SELECT
        t.id, t.name, t.duration_minutes, t.price, t.max_capacity,
        COALESCE(
          json_agg(
            json_build_object('day_of_week', ts.day_of_week, 'start_time', ts.start_time::text)
            ORDER BY ts.day_of_week, ts.start_time
          ) FILTER (WHERE ts.id IS NOT NULL),
          '[]'::json
        ) as schedules
      FROM treatments t
      LEFT JOIN treatment_schedules ts ON ts.treatment_id = t.id
      WHERE t.expert_id = ${expertId} AND t.is_group = true AND t.is_active = true
      GROUP BY t.id, t.name, t.duration_minutes, t.price, t.max_capacity
      ORDER BY t.name
    `

    if (groupTreatments.length === 0) return NextResponse.json({ occurrences: [] })

    type OccMeta = {
      treatmentId: string; name: string; duration: number
      price: number | null; maxCapacity: number; date: string; startTime: string
    }
    const metaMap: Record<string, OccMeta> = {}
    const treatmentIds: string[] = []

    for (const t of groupTreatments) {
      if (!treatmentIds.includes(t.id)) treatmentIds.push(t.id)
      for (const s of (t.schedules as { day_of_week: number; start_time: string }[])) {
        const time = s.start_time.slice(0, 5)
        for (const date of upcomingDates(s.day_of_week, time)) {
          const key = `${t.id}:${date}:${time}`
          metaMap[key] = { treatmentId: t.id, name: t.name, duration: t.duration_minutes, price: t.price, maxCapacity: t.max_capacity, date, startTime: time }
        }
      }
    }

    if (Object.keys(metaMap).length === 0) return NextResponse.json({ occurrences: [] })

    const bookingCounts = await sql`
      SELECT treatment_id, date::text, start_time::text, COUNT(*) as count
      FROM bookings
      WHERE treatment_id = ANY(${treatmentIds}::uuid[])
        AND date >= CURRENT_DATE
        AND date <= CURRENT_DATE + INTERVAL '28 days'
        AND status IN ('confirmed', 'pending_verification')
      GROUP BY treatment_id, date, start_time
    `

    const countMap: Record<string, number> = {}
    for (const row of bookingCounts) {
      const k = `${row.treatment_id}:${row.date}:${row.start_time.slice(0, 5)}`
      countMap[k] = parseInt(row.count)
    }

    const occurrences = Object.entries(metaMap)
      .map(([key, meta]) => {
        const spotsTaken = countMap[key] ?? 0
        return {
          treatment_id: meta.treatmentId,
          treatment_name: meta.name,
          duration_minutes: meta.duration,
          price: meta.price,
          date: meta.date,
          start_time: meta.startTime,
          spots_taken: spotsTaken,
          max_capacity: meta.maxCapacity,
          spots_remaining: Math.max(0, meta.maxCapacity - spotsTaken),
          is_full: spotsTaken >= meta.maxCapacity,
        }
      })
      .sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.start_time.localeCompare(b.start_time))

    return NextResponse.json({ occurrences })
  } catch (error) {
    console.error('[GroupSchedules] GET error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
