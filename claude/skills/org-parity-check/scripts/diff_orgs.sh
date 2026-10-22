#!/usr/bin/env bash
# Retrieve the same manifest from two orgs and report what differs.
# Usage: diff_orgs.sh <manifest.xml> <source-alias> <target-alias> [workdir]
# Run from inside an sfdx project (needs sfdx-project.json) with both orgs authenticated.
set -euo pipefail

MANIFEST="${1:?manifest path required}"
SRC="${2:?source org alias required}"
TGT="${3:?target org alias required}"
WORK="${4:-./org-diff}"

[ -f "$MANIFEST" ] || { echo "Manifest not found: $MANIFEST" >&2; exit 1; }
[ -f sfdx-project.json ] || { echo "Run inside an sfdx project (sfdx-project.json missing)" >&2; exit 1; }

rm -rf "$WORK"
mkdir -p "$WORK/$SRC" "$WORK/$TGT"

echo ">> Retrieving from $SRC ..."
sf project retrieve start --manifest "$MANIFEST" -o "$SRC" --output-dir "$WORK/$SRC" --wait 30

echo ">> Retrieving from $TGT ..."
sf project retrieve start --manifest "$MANIFEST" -o "$TGT" --output-dir "$WORK/$TGT" --wait 30

REPORT="$WORK/report.txt"
{
  echo "== Only in $SRC (candidate to deploy) =="
  diff -rq "$WORK/$SRC" "$WORK/$TGT" | grep "^Only in $WORK/$SRC" || true
  echo
  echo "== Only in $TGT (do NOT delete blindly) =="
  diff -rq "$WORK/$SRC" "$WORK/$TGT" | grep "^Only in $WORK/$TGT" || true
  echo
  echo "== Differs (review each) =="
  diff -rq "$WORK/$SRC" "$WORK/$TGT" | grep "^Files " || true
} > "$REPORT"

echo ">> Report written to $REPORT"
echo ">> Inspect a file diff with: diff -u $WORK/$SRC/<path> $WORK/$TGT/<path>"
