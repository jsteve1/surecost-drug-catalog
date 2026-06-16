#!/bin/sh
set -e

echo "Waiting for database..."
python <<'PY'
import os
import sys
import time

import django
from django.db import connection
from django.db.utils import OperationalError

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

for attempt in range(30):
    try:
        connection.ensure_connection()
        break
    except OperationalError:
        time.sleep(1)
else:
    sys.exit("Database unavailable after 30 seconds")
PY

echo "Running migrations..."
python manage.py migrate --noinput

if [ "${LOAD_SEED:-true}" = "true" ]; then
  echo "Loading seed data..."
  python manage.py load_seed --file "${SEED_FILE_PATH:-/app/seed_drugs.json}"
fi

echo "Starting gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2
