"""
Definition of urls for MemoryLeakReportAutomation.
"""

from django.conf.urls import include, url
#from django.urls import path, re_path
#import Reports.views
from django.conf import settings
from django.conf.urls.static import static

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = [
    #url(r'^$', Reports.views.UploadFile, name='form'),
    url(r'^reports/',include('Reports.urls')),
    #path('<str:filename>',Reports.views.displayCharts),
    #path('updated-data/<str:filepath>',Reports.views.updated_weights, name = "updated-data"),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
]#+static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
