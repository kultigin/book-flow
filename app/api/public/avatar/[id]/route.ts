import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const rows = await sql`SELECT avatar_url FROM account_holders WHERE id = ${id}`
  const avatarUrl = rows[0]?.avatar_url

  if (!avatarUrl) {
    return new NextResponse(null, { status: 404 })
  }

  try {
    const upstream = await fetch(avatarUrl, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    })
    if (!upstream.ok) return new NextResponse(null, { status: 404 })
    const contentType = upstream.headers.get('Content-Type') || 'image/jpeg'
    return new NextResponse(upstream.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (err) {
    console.error('[avatar]', err)
    return new NextResponse(null, { status: 404 })
  }
}
