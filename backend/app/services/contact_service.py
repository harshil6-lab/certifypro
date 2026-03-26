from __future__ import annotations

import smtplib
from email.message import EmailMessage

from fastapi import HTTPException

from app.core.config import get_settings


def send_contact_message(*, sender_name: str, sender_email: str, message: str) -> dict[str, str]:
    settings = get_settings()

    if not settings.SMTP_HOST or not settings.SMTP_FROM_EMAIL:
        raise HTTPException(status_code=503, detail="Contact email service is not configured.")

    support_brand = settings.CONTACT_BRAND_NAME
    destination_email = settings.CONTACT_DESTINATION_EMAIL
    clean_name = sender_name.strip()
    clean_email = sender_email.strip().lower()
    clean_message = message.strip()

    email_message = EmailMessage()
    email_message["Subject"] = f"[{support_brand}] New contact message from {clean_name}"
    email_message["From"] = f"{support_brand} Contact Desk <{settings.SMTP_FROM_EMAIL}>"
    email_message["To"] = destination_email
    email_message["Reply-To"] = clean_email

    text_body = (
        f"{support_brand} contact form submission\n\n"
        f"Name: {clean_name}\n"
        f"Email: {clean_email}\n\n"
        f"Message:\n{clean_message}\n"
    )
    html_body = f"""
    <html>
      <body style=\"margin:0;padding:24px;background:#f7f3ea;font-family:Segoe UI,Arial,sans-serif;color:#172554;\">
        <div style=\"max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 12px 30px rgba(15,23,42,0.08);\">
          <div style=\"padding:20px 24px;background:linear-gradient(135deg,#1d4ed8 0%,#0f172a 100%);color:#ffffff;\">
            <div style=\"font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.82;\">{support_brand}</div>
            <h1 style=\"margin:10px 0 0;font-size:28px;line-height:1.2;\">New Contact Message</h1>
          </div>
          <div style=\"padding:24px;\">
            <p style=\"margin:0 0 18px;font-size:15px;color:#475569;\">A new public contact request was submitted from the website.</p>
            <div style=\"margin-bottom:18px;padding:16px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;\">
              <div style=\"margin-bottom:8px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;\">Sender</div>
              <div style=\"font-size:18px;font-weight:700;color:#0f172a;\">{clean_name}</div>
              <div style=\"margin-top:6px;font-size:14px;color:#1d4ed8;\">{clean_email}</div>
            </div>
            <div style=\"padding:16px;border-radius:14px;background:#fffdf7;border:1px solid #facc15;\">
              <div style=\"margin-bottom:10px;font-size:13px;color:#a16207;text-transform:uppercase;letter-spacing:0.08em;\">Message</div>
              <div style=\"white-space:pre-wrap;font-size:15px;line-height:1.7;color:#1e293b;\">{clean_message}</div>
            </div>
          </div>
        </div>
      </body>
    </html>
    """
    email_message.set_content(text_body)
    email_message.add_alternative(html_body, subtype="html")

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as smtp:
            smtp.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(email_message)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Unable to send contact email: {exc}") from exc

    return {
        "destination_email": destination_email,
        "brand_name": support_brand,
    }