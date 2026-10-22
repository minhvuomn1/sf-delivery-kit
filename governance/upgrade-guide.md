# Nâng cấp dự án lên kit mới
1. Đọc `.kit-version` của dự án và `CHANGELOG.md` của kit.
2. Diff `.claude/skills` dự án với kit; giữ lại skill `project-*`.
3. Áp dụng thay đổi, chạy `/review` + CI, cập nhật `.kit-version`.
4. Từ v1.4.0: skill kit nằm ở `.claude/skill-catalog/`, skill đang bật ở `.claude/skills/`. Nâng cấp = cập nhật catalog + `.claude/kit/`, rồi với mỗi skill đã bật (xem `.claude/skills.lock.json`) diff và copy lại; giữ `project-*`.
