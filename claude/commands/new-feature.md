---
description: Bắt đầu làm một ticket Jira từ đầu đến PR
argument-hint: <JIRA-KEY>
---
Dùng skill `jira-to-code-workflow` cho ticket $ARGUMENTS:
đọc ticket + acceptance criteria (giao cho sub-agent `jira-reader`), phân tích impact, tạo branch `feature/$ARGUMENTS-<mo-ta>`,
đề xuất kế hoạch và CHỜ tôi xác nhận trước khi code.
