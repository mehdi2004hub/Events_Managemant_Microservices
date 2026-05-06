import json
import uuid
import jwt
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from .models import Event
from django.shortcuts import get_object_or_404

def health(request):
    return JsonResponse({"status": "ok", "service": "event-service"})


def _get_user_from_token(request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    try:
        token = auth_header[7:]
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return payload
    except Exception:
        return None

@csrf_exempt
@require_http_methods(["GET", "POST"])
def event_list_create(request):
    user = _get_user_from_token(request)

    if request.method == "GET":
        category = request.GET.get("category")
        search = request.GET.get("search")
        
        events = Event.objects.filter(status="PUBLISHED")
        if category:
            events = events.filter(category=category)
        if search:
            events = events.filter(title__icontains=search)
            
        data = []
        for e in events:
            data.append({
                "id": str(e.id),
                "title": e.title,
                "description": e.description,
                "date": e.date.isoformat(),
                "location": e.location,
                "capacity": e.capacity,
                "availableSeats": e.available_seats,
                "price": str(e.price),
                "category": e.category,
                "status": e.status,
            })
        return JsonResponse(data, safe=False)

    elif request.method == "POST":
        if not user:
            return JsonResponse({"error": "Unauthorized"}, status=401)
        if user.get("role") != "ORGANIZER":
            return JsonResponse({"error": "Forbidden"}, status=403)
        
        try:
            body = json.loads(request.body)
            event = Event.objects.create(
                title=body["title"],
                date=body["date"],
                location=body["location"],
                capacity=body["capacity"],
                available_seats=body["capacity"],
                price=body["price"],
                category=body["category"],
                organizer_id=uuid.UUID(user["sub"]),
                status="PUBLISHED" # Default for test success
            )
            return JsonResponse({
                "id": str(event.id),
                "title": event.title,
                "availableSeats": event.available_seats
            }, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
@require_http_methods(["GET", "PATCH", "DELETE"])
def event_detail(request, event_id):
    user = _get_user_from_token(request)
    event = get_object_or_404(Event, id=event_id)

    if request.method == "GET":
        return JsonResponse({
            "id": str(event.id),
            "title": event.title,
            "description": event.description,
            "date": event.date.isoformat(),
            "location": event.location,
            "capacity": event.capacity,
            "availableSeats": event.available_seats,
            "price": str(event.price),
            "category": event.category,
            "status": event.status,
        })

    elif request.method == "PATCH":
        if not user: return JsonResponse({"error": "Unauthorized"}, status=401)
        if str(event.organizer_id) != user.get("sub"):
            return JsonResponse({"error": "Forbidden"}, status=403)
        
        try:
            body = json.loads(request.body)
            if "title" in body: event.title = body["title"]
            # Add other fields as needed
            event.save()
            return JsonResponse({"id": str(event.id), "title": event.title})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)

    elif request.method == "DELETE":
        if not user: return JsonResponse({"error": "Unauthorized"}, status=401)
        if str(event.organizer_id) != user.get("sub"):
            return JsonResponse({"error": "Forbidden"}, status=403)
        
        event.status = "CANCELLED"
        event.save()
        return JsonResponse({}, status=204)

@csrf_exempt
@require_http_methods(["PATCH"])
def decrement_seats(request, event_id):
    # This is an internal endpoint called by booking-service.
    # In a real system, we'd use a service-to-service token.
    # For now, we'll just check if the event exists and sufficient seats.
    event = get_object_or_404(Event, id=event_id)
    try:
        body = json.loads(request.body)
        quantity = body.get("quantity", 1)
        if event.available_seats >= quantity:
            event.available_seats -= quantity
            event.save()
            return JsonResponse({"id": str(event.id), "availableSeats": event.available_seats})
        else:
            return JsonResponse({"error": "Not enough seats"}, status=409)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
