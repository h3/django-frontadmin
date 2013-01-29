django-frontadmin
=================

A django-application to bring frontend administration to django.

It adds a main toolbar with useful shortcuts (user account, admin, logout) which can be toggled.

It also allow to show object and list toolbar for editing, history and direct admin link.

Installation
------------

In your `settings.py` Add `frontadmin` to your `INSTALLED_APPS`.


Displaying the main toolbar
---------------------------

To display the main toolbar you only need to add this code to your main template (ex: `base.html`).

In the `<head>` of your page you can include the required js/css using an include like this:

.. code-block:: django

    {% if user.is_authenticated and user.is_staff %}
    {% include "frontadmin/frontadmin.inc.html" %}
    {% endif %}

Then call the `frontadmin_bar` within the `<body>` tag with the `request` as sole parameter:

.. code-block:: django

    {% load frontadmin_tags %}
    {% frontadmin_bar request %}


Displaying toolbar for objects
------------------------------

To display an edit toolbar for single object, simply do this:

.. code-block:: django

    {% load frontadmin_tags %}

    {% frontadmin request object %}
    {{ object }}
    {% endfrontadmin %}

This works pretty well with block applications like django-generic-flatblocks:

.. code-block:: django

    {% load generic_flatblocks frontadmin_tags markup %}

    {% gblock "home-intro" for "gblocks.Text" into "home_intro" %}
    {% frontadmin request home_intro %}
    {{ home_intro.text|textile }}
    {% endfrontadmin %}


Displaying toolbar for object lists
-----------------------------------

Displaying the toolbar for object lists works in a similar way, except that we provide a `app.Model` path instead of a object:

.. code-block:: django

    {% load frontadmin_tags %}

    {% frontadmin request "inventory.Product" %}
    {% for product in product_list %}
    <h1>{{ product.title }}</h1>
    <p>{{ product.description }}</p>
    {% endfor %}
    {% endfrontadmin %}


Screenshots
===========

Screenshot of toolbars. When logged in the toolbars appears over editable blocks. The main toolbar can be hidden, which hides all other toolbars as well:

.. figure:: http://i.imgur.com/UTtisxQ.png
    :figwidth: image

When the "Admin" button is clicked on a toolbar, it takes the user to the admin page. When he clicks "Edit" it opens the edit form within an overlay:

.. figure:: http://i.imgur.com/o0FMiWe.png
    :figwidth: image


Credits
=======

This project was created and is sponsored by:

.. figure:: http://motion-m.ca/media/img/logo.png
    :figwidth: image

Motion Média (http://motion-m.ca)
