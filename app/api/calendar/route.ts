import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    if (!businessId || !year || !month) {
      return NextResponse.json(
        { error: 'Parametros requeridos: businessId, year, month' },
        { status: 400 }
      )
    }

    // Verify user belongs to this business
    if (session.accountHolder.business_id !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const nextMonth = parseInt(month) + 1
    const nextYear = nextMonth > 12 ? parseInt(year) + 1 : parseInt(year)
    const adjustedMonth = nextMonth > 12 ? 1 : nextMonth

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${nextYear}-${String(adjustedMonth).padStart(2, '0')}-01`

    const bookings = await sql`
      SELECT b.*, c.name as client_name, c.phone as client_phone
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      WHERE b.business_id = ${businessId}
        AND b.date >= ${startDate}
        AND b.date < ${endDate}
        AND b.status IN ('confirmed', 'pending')
      ORDER BY b.date, b.start_time
    `

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('[Calendar] Get error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
