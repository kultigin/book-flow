import { NextRequest, NextResponse } from 'next/server'
import { getSession, verifyPassword, hashPassword } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json()

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Las contrasenas nuevas no coinciden' }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'La nueva contrasena debe tener al menos 8 caracteres' }, { status: 400 })
    }

    const result = await sql`
      SELECT password_hash FROM account_holders WHERE id = ${session.accountHolder.id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { password_hash } = result[0]

    if (!password_hash) {
      return NextResponse.json({ error: 'Esta cuenta usa enlace magico para acceder' }, { status: 400 })
    }

    const isCurrentValid = await verifyPassword(currentPassword, password_hash)
    if (!isCurrentValid) {
      return NextResponse.json({ error: 'La contrasena actual es incorrecta' }, { status: 400 })
    }

    const newHash = await hashPassword(newPassword)

    await sql`
      UPDATE account_holders
      SET password_hash = ${newHash}, updated_at = NOW()
      WHERE id = ${session.accountHolder.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ChangePassword] Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
