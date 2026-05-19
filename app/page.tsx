""use client"
// BookFlow home page"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Clock, Shield, ArrowRight, Check } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">BookFlow</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/my-bookings">
              <Button variant="ghost">Mis Reservas</Button>
            </Link>
            <Link href="/login">
              <Button>Acceso Empresas</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Sistema de Reservas
            <span className="block text-primary">para tu Negocio</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Gestiona las citas de tu negocio de forma sencilla. Tus clientes pueden reservar online 
            y recibir recordatorios por SMS.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/book/demo-business">
              <Button size="lg" className="gap-2">
                Ver Demo <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Acceder al Panel
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold text-foreground">
            Todo lo que necesitas
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Una plataforma completa para gestionar las reservas de tu negocio
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Calendar className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Reservas Online</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Tus clientes pueden reservar citas 24/7 desde cualquier dispositivo
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Recordatorios SMS</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Envio automatico de recordatorios 24h y 2h antes de cada cita
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Multi-usuario</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Varios empleados pueden gestionar las reservas con diferentes permisos
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary" />
                <CardTitle className="mt-4">Verificacion SMS</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Los clientes verifican su telefono para evitar reservas falsas
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold text-foreground">
            Como funciona para los clientes
          </h2>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="mt-4 text-lg font-semibold">Elige fecha y hora</h3>
              <p className="mt-2 text-muted-foreground">
                Selecciona el dia y la hora que mejor te convenga
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="mt-4 text-lg font-semibold">Verifica tu telefono</h3>
              <p className="mt-2 text-muted-foreground">
                Recibe un codigo SMS para confirmar tu reserva
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="mt-4 text-lg font-semibold">Listo</h3>
              <p className="mt-2 text-muted-foreground">
                Recibiras recordatorios automaticos antes de tu cita
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Placeholder */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold text-foreground">
            Precios sencillos
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Sin sorpresas, sin costes ocultos
          </p>

          <Card className="mx-auto mt-12 max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Plan Profesional</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">29EUR</span>
                <span className="text-muted-foreground">/mes</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  "Reservas ilimitadas",
                  "Hasta 10 empleados",
                  "Recordatorios SMS incluidos",
                  "Soporte por email",
                  "Panel de estadisticas",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button className="mt-8 w-full" size="lg">
                Empezar prueba gratis
              </Button>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                14 dias de prueba sin compromiso
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-semibold">BookFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2024 BookFlow. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
