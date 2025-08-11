import nodemailer from "nodemailer";

export const sendVerificationEmail = async (to: string, name: string, link: string) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"Auth System" <${process.env.EMAIL_FROM}>`,
    to,
    subject: "Verify your email",
    html: `
      <h3>Hello, ${name}</h3>
      <p>Thanks for registering. Please verify your email by clicking below:</p>
      <a href="${link}">${link}</a>
      <p>This link expires in 1 hour.</p>
    `,
  });
};


export const sendEmail = async ({
  to,
  subject,
  html,
  fromName = "Auth System",
}: {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
}) => {
  const transporter = require("nodemailer").createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"${fromName}" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
};
