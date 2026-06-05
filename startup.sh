#!/usr/bin/env bash
set -euo pipefail

cd /home/site/wwwroot
python -m pip install --no-cache-dir --disable-pip-version-check -r requirements.txt --target /tmp/orbit-guard-python
export PYTHONPATH="/tmp/orbit-guard-python:${PYTHONPATH:-}"
python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
