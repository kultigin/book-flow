import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendReminder24h, sendReminder2h } from '@/lib/sms'

// This endpoint should be called by Vercel Cron
// Add to vercel.json: { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }] }

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const results = {
      reminder24h: 0,
      reminder2h: 0,
      errors: 0
    }

    // 24-hour reminders
    // Find bookings happening tomorrow that haven't received 24h reminder
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = tomorrow.toISOString().split('T')[0]

    const bookings24h = await sql`
      SELECT 
        b.id, b.date, b.start_time,
        c.phone, c.name as client_name,
        bus.name as business_name
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      JOIN businesses bus ON b.business_id = bus.id
      LEFT JOIN sms_log sl ON sl.booking_id = b.id AND sl.message_type = 'reminder_24h'
      WHERE b.date = ${tomorrowDate}
        AND b.status = 'confirmed'
        AND sl.id IS NULL
    `

    for (const booking of bookings24h) {
      try {
        const formattedDate = new Date(booking.date).toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        })
        
        await sendReminder24h(
          booking.phone,
          booking.business_name,
          formattedDate,
          booking.start_time.slice(0, 5),
          booking.id
        )
        results.reminder24h++
      } catch (error) {
        console.error(`[Cron] 24h reminder failed for booking ${booking.id}:`, error)
        results.errors++
      }
    }

    // 2-hour reminders
    // Find bookings happening in approximately 2 hours that haven't received 2h reminder
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const targetDate = twoHoursFromNow.toISOString().split('T')[0]
    const targetTimeStart = `${String(twoHoursFromNow.getHours()).padStart(2, '0')}:${String(twoHoursFromNow.getMinutes()).padStart(2, '0')}`
    
    // Get bookings within a 30-minute window around the 2-hour mark
    const threeHoursFromNow = new Date(now.getTime() + 2.5 * 60 * 60 * 1000)
    const targetTimeEnd = `${String(threeHoursFromNow.getHours()).padStart(2, '0')}:${String(threeHoursFromNow.getMinutes()).padStart(2, '0')}`

    const bookings2h = await sql`
      SELECT 
        b.id, b.date, b.start_time,
        c.phone, c.name as client_name,
        bus.name as business_name
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      JOIN businesses bus ON b.business_id = bus.id
      LEFT JOIN sms_log sl ON sl.booking_id = b.id AND sl.message_type = 'reminder_2h'
      WHERE b.date = ${targetDate}
        AND b.start_time >= ${targetTimeStart}
        AND b.start_time < ${targetTimeEnd}
        AND b.status = 'confirmed'
        AND sl.id IS NULL
    `

    for (const booking of bookings2h) {
      try {
        await sendReminder2h(
          booking.phone,
          booking.business_name,
          booking.start_time.slice(0, 5),
          booking.id
        )
        results.reminder2h++
      } catch (error) {
        console.error(`[Cron] 2h reminder failed for booking ${booking.id}:`, error)
        results.errors++
      }
    }

    console.log(`[Cron] Reminders sent: 24h=${results.reminder24h}, 2h=${results.reminder2h}, errors=${results.errors}`)

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: now.toISOString()
    })
  } catch (error) {
    console.error('[Cron] Reminders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
