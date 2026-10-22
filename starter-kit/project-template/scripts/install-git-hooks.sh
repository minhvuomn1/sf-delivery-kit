#!/bin/bash
# Cài pre-push hook (.git/hooks không được git track nên mỗi máy phải chạy 1 lần).
set -e
HOOK=.git/hooks/pre-push
cat > "$HOOK" <<'EOF'
#!/bin/bash
if [ -f "./scripts/deploy-changes.sh" ]; then
  ./scripts/deploy-changes.sh
else
  echo ">>>>> ./scripts/deploy-changes.sh not found"
fi
EOF
chmod +x "$HOOK" scripts/deploy-changes.sh
echo "Đã cài $HOOK. Push lên nhánh main sẽ tự deploy lên org (xem scripts/deploy-changes.sh)."
