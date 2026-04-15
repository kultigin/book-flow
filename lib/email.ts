// Email service for magic links
// In production, integrate with a service like Resend, SendGrid, or AWS SES

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  // Check if email service is configured
  const resendApiKey = process.env.RESEND_API_KEY
  
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
          to,
          subject,
          html
        })
      })
      
      if (!response.ok) {
        console.error('[Email] Failed to send:', await response.text())
        return false
      }
      
      console.log(`[Email] Sent to ${to}: ${subject}`)
      return true
    } catch (error) {
      console.error('[Email] Error:', error)
      return false
    }
  } else {
    // Mock mode - log the email
    console.log(`[Email MOCK] To: ${to}, Subject: ${subject}`)
    console.log(`[Email MOCK] Content: ${html}`)
    return true
  }
}

export async function sendMagicLinkEmail(email: string, token: string, businessName: string): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const magicLinkUrl = `${baseUrl}/auth/magic-link?token=${token}`
  
  return sendEmail({
    to: email,
    subject: `Iniciar sesion en ${businessName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Iniciar sesion</h2>
        <p>Haz clic en el boton de abajo para iniciar sesion en tu cuenta de ${businessName}.</p>
        <p style="margin: 24px 0;">
          <a href="${magicLinkUrl}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Iniciar sesion
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Este enlace expira en 15 minutos. Si no solicitaste este enlace, puedes ignorar este correo.
        </p>
      </div>
    `
  })
}
