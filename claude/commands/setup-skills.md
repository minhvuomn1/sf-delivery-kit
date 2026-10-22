---
description: Đọc tài liệu dự án (FSD/BRD hoặc NotebookLM) và tự bật skill + tạo thư mục tài liệu phù hợp
argument-hint: [--notebook <tên|url>] [--clouds a,b]
---
Dùng skill `project-skill-sync` với: $ARGUMENTS
1) Đọc nguồn (docs/brd, docs/fsd, NotebookLM nếu có MCP). 2) Lập bảng tín hiệu kèm bằng chứng. 3) Ghi `docs/skill-plan.md`
và DỪNG hỏi tôi xác nhận trước khi bật bất kỳ cloud/skill nào. Nếu có `--clouds`, coi đó là danh sách tôi đã chốt và vẫn trình kế hoạch skill đi kèm.
