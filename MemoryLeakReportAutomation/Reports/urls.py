"""
Definition of urls for MemoryLeakReportAutomation.
"""

from django.conf.urls import include, url
#from django.urls import path, re_path
from . import views
from django.conf import settings
from django.conf.urls.static import static

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = [
    url(r'^$', views.UploadFile, name='form'),
    url(r'^(?P<filename>[^/]*)$',views.displayCharts),
    url(r'^updated-data/(?P<filepath>[^/]*)$',views.updated_weights, name = "updated-data"),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
]+static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
