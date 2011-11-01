import urlparse
from django import template
register = template.Library()


from django.forms.widgets import CheckboxInput

@register.inclusion_tag("templates/_form_field.html")
def smart_field_render(field):
    """
    Renders a form field in different label / input orders
    depending if it's a checkbox or not.
    Also knows to only output the help text paragraph if
    it exists on the field

    Usage:
    {% load form_helpers %}

    {% smart_field_render form.my_field %}'
    """
    widget_class = field.widget.__class__
    print widget_class
    widget_types = {
        CheckboxInput : 'checkbox'
    }
    widget_type= widget_types.get(widget_class, "")
    return {
        "field": field,
        "widget_type": widget_type
    }
