import logging

from django.http import JsonResponse
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        field_errors = {}
        detail = response.data

        if isinstance(exc, ValidationError):
            if isinstance(exc.detail, dict):
                field_errors = {
                    key: value if isinstance(value, list) else [str(value)]
                    for key, value in exc.detail.items()
                }
                detail = "Validation failed."
            else:
                detail = (
                    exc.detail[0]
                    if isinstance(exc.detail, list)
                    else str(exc.detail)
                )

        response.data = {
            "error": _error_code(exc, response.status_code),
            "detail": detail,
            "field_errors": field_errors,
        }
        return response

    logger.exception("Unhandled exception", exc_info=exc)
    return Response(
        {
            "error": "server_error",
            "detail": "An unexpected error occurred.",
            "field_errors": {},
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def _error_code(exc, status_code: int) -> str:
    if isinstance(exc, ValidationError):
        return "validation_error"
    if status_code == status.HTTP_404_NOT_FOUND:
        return "not_found"
    if isinstance(exc, APIException):
        return getattr(exc, "default_code", "api_error")
    return "server_error"


def health_check(request):
    return JsonResponse({"status": "ok"})
