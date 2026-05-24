import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  const { accountHolder } = await requireAuth()
  const body = await req.json()
  const { slug } = body

  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'Slug requerido' }, { status: 400 })
  }

  const cleaned = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
  if (!cleaned) {
    return NextResponse.json({ error: 'Slug inválido' }, { status: 400 })
  }

  // Check uniqueness (excluding self)
  const existing = await sql`
    SELECT id FROM account_holders WHERE slug = ${cleaned} AND id != ${accountHolder.id}
  `
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Este slug ya está en uso' }, { status: 409 })
  }

  await sql`
    UPDATE account_holders SET slug = ${cleaned} WHERE id = ${accountHolder.id}
  `

  return NextResponse.json({ slug: cleaned })
}
