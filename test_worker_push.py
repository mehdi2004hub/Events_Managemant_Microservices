import pika
import json
import os

RABBITMQ_URL = os.environ.get("RABBITMQ_URL", "amqp://guest:guest@localhost:5672")
QUEUE = "email.send"

def push_test_message():
    print(f"Connecting to {RABBITMQ_URL}...")
    try:
        params = pika.URLParameters(RABBITMQ_URL)
        conn = pika.BlockingConnection(params)
        ch = conn.channel()
        ch.queue_declare(queue=QUEUE, durable=True)

        message = {
            "type": "BOOKING_CONFIRMATION",
            "to": "test@example.com",
            "eventTitle": "Mon super événement",
            "bookingId": "12345678-abcd"
        }

        ch.basic_publish(
            exchange='',
            routing_key=QUEUE,
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=2,  # make message persistent
            )
        )
        print(" [x] Sent test message to 'email.send'")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    push_test_message()
