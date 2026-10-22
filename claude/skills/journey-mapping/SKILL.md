---
name: journey-mapping
description: Biến yêu cầu thô, ghi chú họp, hoặc mô tả nghiệp vụ thành user journey có ID (J-xx), danh sách màn hình (SCR-xx), business rule ứng viên (BR-xx) và acceptance criteria. Dùng khi bắt đầu dự án/tính năng mới, khi cần làm rõ luồng người dùng, hoặc trước khi dựng prototype.
---

# Journey Mapping

## Đầu vào -> đầu ra
Đầu vào: yêu cầu thô (văn bản, ghi chú họp, ticket). Đầu ra:
1. `docs/journeys/J-xx-<ten>.md` theo `journey-template.md`
2. Cập nhật `docs/journeys/_index.md`
3. Màn hình đề xuất trong `docs/screens.md` (gắn template prototype phù hợp)
4. Business rule **ứng viên** trong `docs/business-rules.md`
5. Acceptance criteria dạng Given/When/Then, mỗi AC gắn BR
6. Dòng mới trong `docs/traceability.md`

## Quy trình
1. Xác định persona + mục tiêu trước; hỏi lại nếu yêu cầu không nói rõ ai dùng.
2. Liệt kê bước theo góc nhìn người dùng (động từ + kết quả), mỗi bước một ID `J-xx.n`.
3. Với mỗi bước, tìm màn hình, hệ thống phản hồi gì, quy tắc nào chi phối.
4. Tìm luồng ngoại lệ (lỗi, thiếu quyền, dữ liệu trống, trùng, hủy giữa chừng).
5. Gom câu hỏi còn mở, **không tự lấp bằng suy đoán**.

## Quy tắc
- Business rule do Claude suy ra phải đánh dấu `(đề xuất - cần xác nhận)`; chỉ khi người phụ trách nghiệp vụ chốt mới bỏ dấu.
- Mỗi AC phải kiểm thử được, nếu không viết được test thì AC còn mơ hồ.
- Không đặt tên field/object thật nếu `data-model.md` chưa có; ghi `(cần xác định)`.
- Journey xong thì chuyển sang skill `mockup-prototype` (màn hình) và `tdd-workflow` (test).
