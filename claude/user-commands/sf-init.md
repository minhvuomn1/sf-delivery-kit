---
description: Thêm sf-delivery-kit vào dự án Salesforce hiện tại (chạy một lần cho mỗi dự án)
argument-hint: [--clouds sales-cloud,mce,...] [--all-skills] [--detect]
allowed-tools: Bash(node {{KIT}}/bin/sf-kit.mjs:*)
---
Chạy trong thư mục dự án hiện tại: `node {{KIT}}/bin/sf-kit.mjs init $ARGUMENTS`

Trước khi chạy: kiểm tra thư mục hiện tại có `sfdx-project.json`; nếu không có, nói rõ và hỏi tôi có chắc muốn chạy ở đây không. Lệnh không ghi đè file đã có.
Sau khi chạy: tóm tắt ngắn kit đã thêm gì (`.claude/`, `docs/`, `CLAUDE.md`, `.mcp.json`), skill nào đã bật, rồi hướng dẫn bước tiếp theo: bỏ BRD/FSD vào `docs/brd`, `docs/fsd`, rồi dùng `/setup-skills`; mockup dùng `/mockup`. Nhắc rằng các lệnh mới (/setup-skills, /mockup...) có thể cần mở lại phiên Claude Code mới thấy.
