'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { AccountHolder } from '@/lib/auth'
import {
  Calendar,
  Clock,
  Users,
  Settings,
  CalendarDays,
  UserCircle,
  LayoutDashboard
} from 'lucide-react'

interface DashboardSidebarProps {
  name: string
  email: string
  role : 'admin' | 'staff'
}

const navigation = [
  { name: 'Panel', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Reservas', href: '/dashboard/bookings', icon: Calendar },
  { name: 'Calendario', href: '/dashboard/calendar', icon: CalendarDays },
  { name: 'Disponibilidad', href: '/dashboard/availability', icon: Clock },
  { name: 'Clientes', href: '/dashboard/clients', icon: Users },
]

const adminNavigation = [
  { name: 'Equipo', href: '/dashboard/team', icon: UserCircle },
  { name: 'Configuracion', href: '/dashboard/settings', icon: Settings },
]

export function DashboardSidebar({ name,email,role }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 flex-shrink-0 bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
        <Calendar className="h-6 w-6 text-sidebar-primary" />
        <span className="font-semibold text-lg">BookFlow</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}

        {role === 'admin' && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold uppercase text-sidebar-foreground/50">
                Administracion
              </p>
            </div>
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href)
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate capitalize">
              {role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
