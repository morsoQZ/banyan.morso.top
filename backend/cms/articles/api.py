from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from rest_framework.permissions import AllowAny
from rest_framework.renderers import JSONRenderer
from wagtail.api.v2.router import WagtailAPIRouter
from wagtail.api.v2.views import PagesAPIViewSet

from .models import ArticlePage


@method_decorator(never_cache, name="dispatch")
class ArticlesAPIViewSet(PagesAPIViewSet):
    model = ArticlePage
    renderer_classes = [JSONRenderer]
    authentication_classes = []
    permission_classes = [AllowAny]
    http_method_names = ["get", "head", "options"]

    known_query_parameters = (
        PagesAPIViewSet.known_query_parameters - {"type"}
    )

    listing_default_fields = PagesAPIViewSet.listing_default_fields + [
        "summary",
        "cover",
        "cover_alt",
        "last_published_at",
    ]

    detail_only_fields = PagesAPIViewSet.detail_only_fields + ["body"]

    def get_queryset(self):
        public_pages = self.get_base_queryset()

        return (
            ArticlePage.objects.live()
            .public()
            .filter(pk__in=public_pages.values("pk"))
            .select_related("cover_image")
            .order_by("-first_published_at", "-id")
        )


api_router = WagtailAPIRouter("banyan_api")
api_router.register_endpoint("articles", ArticlesAPIViewSet)