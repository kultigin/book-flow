// Dashboard page - main entry point
import { requireAuth, getBusinessById } from '@/lib/auth'
import { sql } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, Clock, CheckCircle, XCircle } from 'lucide-react'
import { DashboardStats } from '@/components/dashboard/stats'
import { RecentBookings } from '@/components/dashboard/recent-bookings'
import { TodaySchedule } from '@/components/dashboard/today-schedule'

async function getDashboardData(businessId: string) {
  const today = new Date().toISOString().split('T')[0]
  
  const [totalBookings, todayBookings, totalClients, upcomingBookings] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM bookings WHERE business_id = ${businessId}`,
    sql`SELECT COUNT(*) as count FROM bookings WHERE business_id = ${businessId} AND date = ${today}`,
    sql`SELECT COUNT(DISTINCT client_id) as count FROM bookings WHERE business_id = ${businessId}`,
    sql`
      SELECT b.*, c.name as client_name, c.phone as client_phone
      FROM bookings b
      JOIN clients c ON b.client_id = c.id
      WHERE b.business_id = ${businessId}
        AND (b.date > ${today} OR (b.date = ${today} AND b.end_time > NOW()::time))
        AND b.status IN ('confirmed', 'pending')
      ORDER BY b.date, b.start_time
      LIMIT 5
    `
  ])

  return {
    totalBookings: parseInt(totalBookings[0].count),
    todayBookings: parseInt(todayBookings[0].count),
    totalClients: parseInt(totalClients[0].count),
    upcomingBookings: upcomingBookings
  }
}

export default async function DashboardPage() {
  const { accountHolder } = await requireAuth()
  const business = await getBusinessById(accountHolder.business_id)
  const data = await getDashboardData(accountHolder.business_id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Bienvenido, {accountHolder.name}
        </h1>
        <p className="text-muted-foreground">
          Panel de control de {business?.name || 'tu negocio'}
        </p>
      </div>

      <DashboardStats
        totalBookings={data.totalBookings}
        todayBookings={data.todayBookings}
        totalClients={data.totalClients}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <TodaySchedule businessId={accountHolder.business_id} />
        <RecentBookings bookings={data.upcomingBookings} />
      </div>
    </div>
  )
}
