---
name: manufacturing-cloud
description: Khung làm việc cho Manufacturing Cloud - Sales Agreement, Account-Based/Advanced Account Forecasting, Rebate Management, run-rate vs. actuals, Partner Visit. Dùng khi dự án đề cập Manufacturing Cloud, sales agreement, account forecast, rebate, run-rate.
---

# Manufacturing Cloud
> Trạng thái: starter v0.1. Tên object/field và tính năng thay đổi theo release và license. **Luôn xác minh trên org thật** (`sf sobject list`, `sf sobject describe -s <Obj>`, retrieve metadata) thay vì dựa vào trí nhớ hay tài liệu cũ.

## Trước khi thiết kế
1. Xác nhận license/permission set license của Manufacturing Cloud đã có trên org; chưa có thì dừng và báo, đừng tạo object tay để "giả".
2. Chốt phạm vi tính năng với khách, ghi vào `docs/manufacturing/`: Sales Agreement, Forecasting (loại nào), Rebate, Run-rate, Partner Visit.
3. Điền `docs/domain-map.md`: object nào đang LIVE theo từng luồng (dự án hay đổi thiết kế giữa chừng).

## Quy tắc làm việc
- **Sales Agreement**: mô tả vòng đời trạng thái, ai chuyển, amendment/renewal, và cách schedule theo kỳ được sinh (`docs/manufacturing/sales-agreements.md`). Mỗi quy tắc đặt BR-xx.
- **Forecasting**: ghi nguồn dữ liệu (Order, Opportunity, Sales Agreement, ERP), kỳ và độ chi tiết; nếu cần nạp từ ERP thì mô tả ở `docs/integrations.md` (tần suất, retry, khóa đối chiếu).
- **Actual vs. planned (run-rate)**: chốt nguồn dữ liệu thực tế và cách đối chiếu; tính toán lớn dùng Batch/Queueable theo `apex-conventions` (bulk 200+).
- **Rebate**: điều kiện đạt, kỳ tính, payout; luôn kèm ví dụ số đã được người phụ trách nghiệp vụ xác nhận trước khi viết test.
- Dữ liệu demo đặt trong `docs/manufacturing/sample-data/`, không dùng dữ liệu thật của khách.

## Hỏi lại khi thiếu
Dùng loại forecast nào? Đơn vị/tiền tệ/kỳ? Nguồn actuals là gì? Quy tắc amendment? Ai duyệt rebate?
