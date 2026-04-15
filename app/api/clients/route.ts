import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clients = await sql`
      SELECT 
        c.*,
        COUNT(b.id) as total_bookings,
        MAX(b.booking_date) as last_booking
      FROM clients c
      LEFT JOIN bookings b ON c.id = b.client_id AND b.status != 'cancelled'
      WHERE c.business_id = ${session.businessId}
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `

    return NextResponse.json(clients)
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    )
  }
}
