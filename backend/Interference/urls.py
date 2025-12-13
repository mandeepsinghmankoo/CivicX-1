from django.urls import path
from . import views

urlpatterns = [
    path("classify-image/", views.classify_image),
    path("classify_image/", views.classify_image),
    path("reportIssue/", views.report_issue),
    path("start-webcam/", views.start_webcam),
    path("stop-webcam/", views.stop_webcam),
    path("previews/", views.list_previews),
    path("preview/<str:filename>", views.preview_image),
    path("latest-detection/", views.latest_detection),
]
