import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'support@webizsquare.com',
    pass: process.env.SMTP_PASSWORD || '',
  },
})

export async function sendPasswordResetEmail(toEmail: string, token: string, baseUrl?: string) {
  const domain = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://bachatgat.webizsquare.com'
  const resetUrl = `${domain}/reset-password?token=${token}`

  const mailOptions = {
    from: '"Bachatgat Online Support" <support@webizsquare.com>',
    to: toEmail,
    subject: 'बचत गट पासवर्ड रिसेट लिंक / Password Reset Link - Bachatgat Online',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;">
          <h2 style="color: #ea580c; margin: 0;">🪷 बचत गट ऑनलाइन (Bachatgat Online)</h2>
        </div>
        <div style="padding: 20px 0; color: #333333; line-height: 1.6;">
          <p style="font-size: 16px;">नमस्कार / Hello,</p>
          <p style="font-size: 15px;">
            तुमच्या बचत गट ऑनलाइन खात्याचा पासवर्ड रिसेट करण्याची विनंती प्राप्त झाली आहे.<br />
            We received a request to reset your password for your Bachatgat Online account.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #ea580c; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              पासवर्ड रिसेट करा / Reset Password
            </a>
          </div>
          <p style="font-size: 13px; color: #666666;">
            किंवा खालील लिंक तुमच्या ब्राऊझरमध्ये कॉपी करा / Or copy the link into your browser:<br />
            <a href="${resetUrl}" style="color: #ea580c; word-break: break-all;">${resetUrl}</a>
          </p>
          <p style="font-size: 13px; color: #888888; margin-top: 25px;">
            ही लिंक १ तासासाठी वैध आहे. तुम्ही ही विनंती केली नसेल तर या ईमेलकडे दुर्लक्ष करा.<br />
            This link is valid for 1 hour. If you did not request this, please ignore this email.
          </p>
        </div>
        <div style="text-align: center; padding-top: 15px; border-top: 1px solid #f0f0f0; font-size: 12px; color: #aaaaaa;">
          &copy; ${new Date().getFullYear()} Bachatgat Online. All rights reserved.
        </div>
      </div>
    `,
  }

  return await transporter.sendMail(mailOptions)
}
