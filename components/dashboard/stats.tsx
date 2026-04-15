import { Card, CardContent } from '@/components/ui/card'
import { Calendar, Users, CalendarCheck } from 'lucide-react'

interface DashboardStatsProps {
  totalBookings: number
  todayBookings: number
  totalClients: number
}

export function DashboardStats({ totalBookings, todayBookings, totalClients }: DashboardStatsProps) {
  const stats = [
    {
      name: 'Reservas hoy',
      value: todayBookings,
      icon: CalendarCheck,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      name: 'Total reservas',
      value: totalBookings,
      icon: Calendar,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10'
    },
    {
      name: 'Clientes',
      value: totalClients,
      icon: Users,
      color: 'text-chart-3',
      bgColor: 'bg-chart-3/10'
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.name}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.name}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
