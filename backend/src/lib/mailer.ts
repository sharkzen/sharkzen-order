import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
});

export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export const sendMail = (mail: Mail) => transporter.sendMail({ from: env.MAIL_FROM, ...mail });
