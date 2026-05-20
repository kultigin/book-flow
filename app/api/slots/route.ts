import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const date = searchParams.get('date')
    const expertId = searchParams.get('expertId')
    const duration = parseInt(searchParams.get('duration') || '30')

    if (!businessId || !date) {
      return NextResponse.json({ error: 'businessId y date son requeridos' }, { status: 400 })
    }

    // Check room blocked date
    const roomBlocked = await sql`
      SELECT id FROM blocked_dates WHERE business_id = ${businessId} AND date = ${date}
    `
    if (roomBlocked.length > 0) {
      return NextResponse.json({ slots: [], message: 'Fecha bloqueada' })
    }

    const dayOfWeek = new Date(date).getDay()

    // Get room availability
    const roomAvail = await sql`
      SELECT * FROM availability
      WHERE business_id = ${businessId} AND day_of_week = ${dayOfWeek} AND is_active = true
    `
    if (roomAvail.length === 0) {
      return NextResponse.json({ slots: [], message: 'No disponible este dia' })
    }

    const room = roomAvail[0]
    let windowStart = parseTime(room.start_time)
    let windowEnd = parseTime(room.end_time)

    // Narrow window by expert availability
    if (expertId) {
      const expertBlocked = await sql`
        SELECT id FROM expert_blocked_dates WHERE expert_id = ${expertId} AND date = ${date}
      `
      if (expertBlocked.length > 0) {
        return NextResponse.json({ slots: [], message: 'Experto no disponible este dia' })
      }

      const expertAvail = await sql`
        SELECT * FROM expert_availability
        WHERE expert_id = ${expertId} AND day_of_week = ${dayOfWeek} AND is_active = true
      `
      if (expertAvail.length > 0) {
        const expert = expertAvail[0]
        windowStart = Math.max(windowStart, parseTime(expert.start_time))
        windowEnd = Math.min(windowEnd, parseTime(expert.end_time))
      }
    }

    if (windowStart >= windowEnd) {
      return NextResponse.json({ slots: [], message: 'Sin disponibilidad este dia' })
    }

    // Generate slots
    const slots: { time: string; available: boolean }[] = []
    let current = windowStart
    while (current + duration <= windowEnd) {
      slots.push({ time: minutesToTime(current), available: true })
      current += duration
    }

    // Get existing bookings — check against expert if provided, otherwise against business
    const existingBookings = expertId
      ? await sql`
          SELECT start_time, end_time FROM bookings
          WHERE expert_id = ${expertId}
            AND date = ${date}
            AND status IN ('confirmed', 'pending_verification')
        `
      : await sql`
          SELECT start_time, end_time FROM bookings
          WHERE business_id = ${businessId}
            AND date = ${date}
            AND status IN ('confirmed', 'pending_verification')
        `

    // Mark overlapping slots unavailable
    const slotsWithAvailability = slots.map((slot) => {
      const slotStart = parseTime(slot.time)
      const slotEnd = slotStart + duration
      const conflict = existingBookings.some((b) => {
        const existStart = parseTime(b.start_time)
        const existEnd = parseTime(b.end_time)
        return slotStart < existEnd && slotEnd > existStart
      })
      return { ...slot, available: !conflict }
    })

    // Filter past slots if today
    const today = new Date().toISOString().split('T')[0]
    if (date === today) {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      return NextResponse.json({
        slots: slotsWithAvailability.filter((s) => parseTime(s.time) > currentMinutes),
      })
    }

    return NextResponse.json({ slots: slotsWithAvailability })
  } catch (error) {
    console.error('[Slots] Get error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
