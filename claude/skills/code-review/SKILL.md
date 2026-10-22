---
name: code-review
description: Quy trình review code Salesforce (Apex, LWC, metadata) theo convention của team. Dùng khi người dùng nhờ review diff, PR, hoặc kiểm tra code trước khi merge.
---

# Code Review Workflow

1. Xem diff: `git diff origin/main...HEAD --stat` rồi từng file.
2. Đối chiếu với skill `apex-conventions` và `lwc-patterns`.
3. Checklist bắt buộc:
   - [ ] Không SOQL/DML trong vòng lặp; xử lý bulk (200 records)
   - [ ] CRUD/FLS + sharing (`with sharing` mặc định)
   - [ ] **TDD:** có test cho mọi thay đổi hành vi, test gắn ID BR, không có test bị skip
   - [ ] Test có assert có ý nghĩa, coverage >= 85% (xem `apex-test-generator`)
   - [ ] **Truy vết:** `docs/traceability.md` đã cập nhật; BR mới đã được xác nhận (không còn "đề xuất")
   - [ ] Không hard-code Id, URL, credential
   - [ ] LWC: xử lý lỗi + toast, không gọi Apex thừa, có Jest
   - [ ] Metadata: permission set đã cập nhật, package.xml đủ
   - [ ] Prototype: không để `mockDataProvider` lọt vào luồng production
4. Phân loại phát hiện: **Blocker / Major / Minor / Gợi ý**.
5. Xuất kết quả: bảng `file:dòng | mức độ | vấn đề | đề xuất sửa`.
