from django.urls import path, include

urlpatterns = [
    path('api/events/', include('events.urls')),
]
