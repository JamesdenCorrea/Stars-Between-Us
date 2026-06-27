import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || ''

interface EmailRequest {
  email: string;
  display_name?: string;
  confirmation_url: string;
}

serve(async (req: Request) => {
  try {
    const { email, display_name, confirmation_url }: EmailRequest = await req.json()

    console.log('Sending email to:', email)

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Love App',
          email: 'correajamesden@gmail.com'
        },
        to: [{
          email: email,
          name: display_name || 'Valued User'
        }],
        subject: 'Confirm your Love App account ❤️',
        htmlContent: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .button { display: inline-block; padding: 12px 24px; background: #ff6b6b; color: white; text-decoration: none; border-radius: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>❤️ Welcome to Love App!</h1>
              <p>Hi ${display_name || 'there'},</p>
              <p>Thanks for signing up! Please confirm your email address by clicking the button below:</p>
              <p><a href="${confirmation_url}" class="button">Confirm Email</a></p>
              <p>Or copy this link: ${confirmation_url}</p>
              <p>This link expires in 24 hours.</p>
              <br/>
              <p>With love,<br/>The Love App Team</p>
            </div>
          </body>
          </html>
        `
      })
    })

    const result = await response.json()
    console.log('Brevo response:', result)

    return new Response(JSON.stringify({ success: true, messageId: result.messageId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('Error:', errorMessage)
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})