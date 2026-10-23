# Nâng cấp dự án lên kit mới
Từ v1.10.0 dùng lệnh `sf-kit upgrade`:
1. Trong thư mục dự án: `node <đường-dẫn-kit>/bin/sf-kit.mjs upgrade --pull --dry-run` để xem trước, rồi bỏ `--dry-run` để áp dụng. `--pull` chạy `git pull --ff-only` trong thư mục kit trước (bỏ cờ này nếu bạn đã tự pull; lệnh không tự pull nếu thiếu cờ).
2. Lệnh ghi đè file của kit (skill-catalog, skill đang bật, agents, commands, `.claude/kit/`), bản cũ lưu ở `.claude/.upgrade-backup/<thời-gian>/`. Skill `project-*` và file chỉ có ở dự án được giữ nguyên.
3. `CLAUDE.md` được gộp 3 chiều (bản kit lần trước lưu ở `.claude/kit/CLAUDE.base.md` + CLAUDE.md của dự án + bản kit mới): không xung đột thì ghi thẳng (bản cũ ở backup); có xung đột thì ghi `CLAUDE.md.new` có dấu `<<<<<<<` để bạn xử lý. Lần nâng cấp đầu chưa có base thì chỉ thêm các dòng mới của kit vào cuối file, cần rà lại. `.claude/settings.json` (và `docs/mockup.md`) không bị ghi đè, lệnh ghi bản `.new` để gộp tay rồi xóa `.new`.
4. Lệnh in các mục CHANGELOG từ `.kit-version` của dự án đến bản mới và cập nhật `.kit-version`. Chạy `/review` + CI, rà `git diff` rồi commit.

Bản trước v1.10.0 (thủ công): diff `.claude/skill-catalog`, `.claude/skills`, `.claude/agents`, `.claude/commands`, `.claude/kit` với kit, giữ `project-*`, sửa tay `CLAUDE.md`, cập nhật `.kit-version`.
