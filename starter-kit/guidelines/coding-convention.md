# Coding Convention
- Apex: PascalCase class, camelCase method; 1 trigger/object + handler; test class `<Class>Test`.
- LWC: camelCase thư mục; xử lý lỗi bằng toast; ưu tiên @wire cho đọc, imperative cho ghi.
- Không viết comment trong code (Apex, LWC, test). Tên rõ nghĩa + method nhỏ thay cho chú thích.
- Mọi LWC/Apex action đổi dữ liệu phải refresh giao diện ngay: `refreshApex` cho wire Apex, `notifyRecordUpdateAvailable`/`RefreshEvent` cho record page/quick action/tab, xóa `draftValues`, reset loading. Apex imperative call xong thì LWC gọi phải refresh.
- Chi tiết xem `claude/skills/apex-conventions` và `lwc-patterns`.
