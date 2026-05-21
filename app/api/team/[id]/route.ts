import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.accountHolder.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const existing = await sql`
      SELECT * FROM account_holders WHERE id = ${id}
    `

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })
    }

    const current = existing[0]

    if (current.business_id !== session.accountHolder.business_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { name, slug, bio, is_active, role } = await request.json()

    // Validate slug uniqueness if changing
    if (slug && slug !== current.slug) {
      const slugConflict = await sql`
        SELECT id FROM account_holders WHERE slug = ${slug} AND id != ${id}
      `
      if (slugConflict.length > 0) {
        return NextResponse.json({ error: 'Este slug ya esta en uso' }, { status: 400 })
      }
    }

    const updated = {
      name: name ?? current.name,
      slug: slug !== undefined ? (slug || null) : current.slug,
      bio: bio !== undefined ? (bio || null) : current.bio,
      is_active: is_active !== undefined ? is_active : current.is_active,
      role: role ?? current.role,
    }

    const result = await sql`
      UPDATE account_holders
      SET
        name = ${updated.name},
        slug = ${updated.slug},
        bio = ${updated.bio},
        is_active = ${updated.is_active},
        role = ${updated.role},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, email, role, slug, bio, is_active, created_at
    `

    return NextResponse.json({ member: result[0] })
  } catch (error) {
    console.error('[Team] Update error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.accountHolder.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Cannot delete yourself
    if (id === session.accountHolder.id) {
      return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 })
    }

    // Verify the member belongs to same business
    const member = await sql`
      SELECT business_id FROM account_holders WHERE id = ${id}
    `

    if (member.length === 0) {
      return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })
    }

    if (member[0].business_id !== session.accountHolder.business_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Block deletion if there are upcoming confirmed/pending bookings
    const upcomingBookings = await sql`
      SELECT COUNT(*) as count FROM bookings
      WHERE expert_id = ${id}
        AND date >= CURRENT_DATE
        AND status IN ('confirmed', 'pending_verification')
    `

    if (parseInt(upcomingBookings[0].count) > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un miembro con reservas pendientes' },
        { status: 400 }
      )
    }

    // Null out treatment_id for ALL bookings referencing this expert's treatments
    await sql`
      UPDATE bookings SET treatment_id = NULL
      WHERE treatment_id IN (SELECT id FROM treatments WHERE expert_id = ${id})
    `
    // Null out expert_id for all bookings assigned to this expert
    await sql`UPDATE bookings SET expert_id = NULL WHERE expert_id = ${id}`
    // Delete treatments (FK deps cleared)
    await sql`DELETE FROM treatments WHERE expert_id = ${id}`
    // Delete availability and blocked date records
    await sql`DELETE FROM expert_availability WHERE expert_id = ${id}`
    await sql`DELETE FROM expert_blocked_dates WHERE expert_id = ${id}`

    // Delete member (sessions cascade automatically via ON DELETE CASCADE)
    await sql`DELETE FROM account_holders WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Team] Delete error:', error)
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
