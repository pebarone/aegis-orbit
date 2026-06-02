#!/usr/bin/env bash
set -euo pipefail

python -m pip install --no-cache-dir --disable-pip-version-check -r requirements.txt --target /tmp/aegis-python
export PYTHONPATH="/tmp/aegis-python:${PYTHONPATH:-}"
python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
