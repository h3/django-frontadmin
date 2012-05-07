from webcore.contrib.frontadmin.conf import settings
from django.utils.importlib import import_module

class PluginBase(object):
    button_template = '<a id="%(id)s" href="%(url)s" title="%(title)s" class="button %(classname)s" target="_parent">%(label)s</a>'

    def __init__(self, request):
        self.request = request

    def button(self, **kwargs):
        return self.button_template % kwargs

def load_plugins(request):
    context = []
    for p in settings.PLUGINS:
        module = import_module(p)
        context.append(module.Plugin(request).get_context())
    return context
        
