---
description: Dựng mockup thật (LWC + App Page + Tab trong app "Mockup") cho một hoặc nhiều màn hình
argument-hint: <SCR-xx | mô tả màn hình | template tênMànHình ["Tên hiển thị"]>
allowed-tools: Bash(node .claude/kit/kit.mjs:*), Bash(sf project deploy validate:*), Bash(sf org assign permset:*), Bash(npm run test:unit:*)
---
Dùng skill `mockup-prototype` cho: $ARGUMENTS
Làm đúng quy trình trong skill: đọc `docs/screens.md`/journey, tạo màn hình thật trong source dự án (dùng `node .claude/kit/kit.mjs mockup add ...` nếu có, không thì tạo file theo `references/metadata-templates.md`), hoàn thiện LWC và mock data, chạy test.
Sau khi tạo xong, trình bày danh sách file và lệnh deploy (chỉ sandbox), rồi CHỜ tôi xác nhận. Chỉ chạy `validate` khi tôi đồng ý; không tự chạy `deploy start`.
