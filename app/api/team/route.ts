import { NextRequest, NextResponse } from 'next/server'
import { getSession, hashPassword } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.accountHolder.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { businessId, name, email, password, role, slug } = await request.json()

    // Verify user is admin of this business
    if (session.accountHolder.business_id !== businessId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Check if email already exists
    const existing = await sql`
      SELECT id FROM account_holders WHERE email = ${email}
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Este email ya esta registrado' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create account holder
    const result = await sql`
      INSERT INTO account_holders (business_id, email, password_hash, name, role, slug)
      VALUES (${businessId}, ${email}, ${passwordHash}, ${name}, ${role}, ${slug || null})
      RETURNING id, name, email, role, slug, bio, is_active, created_at
    `

    return NextResponse.json({ member: result[0] })
  } catch (error) {
    console.error('[Team] Add error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
