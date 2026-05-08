from django.urls import path
from .views import MeView, UserListCreateView, UserDetailView

urlpatterns = [
    path('users/me/', MeView.as_view(), name='user-me'),
    path('users/', UserListCreateView.as_view(), name='user-list'),
    path('users/<uuid:pk>/', UserDetailView.as_view(), name='user-detail'),
]
