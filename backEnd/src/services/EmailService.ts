import nodemailer from "nodemailer";

export const EmailService = {
  async send(to: string, subject: string, text: string) {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"GranConecta" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
  },
};
