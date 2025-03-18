import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const { to, subject, text, html } = await req.json()

    // Configure SMTP transporter
    const transporter = nodemailer.createTransport({
      host: "192.168.1.246",
      port: 465, // Use STARTTLS
      secure: true,
      auth: {
        user: "sven.tan@int.ywlgroup.com",
        pass: "57ZN&bdJJ",
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    // Send email
    const info = await transporter.sendMail({
      from: `"System Monitoring" <${process.env.FROM_EMAIL || "sven.tan@int.ywlgroup.com"}>`,
      to,
      subject,
      text,
      html,
    })

    console.log("Email sent: ", info.messageId)
    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error("Error sending email: ", error)
    return NextResponse.json(
      {
        success: false,
        error: error || "Unknown error",
        message: "Email sending failed",
      },
      { status: 500 },
    )
  }
}

