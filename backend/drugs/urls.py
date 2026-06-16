from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter

from drugs.exceptions import health_check
from drugs.views import DrugViewSet

router = DefaultRouter()
router.register("drugs", DrugViewSet, basename="drug")

urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
    path("", include(router.urls)),
]
