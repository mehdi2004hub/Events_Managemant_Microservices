import jwt
import datetime
from django.conf import settings

ACCESS_TOKEN_LIFETIME  = datetime.timedelta(minutes=30)
REFRESH_TOKEN_LIFETIME = datetime.timedelta(days=7)


def generate_access_token(user) -> str:
    payload = {
        "sub":   str(user.id),
        "email": user.email,
        "role":  user.role,
        "type":  "access",
        "exp":   datetime.datetime.utcnow() + ACCESS_TOKEN_LIFETIME,
        "iat":   datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def generate_refresh_token(user) -> str:
    payload = {
        "sub":  str(user.id),
        "type": "refresh",
        "exp":  datetime.datetime.utcnow() + REFRESH_TOKEN_LIFETIME,
        "iat":  datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def generate_tokens(user) -> dict:
    return {
        "access":  generate_access_token(user),
        "refresh": generate_refresh_token(user),
    }


def decode_token(token: str, expected_type: str = "access") -> dict:
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError(f"Expected token type '{expected_type}'")
    return payload


def get_access_payload(request) -> dict | None:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    try:
        return decode_token(header[7:], expected_type="access")
    except jwt.InvalidTokenError:
        return None
