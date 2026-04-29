import json
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, MagicMock
from django.test import TestCase, Client
import jwt
from django.conf import settings

from bookings.models import Booking


def make_token(role="CLIENT"):
    uid = str(uuid.uuid4())
    payload = {
        "sub":   uid,
        "email": "client@test.dz",
        "role":  role,
        "type":  "access",
        "exp":   datetime.now(tz=timezone.utc) + timedelta(minutes=30),
    }
    return uid, jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


MOCK_EVENT = {
    "id":             str(uuid.uuid4()),
    "title":          "Festival Test",
    "date":           "2025-12-01T19:00:00+00:00",
    "location":       "Alger",
    "capacity":       100,
    "availableSeats": 50,
    "price":          "1500.00",
    "status":         "PUBLISHED",
}


class BookingCreateTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.url    = "/api/bookings/"
        self.uid, self.token = make_token()

    @patch("bookings.views.requests.get")
    @patch("bookings.views.requests.patch")
    @patch("bookings.views.publish")
    def test_booking_success(self, mock_publish, mock_patch, mock_get):
        # Simuler la réponse de l'event-service
        mock_resp        = MagicMock()
        mock_resp.ok     = True
        mock_resp.status_code = 200
        mock_resp.json.return_value = MOCK_EVENT
        mock_get.return_value  = mock_resp

        mock_patch_resp        = MagicMock()
        mock_patch_resp.ok     = True
        mock_patch.return_value = mock_patch_resp

        res = self.client.post(self.url, json.dumps({
            "eventId":  MOCK_EVENT["id"],
            "quantity": 2,
        }), content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["quantity"], 2)
        self.assertEqual(data["status"], "CONFIRMED")
        self.assertEqual(str(data["totalPrice"]), "3000.00")

        # Vérifier que les messages RabbitMQ ont été publiés
        self.assertEqual(mock_publish.call_count, 2)
        queues = [call[0][0] for call in mock_publish.call_args_list]
        self.assertIn("ticket.generate", queues)
        self.assertIn("email.send", queues)

    @patch("bookings.views.requests.get")
    def test_booking_not_enough_seats(self, mock_get):
        event = dict(MOCK_EVENT, availableSeats=1)
        mock_resp        = MagicMock()
        mock_resp.ok     = True
        mock_resp.status_code = 200
        mock_resp.json.return_value = event
        mock_get.return_value = mock_resp

        res = self.client.post(self.url, json.dumps({
            "eventId":  event["id"],
            "quantity": 5,      # > 1 disponible
        }), content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(res.status_code, 409)
        self.assertIn("seats", res.json()["error"].lower())

    @patch("bookings.views.requests.get")
    def test_booking_event_not_found(self, mock_get):
        mock_resp        = MagicMock()
        mock_resp.ok     = False
        mock_resp.status_code = 404
        mock_get.return_value = mock_resp

        res = self.client.post(self.url, json.dumps({
            "eventId": str(uuid.uuid4()), "quantity": 1,
        }), content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}")

        self.assertEqual(res.status_code, 404)

    def test_booking_no_auth(self):
        res = self.client.post(self.url, json.dumps({
            "eventId": str(uuid.uuid4()), "quantity": 1,
        }), content_type="application/json")
        self.assertEqual(res.status_code, 401)

    def test_booking_missing_event_id(self):
        res = self.client.post(self.url, json.dumps({"quantity": 1}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(res.status_code, 400)


class MyBookingsTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.uid, self.token = make_token()
        # Créer 2 réservations pour cet utilisateur
        for i in range(2):
            Booking.objects.create(
                event_id=uuid.uuid4(), user_id=self.uid,
                quantity=1, total_price=1500, status="CONFIRMED",
            )
        # Réservation d'un autre utilisateur
        Booking.objects.create(
            event_id=uuid.uuid4(), user_id=uuid.uuid4(),
            quantity=1, total_price=500, status="CONFIRMED",
        )

    def test_my_bookings_returns_only_mine(self):
        res = self.client.get("/api/bookings/me/",
            HTTP_AUTHORIZATION=f"Bearer {self.token}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data), 2)   # seulement les miennes

    def test_my_bookings_no_auth(self):
        res = self.client.get("/api/bookings/me/")
        self.assertEqual(res.status_code, 401)
