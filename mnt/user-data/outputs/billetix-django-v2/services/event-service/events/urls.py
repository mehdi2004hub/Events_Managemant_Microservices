from django.urls import path
from . import views

urlpatterns = [
    path('', views.event_list_create),
    path('health/', views.health),
    path('<uuid:event_id>/', views.event_detail),
]
