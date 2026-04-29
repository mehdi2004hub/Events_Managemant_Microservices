import json
import uuid
import jwt
import requests
import pika
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from .models import Booking

def health(request):
    return JsonResponse({"status": "ok", "service": "booking-service"})

def _get_user_from_token(request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "): return None
    try:
        payload = jwt.decode(auth_header[7:], settings.JWT_SECRET, algorithms=["HS256"])
        return payload
    except: return None

def publish(queue, message):
    try:
        params = pika.URLParameters(settings.RABBITMQ_URL)
        conn = pika.BlockingConnection(params)
        ch = conn.channel()
        ch.queue_declare(queue=queue, durable=True)
        ch.basic_publish(
            exchange='', routing_key=queue,
            body=json.dumps(message),
            properties=pika.BasicProperties(delivery_mode=2)
        )
        conn.close()
    except Exception as e:
        print(f"FAILED TO PUBLISH: {e}")

@csrf_exempt
@require_http_methods(["POST"])
def booking_create(request):
    user = _get_user_from_token(request)
    if not user: return JsonResponse({"error": "Unauthorized"}, status=401)
    
    try:
        body = json.loads(request.body)
        event_id = body.get("eventId")
        quantity = body.get("quantity")
        
        if not event_id: return JsonResponse({"error": "Missing eventId"}, status=400)

        # 1. Check Event Service (Simulated or Real URL)
        # In a real environment, this might be 'http://event-service:8000/api/events/{event_id}/'
        # For testing, we might use localhost if both are running.
        event_url = f"http://localhost:8001/api/events/{event_id}/"
        resp = requests.get(event_url)
        if not resp.ok:
            return JsonResponse({"error": "Event not found"}, status=resp.status_code)
        
        event_data = resp.json()
        if event_data["availableSeats"] < quantity:
            return JsonResponse({"error": "Not enough seats available"}, status=409)

        # 2. Update Event Service (Decrement seats)
        # In a real scenario, this should be atomic, but here we simulate a simple patch
        # Total price calculation
        total_price = float(event_data["price"]) * quantity
        
        # 3. Create Booking
        booking = Booking.objects.create(
            event_id=uuid.UUID(event_id),
            user_id=uuid.UUID(user["sub"]),
            quantity=quantity,
            total_price=total_price,
            status="CONFIRMED"
        )
        
        # 4. Notify via RabbitMQ
        publish("ticket.generate", {"bookingId": str(booking.id), "eventId": event_id})
        publish("email.send", {
            "type": "BOOKING_CONFIRMATION",
            "to": user["email"],
            "eventTitle": event_data["title"],
            "bookingId": str(booking.id)
        })

        return JsonResponse({
            "id": str(booking.id),
            "quantity": booking.quantity,
            "status": booking.status,
            "totalPrice": "{:.2f}".format(booking.total_price)
        }, status=201)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@require_http_methods(["GET"])
def my_bookings(request):
    user = _get_user_from_token(request)
    if not user: return JsonResponse({"error": "Unauthorized"}, status=401)
    
    bookings = Booking.objects.filter(user_id=uuid.UUID(user["sub"]))
    data = [{
        "id": str(b.id),
        "eventId": str(b.event_id),
        "quantity": b.quantity,
        "totalPrice": str(b.total_price),
        "status": b.status,
        "createdAt": b.created_at.isoformat()
    } for b in bookings]
    return JsonResponse(data, safe=False)
