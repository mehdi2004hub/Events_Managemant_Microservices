import json
import uuid
from datetime import datetime, timedelta, timezone
from django.test import TestCase, Client
import jwt
from django.conf import settings

from events.models import Event


def make_token(user_id=None, role="ORGANIZER"):
    uid = user_id or str(uuid.uuid4())
    payload = {
        "sub":   uid,
        "email": "organizer@test.dz",
        "role":  role,
        "type":  "access",
        "exp":   datetime.now(tz=timezone.utc) + timedelta(minutes=30),
    }
    return uid, jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def make_event(organizer_id=None, status="PUBLISHED", capacity=100):
    return Event.objects.create(
        title="Festival Test",
        description="Un beau festival",
        date=datetime.now(tz=timezone.utc) + timedelta(days=30),
        location="Alger",
        capacity=capacity,
        available_seats=capacity,
        price=1500,
        category="Musique",
        status=status,
        organizer_id=organizer_id or uuid.uuid4(),
    )


class EventListTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.url    = "/api/events/"

    def test_list_published_events_public(self):
        make_event(status="PUBLISHED")
        make_event(status="DRAFT")
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data), 1)        # seulement le PUBLISHED
        self.assertEqual(data[0]["status"], "PUBLISHED")

    def test_create_event_as_organizer(self):
        uid, token = make_token(role="ORGANIZER")
        res = self.client.post(self.url, json.dumps({
            "title":    "Concert Rock",
            "date":     (datetime.now(tz=timezone.utc) + timedelta(days=10)).isoformat(),
            "location": "Oran",
            "capacity": 200,
            "price":    2000,
            "category": "Musique",
        }), content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()["title"], "Concert Rock")
        self.assertEqual(res.json()["availableSeats"], 200)

    def test_create_event_as_client_forbidden(self):
        _, token = make_token(role="CLIENT")
        res = self.client.post(self.url, json.dumps({
            "title": "X", "date": "2025-12-01T19:00:00Z",
            "location": "Y", "capacity": 10, "price": 0,
        }), content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 403)

    def test_create_event_no_auth(self):
        res = self.client.post(self.url, json.dumps({
            "title": "X", "date": "2025-12-01T19:00:00Z",
            "location": "Y", "capacity": 10, "price": 0,
        }), content_type="application/json")
        self.assertEqual(res.status_code, 401)

    def test_filter_by_category(self):
        make_event(status="PUBLISHED")
        res = self.client.get(self.url + "?category=Musique")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 1)

    def test_search_by_title(self):
        make_event(status="PUBLISHED")
        res = self.client.get(self.url + "?search=Festival")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.json()), 1)


class EventDetailTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.uid, self.token = make_token(role="ORGANIZER")
        self.event = make_event(organizer_id=uuid.UUID(self.uid))

    def test_get_event_public(self):
        res = self.client.get(f"/api/events/{self.event.id}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["title"], "Festival Test")

    def test_patch_event_as_owner(self):
        res = self.client.patch(
            f"/api/events/{self.event.id}/",
            json.dumps({"title": "Festival Modifié"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["title"], "Festival Modifié")

    def test_patch_event_as_other_organizer_forbidden(self):
        _, other_token = make_token(role="ORGANIZER")   # uid différent
        res = self.client.patch(
            f"/api/events/{self.event.id}/",
            json.dumps({"title": "Piratage"}),
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {other_token}",
        )
        self.assertEqual(res.status_code, 403)

    def test_delete_event_soft(self):
        res = self.client.delete(
            f"/api/events/{self.event.id}/",
            HTTP_AUTHORIZATION=f"Bearer {self.token}",
        )
        self.assertEqual(res.status_code, 204)
        self.event.refresh_from_db()
        self.assertEqual(self.event.status, "CANCELLED")

    def test_get_nonexistent_event(self):
        res = self.client.get(f"/api/events/{uuid.uuid4()}/")
        self.assertEqual(res.status_code, 404)
