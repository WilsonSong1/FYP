import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv("./.env")

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)

def send_reset_code_email(to_email: str, code: str):
    msg = EmailMessage()
    msg["Subject"] = "Your password reset code"
    msg["From"] = FROM_EMAIL
    msg["To"] = to_email
    msg.set_content(f"Your password reset code is: {code}")

    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as smtp:
        smtp.login(SMTP_USER, SMTP_PASSWORD)
        smtp.send_message(msg)
