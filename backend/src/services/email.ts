import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.FROM_EMAIL || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn(
      "Email service not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env"
    );
    return null;
  }

  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return transporter;
}

export async function sendEmail(
  to: string,
  subject: string,
  message: string
): Promise<void> {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}, Message: ${message}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject,
      html: `
        <h2>${subject}</h2>
        <p>${message}</p>
        <hr/>
        <p>Total Property Solutions Pro</p>
      `,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}
