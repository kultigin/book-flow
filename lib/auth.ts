import { sql } from './db'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export interface AccountHolder {
  id: string
  business_id: string
  email: string
  name: string
  role: 'admin' | 'staff'
  created_at: Date
}

export interface Session {
  id: string
  account_holder_id: string
  expires_at: Date
}

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length]
  }
  return result
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(accountHolderId: string): Promise<string> {
  const sessionToken = generateToken(64)
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  
  await sql`
    INSERT INTO sessions (token, account_holder_id, expires_at)
    VALUES (${sessionToken}, ${accountHolderId}, ${expiresAt.toISOString()})
  `
  
  const cookieStore = await cookies()
  cookieStore.set('session_id', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/'
  })
  
  return sessionToken
}

export async function getSession(): Promise<{ session: Session; accountHolder: AccountHolder } | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session_id')?.value
  
  if (!sessionId) return null
  
  const result = await sql`
    SELECT 
      s.token as session_token,
      s.expires_at,
      ah.id,
      ah.business_id,
      ah.email,
      ah.name,
      ah.role,
      ah.created_at
    FROM sessions s
    JOIN account_holders ah ON s.account_holder_id = ah.id
    WHERE s.token = ${sessionId}
      AND s.expires_at > NOW()
  `
  
  if (result.length === 0) return null
  
  const row = result[0]
  return {
    session: {
      id: row.session_token,
      account_holder_id: row.id,
      expires_at: row.expires_at
    },
    accountHolder: {
      id: row.id,
      business_id: row.business_id,
      email: row.email,
      name: row.name,
      role: row.role,
      created_at: row.created_at
    }
  }
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (session.accountHolder.role !== 'admin') {
    redirect('/dashboard')
  }
  return session
}

export async function logout() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session_id')?.value
  
  if (sessionId) {
    await sql`DELETE FROM sessions WHERE token = ${sessionId}`
  }
  
  cookieStore.delete('session_id')
}

// Magic link functions
export async function createMagicLinkToken(email: string): Promise<string | null> {
  const result = await sql`
    SELECT id FROM account_holders WHERE email = ${email}
  `
  
  if (result.length === 0) return null
  
  const token = generateToken(64)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  
  // Store in verification_codes table with type 'magic_link'
  await sql`
    INSERT INTO verification_codes (phone, code, expires_at)
    VALUES (${`magic:${email}`}, ${token}, ${expiresAt.toISOString()})
  `
  
  return token
}

export async function verifyMagicLinkToken(token: string): Promise<string | null> {
  const result = await sql`
    SELECT phone FROM verification_codes 
    WHERE code = ${token} 
      AND expires_at > NOW()
      AND phone LIKE 'magic:%'
  `
  
  if (result.length === 0) return null
  
  const email = result[0].phone.replace('magic:', '')
  
  // Delete the used token
  await sql`DELETE FROM verification_codes WHERE code = ${token}`
  
  return email
}

// Login with email and password
export async function loginWithPassword(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  console.log('[v0] loginWithPassword called with email:', email)
  
  const result = await sql`
    SELECT id, password_hash FROM account_holders 
    WHERE email = ${email}
  `
  
  console.log('[v0] Query result length:', result.length)
  
  if (result.length === 0) {
    console.log('[v0] No account found for email:', email)
    return { success: false, error: 'Invalid email or password' }
  }
  
  const accountHolder = result[0]
  console.log('[v0] Account found, id:', accountHolder.id)
  console.log('[v0] Password hash exists:', !!accountHolder.password_hash)
  console.log('[v0] Password hash (first 20 chars):', accountHolder.password_hash?.substring(0, 20))
  
  if (!accountHolder.password_hash) {
    return { success: false, error: 'Please use magic link to login' }
  }
  
  const isValid = await verifyPassword(password, accountHolder.password_hash)
  console.log('[v0] Password verification result:', isValid)
  
  if (!isValid) {
    return { success: false, error: 'Invalid email or password' }
  }
  
  await createSession(accountHolder.id)
  return { success: true }
}

// Get business info
export async function getBusinessBySlug(slug: string) {
  const result = await sql`
    SELECT * FROM businesses WHERE slug = ${slug}
  `
  return result[0] || null
}

export async function getBusinessById(id: string) {
  const result = await sql`
    SELECT * FROM businesses WHERE id = ${id}
  `
  return result[0] || null
}
