from django.db import models
from wagtail.admin.panels import FieldPanel
from wagtail.fields import StreamField
from wagtail.images import get_image_model_string
from wagtail.models import Page
from wagtail.search import index

from .blocks import ArticleBodyBlock

from wagtail.api import APIField
from wagtail.images.api.fields import ImageRenditionField

from .serializers import ArticleBodySerializer

from urllib.parse import quote

from django.conf import settings


class ArticleIndexPage(Page):
    parent_page_types = ["wagtailcore.Page"]
    subpage_types = ["articles.ArticlePage"]
    max_count = 1

    def get_url_parts(self, request=None):
        parts = super().get_url_parts(request=request)

        if parts is None:
            return None

        return (
            parts[0],
            settings.FRONTEND_BASE_URL,
            "/articles",
        )

    def get_url(self, request=None, current_site=None):
        return self.get_full_url(request=request)

    class Meta:
        verbose_name = "文章目录"
        verbose_name_plural = "文章目录"


class ArticlePage(Page):
    summary = models.CharField(
        "摘要",
        max_length=300,
        help_text="用于文章列表和文章简介，不超过 300 个字符。",
    )

    cover_image = models.ForeignKey(
        get_image_model_string(),
        verbose_name="封面图",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    cover_alt = models.CharField(
        "封面替代文本",
        max_length=200,
        blank=True,
        help_text="描述封面内容；纯装饰性封面可以留空。",
    )

    body = StreamField(
        ArticleBodyBlock(),
        verbose_name="正文",
    )

    api_fields = [
        APIField("summary"),
        APIField(
            "cover",
            serializer=ImageRenditionField(
                "max-1600x1600",
                source="cover_image",
            ),
        ),
        APIField("cover_alt"),
        APIField("body", serializer=ArticleBodySerializer()),
    ]

    api_meta_fields = [
        APIField("last_published_at"),
    ]

    content_panels = Page.content_panels + [
        FieldPanel("summary"),
        FieldPanel("cover_image"),
        FieldPanel("cover_alt"),
        FieldPanel("body"),
    ]

    search_fields = Page.search_fields + [
        index.SearchField("summary"),
        index.SearchField("body"),
    ]

    parent_page_types = ["articles.ArticleIndexPage"]
    subpage_types = []

    def get_url_parts(self, request=None):
        parts = super().get_url_parts(request=request)

        if parts is None:
            return None

        return (
            parts[0],
            settings.FRONTEND_BASE_URL,
            f"/articles/{quote(self.slug, safe='')}",
        )

    def get_url(self, request=None, current_site=None):
        return self.get_full_url(request=request)

    class Meta:
        verbose_name = "文章"
        verbose_name_plural = "文章"