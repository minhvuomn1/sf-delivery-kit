#!/bin/bash
# Pre-push hook: khi push lên nhánh DEPLOY_BRANCH (mặc định main) thì tự deploy phần force-app thay đổi lên org.
# Lấy từ dự án DongTienPaper (deploy-changes-vu.sh), đã tổng quát hóa.
# Nếu deploy fail thì push bị chặn.
#
# Cấu hình: .env.salesforce (không commit; mẫu ở .env.salesforce.example)
#   SALESFORCE_CONSUMER_KEY, SALESFORCE_JWT_KEY_FILE, SALESFORCE_USERNAME, SALESFORCE_INSTANCE_URL
# Tùy chọn: DEPLOY_BRANCH (main), SF_API_VERSION (đọc từ sfdx-project.json nếu không đặt)

echo ">>>>> Running pre-push hook for Salesforce deployment..."

DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
current_branch=$(git rev-parse --abbrev-ref HEAD)

if [ "$current_branch" != "$DEPLOY_BRANCH" ]; then
  echo ">>>>> Branch '$current_branch' — not deploy."
  exit 0
fi

mkdir -p manifest

# git truyền "local_ref local_sha remote_ref remote_sha" qua stdin
read local_ref local_sha remote_ref remote_sha
if [ "$remote_sha" = "0000000000000000000000000000000000000000" ]; then
  RANGE="$local_sha"
else
  RANGE="$remote_sha..$local_sha"
fi
CHANGED_FILES=$(git diff --name-only $RANGE | grep '^force-app' || true)

# Bỏ file đã bị xóa (không còn trên disk) để tránh lỗi "was not found in zipped directory".
# Xóa component khỏi org là việc riêng, cần destructiveChanges, không tự động ở đây.
CHANGED_FILES=$(echo "$CHANGED_FILES" | while read -r file; do
  [ -f "$file" ] && echo "$file"
done)

if [ -z "$CHANGED_FILES" ]; then
  echo ">>>>> No Salesforce files changed. Skipping deployment."
  exit 0
fi

API_VERSION="${SF_API_VERSION:-$(grep -oE '"sourceApiVersion"[^"]*"[0-9.]+"' sfdx-project.json | grep -oE '[0-9]+\.[0-9]+')}"
API_VERSION="${API_VERSION:-62.0}"

PACKAGE=manifest/changed-package.xml
echo '<?xml version="1.0" encoding="UTF-8"?>' > $PACKAGE
echo '<Package xmlns="http://soap.sforce.com/2006/04/metadata">' >> $PACKAGE

echo "$CHANGED_FILES" | grep '^force-app/.*/classes/.*\.cls$' | while read file; do
  echo "  <types><members>$(basename "$file" .cls)</members><name>ApexClass</name></types>" >> $PACKAGE
done
echo "$CHANGED_FILES" | grep '^force-app/.*/triggers/.*\.trigger$' | while read file; do
  echo "  <types><members>$(basename "$file" .trigger)</members><name>ApexTrigger</name></types>" >> $PACKAGE
done
echo "$CHANGED_FILES" | grep '^force-app/.*/lwc/' | awk -F/ '{print $(NF-1)}' | sort -u | while read n; do
  echo "  <types><members>$n</members><name>LightningComponentBundle</name></types>" >> $PACKAGE
done
echo "$CHANGED_FILES" | grep '^force-app/.*/aura/' | awk -F/ '{print $(NF-1)}' | sort -u | while read n; do
  echo "  <types><members>$n</members><name>AuraDefinitionBundle</name></types>" >> $PACKAGE
done
echo "$CHANGED_FILES" | grep '^force-app/.*/pages/.*\.page$' | while read file; do
  echo "  <types><members>$(basename "$file" .page)</members><name>ApexPage</name></types>" >> $PACKAGE
done

echo "  <version>$API_VERSION</version>" >> $PACKAGE
echo '</Package>' >> $PACKAGE

echo "Generated $PACKAGE"
cat $PACKAGE

if [ -f ".env.salesforce" ]; then
  export $(grep -v '^#' .env.salesforce | xargs)
else
  echo ">>>>> File .env.salesforce not found. Skip deploy (push vẫn tiếp tục)."
  exit 0
fi

sf org login jwt \
  --client-id "$SALESFORCE_CONSUMER_KEY" \
  --jwt-key-file "$SALESFORCE_JWT_KEY_FILE" \
  --username "$SALESFORCE_USERNAME" \
  --instance-url "$SALESFORCE_INSTANCE_URL" \
  --set-default

echo "Deploying to Salesforce org..."
DEPLOY_OUTPUT=$(sf project deploy start --manifest $PACKAGE --wait 10 --ignore-errors --json)
echo "$DEPLOY_OUTPUT" | grep -E '"fullName":|"componentType":|"problem":|"success"'

if echo "$DEPLOY_OUTPUT" | grep -q '"status": 0'; then
  echo "****************************************"
  echo "*  Deploy success. Continue pushing... *"
  echo "****************************************"
  exit 0
else
  echo "****************************************"
  echo "*     Deploy failed. Push aborted!     *"
  echo "****************************************"
  exit 1
fi
