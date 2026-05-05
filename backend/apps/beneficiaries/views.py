from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Beneficiary, BeneficiaryIndicator
from .serializers import BeneficiarySerializer, BeneficiaryIndicatorWriteSerializer
from apps.users.permissions import IsAdminOrOfficial


class BeneficiaryListCreateView(generics.ListCreateAPIView):
    serializer_class = BeneficiarySerializer
    permission_classes = [IsAuthenticated, IsAdminOrOfficial]

    def get_queryset(self):
        qs = Beneficiary.objects.select_related('encoded_by').prefetch_related('indicators')
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(full_name__icontains=search)
        return qs.order_by('full_name')


class BeneficiaryDetailView(generics.RetrieveUpdateAPIView):
    queryset = Beneficiary.objects.prefetch_related('indicators')
    serializer_class = BeneficiarySerializer
    permission_classes = [IsAuthenticated, IsAdminOrOfficial]


class BeneficiaryIndicatorView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrOfficial]

    def post(self, request, pk):
        beneficiary = get_object_or_404(Beneficiary, pk=pk)
        serializer = BeneficiaryIndicatorWriteSerializer(
            data=request.data,
            context={'request': request, 'beneficiary': beneficiary},
        )
        serializer.is_valid(raise_exception=True)
        indicator = serializer.save()
        return Response(
            BeneficiaryIndicatorWriteSerializer(indicator).data,
            status=status.HTTP_201_CREATED,
        )
