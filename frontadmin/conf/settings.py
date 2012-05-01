from django.conf import settings

PLUGINS = getattr(settings, 'FRONTADMIN_PLUGINS', [])
