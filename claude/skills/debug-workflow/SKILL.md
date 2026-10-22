---
name: debug-workflow
description: Quy trình debug Salesforce (Apex, LWC, flow, governor limit). Dùng khi người dùng báo lỗi, exception, debug log, hoặc dữ liệu không hiển thị/không refresh.
---

# Debug Workflow

1. **Tái hiện**: xác định org, user, record, các bước. Chưa sửa khi chưa tái hiện được.
2. **Thu thập**: debug log (`sf apex tail log`), browser console, network tab (LWC).
3. **Khoanh vùng**: trigger/flow/validation rule/LWC? Dùng execution order để loại trừ.
4. **Nguyên nhân gốc**: ưu tiên kiểm tra governor limit, null/empty, sharing/FLS, cache (`refreshApex`).
5. **Sửa nhỏ nhất có thể** + viết test tái hiện lỗi.
6. **Ghi lại**: nguyên nhân + cách sửa vào `docs/notes/`.
