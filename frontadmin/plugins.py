

class PluginBase(object):
    button_template = '<a id="%(id)s" href="%(url)s" title="%(title)s" class="button %(classname)s" target="%(target)s">%(label)s</a>'

    def __init__(self, request):
        self.request = request

    def button(self, **kwargs):
        ctx = {
            'target': '_parent',
            'title': '',
            'id': '',
            'classname': '',
        }
        ctx.update(kwargs)
        return self.button_template % ctx
        
