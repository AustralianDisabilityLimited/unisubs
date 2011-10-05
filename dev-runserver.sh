#!/bin/bash

if test "x$1" = "xplus"; then
    python manage.py runserver_plus 0.0.0.0:8000 --settings=dev_settings
else
    python manage.py runserver 0.0.0.0:8000 --settings=dev_settings
fi
