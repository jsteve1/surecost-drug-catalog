from rest_framework import status
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .filters import DrugFilterSet
from .models import Drug
from .serializers import DrugSerializer


class DrugViewSet(ModelViewSet):
    queryset = Drug.objects.all()
    serializer_class = DrugSerializer
    filterset_class = DrugFilterSet

    def create(self, request, *args, **kwargs):
        ndc = request.data.get("ndc")
        if ndc:
            existing = Drug.objects.filter(ndc=ndc).first()
            if existing is not None:
                serializer = self.get_serializer(existing)
                return Response(serializer.data, status=status.HTTP_200_OK)

        return super().create(request, *args, **kwargs)
