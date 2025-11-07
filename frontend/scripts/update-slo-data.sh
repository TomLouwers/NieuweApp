#!/usr/bin/env bash
set -euo pipefail

echo "This script is a placeholder for quarterly SLO data updates."
echo "Fetch from SLO Open Data API, transform to JSON, and overwrite files in data/slo/."
echo "Environment: SLO_API_KEY must be set."

if [[ -z "${SLO_API_KEY:-}" ]]; then
  echo "SLO_API_KEY not set. Exiting." >&2
  exit 1
fi

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo "Fetching kerndoelen..."
curl -sS -H "X-API-Key: $SLO_API_KEY" \
  https://opendata.slo.nl/curriculum/api/v1/doel/ \
  > "$TMPDIR/kerndoelen.json" || true

echo "Fetching inhoudslijnen..."
curl -sS -H "X-API-Key: $SLO_API_KEY" \
  https://opendata.slo.nl/curriculum/api/v1/inhoudslijn/ \
  > "$TMPDIR/inhoudslijnen.json" || true

echo "NOTE: Add transformation steps to map API JSON to files in frontend/data/slo/."
echo "Files downloaded into: $TMPDIR"

