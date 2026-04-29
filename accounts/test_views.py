import json
import bcrypt
import uuid
from django.test import TestCase, Client

from accounts.models import User
from accounts.jwt_utils import generate_tokens, decode_token


def make_user(email="test@billetix.dz", password="password123", role="CLIENT"):
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    return User.objects.create(
        email=email, password=hashed,
        first_name="Test", last_name="User", role=role,
    )


class RegisterViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.url    = "/api/auth/register/"

    def test_register_success(self):
        res = self.client.post(self.url, json.dumps({
            "email": "ali@test.dz", "password": "password123",
            "firstName": "Ali", "lastName": "Bey", "role": "CLIENT",
        }), content_type="application/json")
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertIn("access", data)
        self.assertIn("refresh", data)
        self.assertEqual(data["user"]["email"], "ali@test.dz")

    def test_register_duplicate_email(self):
        make_user()
        res = self.client.post(self.url, json.dumps({
            "email": "test@billetix.dz", "password": "password123",
            "firstName": "A", "lastName": "B", "role": "CLIENT",
        }), content_type="application/json")
        self.assertEqual(res.status_code, 409)

    def test_register_short_password(self):
        res = self.client.post(self.url, json.dumps({
            "email": "x@test.dz", "password": "short",
            "firstName": "A", "lastName": "B", "role": "CLIENT",
        }), content_type="application/json")
        self.assertEqual(res.status_code, 400)

    def test_register_invalid_email(self):
        res = self.client.post(self.url, json.dumps({
            "email": "not-an-email", "password": "password123",
            "firstName": "A", "lastName": "B", "role": "CLIENT",
        }), content_type="application/json")
        self.assertEqual(res.status_code, 400)

    def test_register_invalid_role(self):
        res = self.client.post(self.url, json.dumps({
            "email": "z@test.dz", "password": "password123",
            "firstName": "A", "lastName": "B", "role": "SUPERADMIN",
        }), content_type="application/json")
        self.assertEqual(res.status_code, 400)


class LoginViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.url    = "/api/auth/login/"
        self.user   = make_user()

    def test_login_success(self):
        res = self.client.post(self.url, json.dumps({
            "email": "test@billetix.dz", "password": "password123",
        }), content_type="application/json")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("access", data)
        self.assertIn("refresh", data)

    def test_login_wrong_password(self):
        res = self.client.post(self.url, json.dumps({
            "email": "test@billetix.dz", "password": "wrongpass",
        }), content_type="application/json")
        self.assertEqual(res.status_code, 401)

    def test_login_unknown_email(self):
        res = self.client.post(self.url, json.dumps({
            "email": "unknown@test.dz", "password": "password123",
        }), content_type="application/json")
        self.assertEqual(res.status_code, 401)

    def test_login_disabled_account(self):
        self.user.is_active = False
        self.user.save()
        res = self.client.post(self.url, json.dumps({
            "email": "test@billetix.dz", "password": "password123",
        }), content_type="application/json")
        self.assertEqual(res.status_code, 401)


class RefreshTokenTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user   = make_user()
        self.tokens = generate_tokens(self.user)

    def test_refresh_success(self):
        res = self.client.post("/api/auth/refresh/", json.dumps({
            "refresh": self.tokens["refresh"],
        }), content_type="application/json")
        self.assertEqual(res.status_code, 200)
        self.assertIn("access", res.json())

    def test_refresh_with_access_token_fails(self):
        res = self.client.post("/api/auth/refresh/", json.dumps({
            "refresh": self.tokens["access"],   # mauvais type
        }), content_type="application/json")
        self.assertEqual(res.status_code, 401)

    def test_refresh_invalid_token(self):
        res = self.client.post("/api/auth/refresh/", json.dumps({
            "refresh": "not.a.token",
        }), content_type="application/json")
        self.assertEqual(res.status_code, 401)


class MeViewTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user   = make_user()
        self.tokens = generate_tokens(self.user)

    def test_me_authenticated(self):
        res = self.client.get("/api/auth/me/", HTTP_AUTHORIZATION=f"Bearer {self.tokens['access']}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["email"], "test@billetix.dz")
        self.assertEqual(data["role"], "CLIENT")

    def test_me_no_token(self):
        res = self.client.get("/api/auth/me/")
        self.assertEqual(res.status_code, 401)

    def test_me_with_refresh_token_fails(self):
        res = self.client.get("/api/auth/me/", HTTP_AUTHORIZATION=f"Bearer {self.tokens['refresh']}")
        self.assertEqual(res.status_code, 401)
