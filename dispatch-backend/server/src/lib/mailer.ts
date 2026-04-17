import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(to: string, otp: string, name: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Your Dispatch password reset code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">Dispatch</h2>
        <p>Hi ${name},</p>
        <p>Use this code to reset your password. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#7c3aed;margin:24px 0">
          ${otp}
        </div>
        <p style="color:#666;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(to: string, name: string, userId: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Welcome to Dispatch!",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#7c3aed">Welcome to Dispatch, ${name}!</h2>
        <p>Your account has been created successfully.</p>
        <p>Your user ID is: <strong>${userId}</strong></p>
        <p>Start riding or driving today.</p>
      </div>
    `,
  });
}
