"""
Email Worker — consomme la queue email.send et envoie les emails via SMTP.
Démarrage : python worker.py
"""
import json
import os
import smtplib
import time
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import pika

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [email-worker] %(levelname)s %(message)s",
)
log = logging.getLogger(__name__)

# ── Configuration SMTP ────────────────────────────────────────
SMTP_HOST     = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER     = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
FROM_EMAIL    = os.environ.get("FROM_EMAIL", "noreply@billetix.dz")
RABBITMQ_URL  = os.environ.get("RABBITMQ_URL", "amqp://guest:guest@localhost:5672")

QUEUE = "email.send"


# ── Templates email ───────────────────────────────────────────

def template_confirmation(data: dict) -> tuple[str, str]:
    subject = f"✅ Confirmation de réservation — {data.get('eventTitle', 'Billetix')}"
    html = f"""
    <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1d9e75;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0">Billetix</h1>
      </div>
      <div style="padding:32px 24px">
        <h2>Votre réservation est confirmée !</h2>
        <p>Bonjour,</p>
        <p>Votre réservation pour <strong>{data.get('eventTitle', 'l\'événement')}</strong> a bien été enregistrée.</p>
        <div style="background:#f1efe8;border-radius:8px;padding:16px;margin:20px 0">
          <p style="margin:4px 0"><strong>Référence :</strong> {data.get('bookingId', '')[:8].upper()}</p>
        </div>
        <p>Votre billet (PDF avec QR code) sera disponible dans votre espace personnel.</p>
        <p style="color:#888;font-size:12px;margin-top:32px">
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
      </div>
    </body></html>
    """
    return subject, html


def template_cancelled(data: dict) -> tuple[str, str]:
    subject = "❌ Annulation de réservation — Billetix"
    html = f"""
    <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#d85a30;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0">Billetix</h1>
      </div>
      <div style="padding:32px 24px">
        <h2>Réservation annulée</h2>
        <p>Votre réservation <strong>{data.get('bookingId', '')[:8].upper()}</strong> a été annulée.</p>
        <p>Si vous n'êtes pas à l'origine de cette annulation, contactez notre support.</p>
      </div>
    </body></html>
    """
    return subject, html


def template_reminder(data: dict) -> tuple[str, str]:
    subject = f"⏰ Rappel : {data.get('eventTitle', 'événement')} demain !"
    html = f"""
    <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#378add;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0">Billetix</h1>
      </div>
      <div style="padding:32px 24px">
        <h2>Votre événement est demain !</h2>
        <p>N'oubliez pas : <strong>{data.get('eventTitle', '')}</strong> a lieu demain.</p>
        <p>Pensez à télécharger votre billet et à vous munir de votre QR code.</p>
      </div>
    </body></html>
    """
    return subject, html


TEMPLATES = {
    "BOOKING_CONFIRMATION": template_confirmation,
    "BOOKING_CANCELLED":    template_cancelled,
    "EVENT_REMINDER":       template_reminder,
}


# ── SMTP sender ───────────────────────────────────────────────

def send_email(to: str, subject: str, html: str):
    if not SMTP_USER or not SMTP_PASSWORD:
        log.warning(f"[SMTP] No credentials — simulating send to {to}: {subject}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = FROM_EMAIL
    msg["To"]      = to
    msg.attach(MIMEText(html, "html", "utf-8"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(FROM_EMAIL, to, msg.as_string())

    log.info(f"[SMTP] Sent '{subject}' → {to}")


# ── Consumer RabbitMQ ─────────────────────────────────────────

def on_message(ch, method, _props, body):
    try:
        data     = json.loads(body)
        msg_type = data.get("type", "")
        to       = data.get("to", "")

        if not to:
            log.warning(f"[email-worker] No recipient in message: {data}")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        template_fn = TEMPLATES.get(msg_type)
        if not template_fn:
            log.warning(f"[email-worker] Unknown message type: {msg_type}")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        subject, html = template_fn(data)
        send_email(to, subject, html)
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as exc:
        log.error(f"[email-worker] Error processing message: {exc}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def main():
    log.info("[email-worker] Starting…")

    # Retry loop au démarrage (RabbitMQ peut être lent)
    for attempt in range(10):
        try:
            params = pika.URLParameters(RABBITMQ_URL)
            conn   = pika.BlockingConnection(params)
            ch     = conn.channel()
            ch.queue_declare(queue=QUEUE, durable=True)
            ch.basic_qos(prefetch_count=5)
            ch.basic_consume(queue=QUEUE, on_message_callback=on_message)
            log.info(f"[email-worker] Connected. Waiting for messages on '{QUEUE}'…")
            ch.start_consuming()
            break
        except pika.exceptions.AMQPConnectionError:
            wait = 2 ** attempt
            log.warning(f"[email-worker] Cannot connect to RabbitMQ, retry in {wait}s…")
            time.sleep(wait)
        except KeyboardInterrupt:
            log.info("[email-worker] Stopped.")
            break


if __name__ == "__main__":
    main()
