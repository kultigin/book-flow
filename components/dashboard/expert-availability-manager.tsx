'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { Clock } from 'lucide-react'

interface ExpertAvailability {
  id: string
  expert_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

interface ExpertAvailabilityManagerProps {
  initialAvailability: ExpertAvailability[]
}

const DAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miercoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sabado' },
]

const DEFAULT_AVAILABILITY = DAYS.map((day) => ({
  day_of_week: day.value,
  start_time: '09:00',
  end_time: '18:00',
  is_active: day.value >= 1 && day.value <= 5,
}))

export function ExpertAvailabilityManager({ initialAvailability }: ExpertAvailabilityManagerProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const merged = DAYS.map((day) => {
    const existing = initialAvailability.find((a) => a.day_of_week === day.value)
    const defaultDay = DEFAULT_AVAILABILITY.find((d) => d.day_of_week === day.value)!
    return {
      ...defaultDay,
      ...existing,
      id: existing?.id || '',
    }
  })

  const [availability, setAvailability] = useState(merged)

  function updateDay(dayIndex: number, field: string, value: string | boolean) {
    setAvailability((prev) =>
      prev.map((day) =>
        day.day_of_week === dayIndex ? { ...day, [field]: value } : day
      )
    )
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const res = await fetch('/api/expert-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability }),
      })

      if (!res.ok) throw new Error('Failed to save')

      router.refresh()
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Mis horarios semanales
        </CardTitle>
        <CardDescription>
          Define tus horarios de trabajo para cada dia de la semana
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {DAYS.map((day) => {
          const dayAvail = availability.find((a) => a.day_of_week === day.value)!

          return (
            <div key={day.value} className="flex items-center gap-4 py-2 border-b last:border-0">
              <div className="w-24">
                <span className="font-medium">{day.label}</span>
              </div>

              <Switch
                checked={dayAvail.is_active}
                onCheckedChange={(checked) => updateDay(day.value, 'is_active', checked)}
              />

              {dayAvail.is_active && (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={dayAvail.start_time.slice(0, 5)}
                    onChange={(e) => updateDay(day.value, 'start_time', e.target.value)}
                    className="w-28"
                  />
                  <span className="text-muted-foreground">a</span>
                  <Input
                    type="time"
                    value={dayAvail.end_time.slice(0, 5)}
                    onChange={(e) => updateDay(day.value, 'end_time', e.target.value)}
                    className="w-28"
                  />
                </div>
              )}

              {!dayAvail.is_active && (
                <span className="text-sm text-muted-foreground">No disponible</span>
              )}
            </div>
          )
        })}

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : null}
          {isSaving ? 'Guardando...' : 'Guardar horarios'}
        </Button>
      </CardContent>
    </Card>
  )
}
