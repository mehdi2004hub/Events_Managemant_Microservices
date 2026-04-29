from django.urls import path
from accounts import views

urlpatterns = [
    path('api/auth/health/', views.health),
    path('api/auth/register/', views.register),
    path('api/auth/login/', views.login_view),
    path('api/auth/refresh/', views.refresh_token),
    path('api/auth/me/', views.me),
]
