#import re, os, locale, HTMLParser
#from decimal import *

from django import template
from django.template import RequestContext, Context
from django.core.urlresolvers import reverse
from django.utils.safestring import SafeUnicode
from webcore.contrib.frontadmin.conf import settings
from webcore.contrib.frontadmin.plugins import load_plugins
#from django.core.urlresolvers import RegexURLResolver, reverse
#from django.utils.safestring import SafeString
#from django.utils.translation import gettext as _

register = template.Library()

@register.simple_tag()
def frontadmin_bar(request):
    """
    The main frontadmin bar
    """
    t = loader.select_template([
            "frontadmin/bar.inc.html",
        ])
    return t.render(RequestContext(request, {
        'plugins': load_plugins(request),
    }))


@register.simple_tag()
def frontadmin_toolbar(request, obj):

    # Changelist admin
    if isinstance(obj, SafeUnicode):
        app_label = obj.split('.')[0].lower()
        app_model = obj.split('.')[1].lower()
        t = loader.select_template([
                "frontadmin/toolbar.inc.html",
                "frontadmin/%s/toolbar.inc.html" % app_label, 
            ])
        return t.render(RequestContext(request, {
            'app_label': app_label,
            'app_model': app_model,
            'changelist_url': reverse('admin:%s_%s_changelist' % (app_label, app_model)),
        }))
    # Object admin
    else:
        app_label = obj._meta.app_label
        object_name = obj._meta.object_name.lower()
        t = loader.select_template([
                "frontadmin/toolbar.inc.html",
                "frontadmin/%s/toolbar.inc.html" % app_label, 
                "frontadmin/%s/%s/toolbar.inc.html" % (app_label, object_name),
            ])
        return t.render(RequestContext(request, {
            'app_label': app_label,
            'object_name': object_name,
            'object': obj,
            'delete_url': reverse('admin:%s_%s_delete' % (app_label, object_name), args=(obj.id,)),
            'change_url': reverse('admin:%s_%s_change' % (app_label, object_name), args=(obj.id,)),
            'history_url': reverse('admin:%s_%s_history' % (app_label, object_name), args=(obj.id,)),
        }))



from django.template import loader, Context

@register.tag(name='frontadmin')
def render_frontadmin(parser, token):
    try:
        tag_name, request, obj = token.contents.split(None, 2)
    except ValueError:
        raise template.TemplateSyntaxError("'frontadmin' node requires a request and a object variables")
    nodelist = parser.parse(('endfrontadmin',))
    parser.delete_first_token()
    return CaptureasNode(nodelist, request, obj)

class CaptureasNode(template.Node):
    def __init__(self, nodelist, request, obj):
        self.nodelist = nodelist
        self.obj = template.Variable(obj)
        self.request = template.Variable(request)

    def _has_perm(self, request, var):
        if not request.user:
            return False
        elif not request.user.is_authenticated():
            return False
        elif isinstance(var, SafeUnicode):
            app = var.split('.')[0].lower()
            model = var.split('.')[1].lower()
            return request.user.has_perm("%s.add_%s" % (app, model)) and \
                   request.user.has_perm("%s.change_%s" % (app, model)) and \
                   request.user.has_perm("%s.delete_%s" % (app, model))
        else:
            app = var._meta.app_label.lower()
            model = var._meta.object_name.lower().lower()
            return request.user.has_perm("%s.add_%s" % (app, model)) and \
                   request.user.has_perm("%s.change_%s" % (app, model)) and \
                   request.user.has_perm("%s.delete_%s" % (app, model))

    def render(self, context):
        var = self.obj.resolve(context)
        request = self.request.resolve(context)
        output = self.nodelist.render(context)

        if not self._has_perm(request, var):
            return output

        if isinstance(var, SafeUnicode):
            css_class = var.replace('.', '-').lower()
        else:
            css_class = '%s-%s-%s' % (var._meta.app_label, var._meta.object_name.lower(), var.pk)

        return """
        <div id="frontadmin-%s" class="frontadmin-block">
            %s<div class="frontadmin-block-content">%s</div>
        </div>""" % (css_class,
                frontadmin_toolbar(request, var),
                output,)
