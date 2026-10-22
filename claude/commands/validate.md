---
description: Dry-run deploy lên sandbox (không deploy thật)
argument-hint: <org-alias>
---
Dùng skill `deploy-checklist`: build manifest từ diff, chạy
`sf project deploy validate -o $ARGUMENTS --test-level RunLocalTests` và tóm tắt kết quả/lỗi.
