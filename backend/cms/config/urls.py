"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from wagtail.admin import urls as wagtailadmin_urls
from wagtail.documents import urls as wagtaildocs_urls
from articles.api import api_router


urlpatterns = [
    # 保留 Django 自带的通用管理后台
    path("admin/", admin.site.urls),

    # 日常编辑、发布文章使用的 Wagtail 后台
    path("cms/", include(wagtailadmin_urls)),

    # 通过 Wagtail 提供附件下载
    path("cms-documents/", include(wagtaildocs_urls)),

    path("api/v2/", api_router.urls),
]

# 仅在本机开发模式下，由 Django 提供上传文件
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )