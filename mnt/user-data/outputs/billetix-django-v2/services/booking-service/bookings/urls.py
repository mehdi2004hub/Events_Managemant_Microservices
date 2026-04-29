from django.urls import path
from . import views

urlpatterns = [
    path('', views.booking_create),
    path('health/', views.health),
    path('me/', views.my_bookings),
]
