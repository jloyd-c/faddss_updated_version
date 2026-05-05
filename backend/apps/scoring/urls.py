from django.urls import path
from .views import RankingView, ResidentScoreView

urlpatterns = [
    path('scoring/rank/', RankingView.as_view(), name='scoring-rank'),
    path('scoring/my-score/', ResidentScoreView.as_view(), name='scoring-my-score'),
]
