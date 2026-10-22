#!/usr/bin/env bash
# Dùng: ./bootstrap.sh <tên-dự-án> [thư-mục-đích] [--clouds sales-cloud,mce,manufacturing] [--all-skills]
#   --clouds      cloud đã biết trước: sinh docs/<cloud>/ và bật skill kèm theo (không biết thì bỏ qua, chạy /setup-skills sau)
#   --all-skills  bật toàn bộ skill (hành vi cũ của kit <= v1.3)
set -euo pipefail

POS=(); CLOUDS=""; ALL=""
while [ $# -gt 0 ]; do
  case "$1" in
    --clouds)     CLOUDS="${2:?--clouds cần giá trị, ví dụ sales-cloud,mce}"; shift 2 ;;
    --clouds=*)   CLOUDS="${1#*=}"; shift ;;
    --all-skills) ALL="--all"; shift ;;
    *)            POS+=("$1"); shift ;;
  esac
done
NAME="${POS[0]:?Thiếu tên dự án}"
DEST="${POS[1]:-../$NAME}"
KIT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(grep -m1 -oE 'v[0-9]+\.[0-9]+\.[0-9]+' "$KIT/CHANGELOG.md" || echo v0.0.0)"

command -v node >/dev/null || { echo "Cần Node.js (>=18) để bật skill/cloud."; exit 1; }
echo ">> Tạo dự án $NAME tại $DEST (kit $VERSION)${CLOUDS:+, cloud: $CLOUDS}"
mkdir -p "$DEST"
cp -r "$KIT/starter-kit/project-template/." "$DEST/"

# Claude Code: toàn bộ skill vào catalog (chưa bật); kit.mjs bật core + skill theo cloud
mkdir -p "$DEST/.claude/kit"
cp -r "$KIT/claude/skills"   "$DEST/.claude/skill-catalog"
mkdir -p "$DEST/.claude/skills"
cp -r "$KIT/claude/commands" "$DEST/.claude/commands"
cp -r "$KIT/claude/agents"   "$DEST/.claude/agents"
cp "$KIT/claude/settings.template.json" "$DEST/.claude/settings.json"
cp "$KIT/claude/kit/kit.mjs"            "$DEST/.claude/kit/kit.mjs"
cp "$KIT/claude/skill-registry.json"    "$DEST/.claude/kit/skill-registry.json"
cp -r "$KIT/cloud-profiles"             "$DEST/.claude/kit/cloud-profiles"
sed -e "s/{{ORG_ALIAS}}/$NAME/g" -e "s#{{JIRA_URL}}#${JIRA_URL:-https://your-company.atlassian.net}#g" -e "s/{{JIRA_USERNAME}}/${JIRA_USERNAME:-you@company.com}/g" "$KIT/claude/mcp.template.json" > "$DEST/.mcp.json"
sed "s/{{TÊN_DỰ_ÁN}}/$NAME/g" "$KIT/claude/CLAUDE.template.md" > "$DEST/CLAUDE.md"

# Project context (docs: brd, fsd, uat, journeys, ADR, traceability...)
cp -r "$KIT/project-context-template" "$DEST/docs"
mkdir -p "$DEST/docs/notes"
cp "$KIT/claude/mcp/README.md" "$DEST/docs/mcp-setup.md"

# Prototype: LWC template + kịch bản demo
mkdir -p "$DEST/prototype"
cp -r "$KIT/mockup-kit/lwc-templates" "$DEST/prototype/lwc"
rm -f "$DEST/prototype/lwc/README.md"
cp "$KIT/mockup-kit/demo-script-template.md" "$DEST/prototype/demo-script.md"

echo "$VERSION" > "$DEST/.kit-version"
( cd "$DEST" && node .claude/kit/kit.mjs init ${CLOUDS:+--clouds "$CLOUDS"} $ALL )
cd "$DEST" && git init -q && bash scripts/install-git-hooks.sh \
  && echo ">> Tạo .env.salesforce từ .env.salesforce.example để bật auto-deploy khi push main." \
  && echo ">> Xong. Việc tiếp theo: 'npm install', bỏ BRD/FSD vào docs/brd, docs/fsd (hoặc nối NotebookLM), rồi chạy '/setup-skills' trong Claude Code."
