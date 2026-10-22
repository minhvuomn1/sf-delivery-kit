---
description: Đổi tên app Mockup hoặc kéo một số màn hình ra app riêng
argument-hint: rename "<Tên mới>"  |  split <TênApp> <màn1,màn2> ["Tên hiển thị"]
allowed-tools: Bash(node .claude/kit/kit.mjs:*)
---
Từ: $ARGUMENTS
- `rename "<Tên mới>"`: chạy `node .claude/kit/kit.mjs mockup rename --label "<Tên mới>"`.
- `split <TênApp> <màn1,màn2> ["Tên hiển thị"]`: chạy `node .claude/kit/kit.mjs mockup split <TênApp> --screens <màn1,màn2> --label "<Tên hiển thị>"`.
Nếu tôi chưa nêu rõ rename hay split, hoặc thiếu tham số, hỏi lại một câu. Sau khi chạy, tóm tắt thay đổi và lệnh deploy cần chạy (chỉ sandbox), rồi chờ tôi xác nhận trước khi deploy.
