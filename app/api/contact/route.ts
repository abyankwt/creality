import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  AUTOMATED_SENDER_EMAIL,
  EMAIL_SENDER_NAME,
  INQUIRY_EMAIL,
} from "@/config/emails";

export const runtime = "nodejs";

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host || !user || !pass || Number.isNaN(port)) {
    return null;
  }

  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  };
};

const validatePayload = (body: ContactPayload) => {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || !email || !message) {
    return { error: "Name, email, and message are required." };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  if (message.length < 10) {
    return { error: "Please provide a more detailed message." };
  }

  return { name, email, message };
};

export async function POST(request: Request) {
  const smtpConfig = getSmtpConfig();

  if (!smtpConfig) {
    console.error("Contact form SMTP configuration is incomplete.");

    return NextResponse.json(
      { success: false, error: "Contact form is not configured yet." },
      { status: 500 },
    );
  }

  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  const validation = validatePayload(payload);

  if ("error" in validation) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 },
    );
  }

  const transporter = nodemailer.createTransport(smtpConfig);
  const escapedName = escapeHtml(validation.name);
  const escapedEmail = escapeHtml(validation.email);
  const escapedMessage = escapeHtml(validation.message).replace(/\n/g, "<br />");

  try {
    await transporter.sendMail({
      from: `"${EMAIL_SENDER_NAME}" <${AUTOMATED_SENDER_EMAIL}>`,
      to: INQUIRY_EMAIL,
      replyTo: validation.email,
      subject: `New general inquiry from ${validation.name}`,
      text: [
        "New general inquiry",
        "",
        `Name: ${validation.name}`,
        `Email: ${validation.email}`,
        "",
        "Message:",
        validation.message,
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin: 0 0 16px;">New general inquiry</h2>
          <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapedName}</p>
          <p style="margin: 0 0 8px;"><strong>Email:</strong> ${escapedEmail}</p>
          <p style="margin: 16px 0 8px;"><strong>Message:</strong></p>
          <p style="margin: 0;">${escapedMessage}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send contact email", error);

    return NextResponse.json(
      { success: false, error: "Unable to send your message right now." },
      { status: 500 },
    );
  }
}
