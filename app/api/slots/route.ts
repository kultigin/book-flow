import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const date = searchParams.get('date')

    if (!businessId || !date) {
      return NextResponse.json(
        { error: 'businessId y date son requeridos' },
        { status: 400 }
      )
    }

    // Check if date is blocked
    const blockedDate = await sql`
      SELECT id FROM blocked_dates 
      WHERE business_id = ${businessId} AND date = ${date}
    `

    if (blockedDate.length > 0) {
      return NextResponse.json({ slots: [], message: 'Fecha bloqueada' })
    }

    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = new Date(date).getDay()

    // Get availability for this day
    const availability = await sql`
      SELECT * FROM availability 
      WHERE business_id = ${businessId} 
        AND day_of_week = ${dayOfWeek}
        AND is_available = true
    `

    if (availability.length === 0) {
      return NextResponse.json({ slots: [], message: 'No disponible este dia' })
    }

    const avail = availability[0]
    const slotDuration = avail.slot_duration_minutes || 30

    // Generate time slots
    const slots: { time: string; available: boolean }[] = []
    const [startHour, startMin] = avail.start_time.split(':').map(Number)
    const [endHour, endMin] = avail.end_time.split(':').map(Number)
    
    let currentTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin

    while (currentTime + slotDuration <= endTime) {
      const hours = Math.floor(currentTime / 60)
      const minutes = currentTime % 60
      const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      
      slots.push({ time: timeStr, available: true })
      currentTime += slotDuration
    }

    // Get existing bookings for this date
    const existingBookings = await sql`
      SELECT start_time FROM bookings 
      WHERE business_id = ${businessId}
        AND date = ${date}
        AND status IN ('confirmed', 'pending')
    `

    const bookedTimes = new Set(
      existingBookings.map((b) => b.start_time.slice(0, 5))
    )

    // Mark booked slots as unavailable
    const slotsWithAvailability = slots.map((slot) => ({
      ...slot,
      available: !bookedTimes.has(slot.time)
    }))

    // If date is today, filter out past slots
    const today = new Date().toISOString().split('T')[0]
    if (date === today) {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      
      return NextResponse.json({
        slots: slotsWithAvailability.filter((slot) => {
          const [h, m] = slot.time.split(':').map(Number)
          return h * 60 + m > currentMinutes
        })
      })
    }

    return NextResponse.json({ slots: slotsWithAvailability })
  } catch (error) {
    console.error('[Slots] Get error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
