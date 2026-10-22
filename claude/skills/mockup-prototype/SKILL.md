---
name: mockup-prototype
description: Dựng nhanh mockup/prototype LWC hoặc Experience Cloud trên Org từ mockup-kit, dùng mock data để demo sớm. Dùng khi bắt đầu dự án, cần demo cho khách hàng, hoặc cần màn hình mẫu.
---

# Mockup / Prototype Workflow

1. Đọc `docs/journeys/` và `docs/business-rules.md`; nếu chưa có journey, chạy skill `journey-mapping` trước.
2. Lập danh sách màn hình `SCR-xx` trong `docs/screens.md`, mỗi màn hình gắn journey step.
3. Chọn template trong `prototype/lwc/` (listFilterTable, multiStepForm, kpiDashboard, approvalPanel, portalLayout); copy + đổi tên cho đúng màn hình.
4. Mọi dữ liệu đi qua `c/mockDataProvider`; sửa `mockData.js` cho sát field trong `data-model.md`.
5. Chạy `npm run test:unit`; đổi ID `BR-000` trong test mẫu thành BR thật.
6. Deploy lên sandbox theo `mockup-kit/deploy-prototype.md`.
7. Soạn `prototype/demo-script.md` từ journey.
8. Khi khách chốt: dùng `tdd-workflow` để thay từng hàm trong `mockDataProvider` bằng Apex thật (test trước), giữ nguyên chữ ký.

Nguyên tắc: prototype không chứa logic nghiệp vụ thật (trừ ví dụ minh họa BR); giả định ghi vào `docs/decisions/`.
