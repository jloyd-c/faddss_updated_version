from django.urls import path
from .views import MeView, UserListCreateView, UserDetailView, UserPasswordResetView

urlpatterns = [
    path('users/me/', MeView.as_view(), name='user-me'),
    path('users/', UserListCreateView.as_view(), name='user-list'),
    path('users/<uuid:pk>/password/', UserPasswordResetView.as_view(), name='user-password-reset'),
    path('users/<uuid:pk>/', UserDetailView.as_view(), name='user-detail'),
]
