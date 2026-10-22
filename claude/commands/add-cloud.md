---
description: Thêm một cloud vào dự án đang chạy (sinh thư mục docs/<cloud>/ và bật skill kèm theo)
argument-hint: <sales-cloud|service-cloud|experience-cloud|mce|manufacturing>
allowed-tools: Bash(node .claude/kit/kit.mjs:*)
---
Chạy `node .claude/kit/kit.mjs add-cloud $ARGUMENTS`, rồi cập nhật dòng cloud trong `CLAUDE.md` và nhắc tôi commit `docs/`, `.claude/skills/`, `.claude/skills.lock.json`.
Nếu tên cloud không có profile, liệt kê profile hiện có thay vì tự tạo.
