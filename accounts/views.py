import json
import re
import bcrypt
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import User
from .jwt_utils import generate_tokens, decode_token, generate_access_token

EMAIL_RE           = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_SECONDS    = 300   # 5 minutes


def health(request):
    return JsonResponse({"status": "ok", "service": "auth-service"})


def _lockout_key(email: str) -> str:
    return f"login_attempts:{email}"


def _check_lockout(email: str):
    """Retourne (attempts, locked). Utilise le cache Django (memcache/redis)."""
    try:
        from django.core.cache import cache
        attempts = cache.get(_lockout_key(email), 0)
        return attempts, attempts >= MAX_LOGIN_ATTEMPTS
    except Exception:
        return 0, False


def _increment_attempts(email: str):
    try:
        from django.core.cache import cache
        key = _lockout_key(email)
        attempts = cache.get(key, 0) + 1
        cache.set(key, attempts, LOCKOUT_SECONDS)
    except Exception:
        pass


def _reset_attempts(email: str):
    try:
        from django.core.cache import cache
        cache.delete(_lockout_key(email))
    except Exception:
        pass


@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    email      = data.get("email", "").strip().lower()
    password   = data.get("password", "")
    first_name = data.get("firstName", "").strip()
    last_name  = data.get("lastName", "").strip()
    role       = data.get("role", "CLIENT")

    # Validation
    if not all([email, password, first_name, last_name]):
        return JsonResponse({"error": "All fields are required"}, status=400)
    if not EMAIL_RE.match(email):
        return JsonResponse({"error": "Invalid email format"}, status=400)
    if len(password) < 8:
        return JsonResponse({"error": "Password must be at least 8 characters"}, status=400)
    if role not in ("CLIENT", "ORGANIZER"):
        return JsonResponse({"error": "Invalid role"}, status=400)
    if User.objects.filter(email=email).exists():
        return JsonResponse({"error": "Email already registered"}, status=409)

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user   = User.objects.create(
        email=email, password=hashed,
        first_name=first_name, last_name=last_name, role=role,
    )

    tokens = generate_tokens(user)
    return JsonResponse({
        "access":  tokens["access"],
        "refresh": tokens["refresh"],
        "user": {
            "id":        str(user.id),
            "email":     user.email,
            "firstName": user.first_name,
            "lastName":  user.last_name,
            "role":      user.role,
        },
    }, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    # Vérification anti-brute force
    attempts, locked = _check_lockout(email)
    if locked:
        return JsonResponse(
            {"error": f"Account locked. Try again in {LOCKOUT_SECONDS // 60} minutes."},
            status=429,
        )

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        _increment_attempts(email)
        return JsonResponse({"error": "Invalid credentials"}, status=401)

    if not user.is_active:
        return JsonResponse({"error": "Account disabled"}, status=401)

    if not bcrypt.checkpw(password.encode(), user.password.encode()):
        _increment_attempts(email)
        remaining = MAX_LOGIN_ATTEMPTS - attempts - 1
        msg = f"Invalid credentials. {remaining} attempt(s) left." if remaining > 0 else "Account locked."
        return JsonResponse({"error": msg}, status=401)

    _reset_attempts(email)
    tokens = generate_tokens(user)
    return JsonResponse({
        "access":  tokens["access"],
        "refresh": tokens["refresh"],
        "user": {
            "id":        str(user.id),
            "email":     user.email,
            "firstName": user.first_name,
            "lastName":  user.last_name,
            "role":      user.role,
        },
    })


@csrf_exempt
@require_http_methods(["POST"])
def refresh_token(request):
    """POST /api/auth/refresh/ — échange un refresh token contre un nouvel access token."""
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    token = data.get("refresh", "")
    if not token:
        return JsonResponse({"error": "refresh token required"}, status=400)

    try:
        payload = decode_token(token, expected_type="refresh")
        user    = User.objects.get(id=payload["sub"])
    except Exception:
        return JsonResponse({"error": "Invalid or expired refresh token"}, status=401)

    if not user.is_active:
        return JsonResponse({"error": "Account disabled"}, status=401)

    new_access = generate_access_token(user)
    return JsonResponse({"access": new_access})


@require_http_methods(["GET"])
def me(request):
    """GET /api/auth/me/ — profil de l'utilisateur connecté."""
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return JsonResponse({"error": "Unauthorized"}, status=401)
    try:
        payload = decode_token(header[7:], expected_type="access")
        user    = User.objects.get(id=payload["sub"])
    except Exception:
        return JsonResponse({"error": "Invalid or expired token"}, status=401)

    return JsonResponse({
        "id":        str(user.id),
        "email":     user.email,
        "firstName": user.first_name,
        "lastName":  user.last_name,
        "role":      user.role,
        "isActive":  user.is_active,
        "createdAt": user.created_at.isoformat(),
    })
